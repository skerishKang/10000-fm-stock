"""
LLM-based financial claim extraction from Korean YouTube transcripts.

Uses Qwen/Qwen2.5-7B-Instruct with 4-bit quantization for T4 compatibility.
Extracts verifiable stock/investment claims matching the FM-Stock claims.json schema.
"""

import json
import re
import torch
from typing import Optional, List, Dict, Any

from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    pipeline,
    BitsAndBytesConfig,
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"
MAX_TRANSCRIPT_CHARS = 12_000  # Truncate transcript to fit context window

# Module-level cache
_pipe: Optional[pipeline] = None

# ---------------------------------------------------------------------------
# Korean financial claim extraction prompt (polite/formal tone)
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """당신은 금융 전문가의 주식 발언을 분석하는 AI 어시스턴트입니다.
유튜브 전사본에서 전문가가 언급한 주식 관련 claim(주장)을 추출해 주세요.

각 claim은 반드시 아래 JSON 형식으로 출력해주세요:

{
  "ticker": "종목코드 (없으면 빈 문자열)",
  "companyName": "회사명",
  "industry": "산업분류",
  "claimType": "stock_forecast | market_forecast | earnings_estimate | other",
  "direction": "bullish | bearish | neutral | educational_only",
  "claimText": "전문가의 주장을 간결하게 요약 (한국어)",
  "evidence": ["근거1", "근거2"],
  "baseDate": "기준일자 (YYYY-MM-DD, 모르면 오늘 날짜)",
  "basePrice": 기준가격 (숫자, 없으면 null),
  "targetDate": "목표일자 (YYYY-MM-DD, 없으면 null)",
  "targetPrice": 목표가격 (숫자, 없으면 null),
  "timeHorizon": "기간 (1M/3M/6M/1Y, 예측 불가면 null)"
}

규칙:
1. 검증 가능한 투자 관련 claim만 추출하세요.
   예: "삼성전자 목표주가 9만원", "SK하이닉스 2분기 영업이익 5조 전망"
2. 단순한 설명이나 교육적 내용은 제외하세요.
3. 각 claim은 하나의 회사/주제에 집중하세요.
4. claimText는 원문 복사가 아닌 간결한 요약으로 작성하세요.
5. 방향성(direction)을 명확히 구분하세요:
   - bullish: 긍정/상승 전망
   - bearish: 부정/하락 전망
   - neutral: 중립적 의견
   - educational_only: 투자 추천이 아닌 교육적 설명
6. 불확실한 내용은 evidence에 "불확실"이라고 표시하세요.
7. 전사본에 추출할 claim이 없으면 빈 배열 []을 반환하세요."""


def load_llm() -> pipeline:
    """
    Load Qwen2.5-7B-Instruct with 4-bit NF4 quantization.
    Suitable for T4 (16GB VRAM) alongside other workloads.

    Returns:
        HuggingFace text-generation pipeline.
    """
    global _pipe
    if _pipe is not None:
        return _pipe

    quantization_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
    )

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        quantization_config=quantization_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.float16,
    )

    _pipe = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=2048,
        temperature=0.1,
        do_sample=False,
        pad_token_id=tokenizer.eos_token_id,
    )
    return _pipe


def extract_claims(
    pipe: pipeline,
    transcript_text: str,
    video_info: Dict[str, str],
) -> List[Dict[str, Any]]:
    """
    Extract financial claims from a transcript using the LLM.

    Args:
        pipe: HuggingFace text-generation pipeline (from load_llm()).
        transcript_text: Full transcript text (will be truncated if too long).
        video_info: Dict with "title", "channel", "published_at", "url" keys.

    Returns:
        List of claim dicts matching the claims.json schema subset.
    """
    # Truncate to fit within context window
    if len(transcript_text) > MAX_TRANSCRIPT_CHARS:
        transcript_text = (
            transcript_text[:MAX_TRANSCRIPT_CHARS]
            + "\n\n[...전사본이 길어 일부를 생략했습니다...]"
        )

    user_message = (
        f"다음은 유튜브 영상의 전사(transcript)입니다.\n\n"
        f"영상 제목: {video_info.get('title', '')}\n"
        f"채널명: {video_info.get('channel', '')}\n"
        f"업로드 날짜: {video_info.get('published_at', '')}\n\n"
        f"전사본:\n{transcript_text}\n\n"
        f"위 전사본에서 전문가의 주식 관련 claim을 모두 추출하여 "
        f"JSON 배열로 출력해주세요. "
        f"배열만 출력하고 다른 설명이나 코드 블록 마크다운은 사용하지 마세요."
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    prompt = pipe.tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )

    outputs = pipe(
        prompt,
        max_new_tokens=2048,
        temperature=0.1,
        do_sample=False,
    )

    generated_text = outputs[0]["generated_text"]

    # Extract only the newly generated part (after the prompt)
    response = generated_text[len(prompt):].strip()

    claims = _parse_json_response(response)
    return claims


def _parse_json_response(response: str) -> List[Dict[str, Any]]:
    """
    Parse JSON array from LLM response, handling various output formats.

    Tries (in order):
      1. Direct JSON parse
      2. Extract from markdown ```json ... ``` blocks
      3. Extract first JSON-like array pattern

    Returns:
        List of claim dicts, or empty list on failure.
    """
    response = response.strip()

    # 1. Direct JSON parse
    try:
        parsed = json.loads(response)
        if isinstance(parsed, list):
            return parsed
        return []
    except json.JSONDecodeError:
        pass

    # 2. Markdown code block extraction
    json_match = re.search(r"```(?:json)?\s*(\[[\s\S]*?\])\s*```", response)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # 3. First array-like pattern
    array_match = re.search(r"(\[[\s\S]*?\])", response)
    if array_match:
        try:
            return json.loads(array_match.group(1))
        except json.JSONDecodeError:
            pass

    # 4. Try to find individual objects and build array
    objects = re.findall(r"\{[^{}]*\}", response)
    if objects:
        parsed_objects = []
        for obj_str in objects:
            try:
                parsed_objects.append(json.loads(obj_str))
            except json.JSONDecodeError:
                continue
        if parsed_objects:
            return parsed_objects

    return []


def cleanup() -> None:
    """
    Free GPU memory used by the LLM.
    """
    global _pipe
    _pipe = None
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


# ---------------------------------------------------------------------------
# Convenience: one-shot extract (load → extract → cleanup)
# ---------------------------------------------------------------------------

def extract(transcript_text: str, video_info: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    One-shot convenience: load LLM, extract claims, cleanup, return result.

    Args:
        transcript_text: Full transcript text.
        video_info: Video metadata dict.

    Returns:
        List of claim dicts.
    """
    pipe = load_llm()
    try:
        return extract_claims(pipe, transcript_text, video_info)
    finally:
        cleanup()
