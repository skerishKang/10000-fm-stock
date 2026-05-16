"""
FM-Stock YouTube Transcriber & Claim Analyzer — Modal App

Pipeline:
  YouTube URL → audio download (yt-dlp) → Whisper transcription (large-v3)
  → LLM claim extraction (Qwen2.5-7B-Instruct) → candidate JSON output

Usage:
  modal run scripts/modal-transcribe/app.py -- --url "https://youtu.be/..."

Output is saved locally to candidate/youtube_candidates/YYYYMMDD-<video_id>.json
"""

import json
import os
import re
import subprocess
import sys
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import modal


# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------

# Whisper model name
WHISPER_MODEL_NAME = "large-v3"

# LLM model configuration
LLM_MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"
MAX_TRANSCRIPT_CHARS = 12_000

# Module-level caches for GPU models
_whisper_model = None
_llm_pipe = None

# ===================================================================
# Inlined whisper_utils.py — Korean transcription with large-v3
# ===================================================================

WHISPER_MODEL_NAME = "large-v3"

# Module-level cache so we don't reload across calls within same container
_whisper_model: Optional[Any] = None


def load_whisper_model() -> Any:
    """
    Load Whisper large-v3 model with module-level cache.

    Returns:
        Loaded Whisper model instance.
    """
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model(WHISPER_MODEL_NAME)
    return _whisper_model


def transcribe_korean(
    model: Any,
    audio_path: str,
    word_timestamps: bool = True,
) -> dict:
    """
    Transcribe Korean audio using Whisper large-v3.

    Args:
        model: Loaded Whisper model instance.
        audio_path: Path to audio file (mp3/wav/m4a, anything ffmpeg can read).
        word_timestamps: If True, include per-word timestamps (default: True).

    Returns:
        Dict with keys:
            - "text": Full transcript text (str)
            - "segments": List of dicts with "start", "end", "text" keys
            - "language": Detected language code (str)
    """
    result = model.transcribe(
        audio_path,
        language="ko",
        task="transcribe",
        verbose=False,
        word_timestamps=word_timestamps,
    )

    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "start": seg["start"],
            "end": seg["end"],
            "text": seg["text"].strip(),
        })

    return {
        "text": result["text"].strip(),
        "segments": segments,
        "language": result.get("language", "ko"),
    }


def whisper_cleanup() -> None:
    """
    Free GPU memory used by Whisper.
    Call this after transcription to make room for LLM.
    """
    global _whisper_model
    _whisper_model = None
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


def transcribe(audio_path: str) -> dict:
    """
    One-shot convenience: load model, transcribe, cleanup, return result.

    Args:
        audio_path: Path to audio file.

    Returns:
        Same dict as transcribe_korean().
    """
    model = load_whisper_model()
    try:
        return transcribe_korean(model, audio_path)
    finally:
        whisper_cleanup()


# ===================================================================
# Inlined claim_extractor.py — LLM-based financial claim extraction
# ===================================================================

LLM_MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"
MAX_TRANSCRIPT_CHARS = 12_000  # Truncate transcript to fit context window

# Module-level cache
_llm_pipe: Optional[Any] = None

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


def load_llm() -> Any:
    """
    Load Qwen2.5-7B-Instruct with 4-bit NF4 quantization.
    Suitable for T4 (16GB VRAM) alongside other workloads.

    Returns:
        HuggingFace text-generation pipeline.
    """
    global _llm_pipe
    if _llm_pipe is not None:
        return _llm_pipe

    quantization_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
    )

    tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL_ID, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        LLM_MODEL_ID,
        quantization_config=quantization_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.float16,
    )

    _llm_pipe = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=2048,
        temperature=0.1,
        do_sample=False,
        pad_token_id=tokenizer.eos_token_id,
    )
    return _llm_pipe


def extract_claims(
    pipe: Any,
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


def llm_cleanup() -> None:
    """
    Free GPU memory used by the LLM.
    """
    global _llm_pipe
    _llm_pipe = None
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


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
        llm_cleanup()


# ===================================================================
# Modal App Definition
# ===================================================================

app = modal.App("fm-stock-transcriber")

# ---------------------------------------------------------------------------
# Container Image
# ---------------------------------------------------------------------------

image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install(
        # YouTube download
        "yt-dlp>=2024.12.0",
        # Whisper transcription
        "openai-whisper>=20240930",
        # PyTorch (Modal provides CUDA 12.x)
        "torch>=2.4.0",
        # HuggingFace Transformers for LLM
        "transformers>=4.45.0",
        "accelerate>=0.34.0",
        "bitsandbytes>=0.44.0",
        "safetensors>=0.4.0",
    )
)

# ---------------------------------------------------------------------------
# Shared volume for model caching (reduces cold-start latency)
# ---------------------------------------------------------------------------

MODEL_CACHE_DIR = "/cache/models"
model_cache = modal.Volume.from_name(
    "fm-stock-hf-cache", create_if_missing=True
)

# ---------------------------------------------------------------------------
# Local output path (relative to repo root when running `modal run`)
# ---------------------------------------------------------------------------

CANDIDATE_OUTPUT_DIR = Path("candidate/youtube_candidates")


# ===================================================================
# Core Pipeline Function (runs on Modal with T4 GPU)
# ===================================================================


@app.function(
    gpu="T4",
    image=image,
    scaledown_window=300,
    timeout=900,
    volumes={MODEL_CACHE_DIR: model_cache},
    retries=1,
)
def process_youtube(url: str) -> Dict[str, Any]:
    # Set cache environment variables to use the mounted volume
    os.environ["HF_HOME"] = MODEL_CACHE_DIR
    os.environ["TRANSFORMERS_CACHE"] = MODEL_CACHE_DIR
    os.environ["XDG_CACHE_HOME"] = MODEL_CACHE_DIR

    """
    Full pipeline: download YouTube audio, transcribe, extract claims.

    Args:
        url: YouTube video URL.

    Returns:
        Candidate JSON dict with keys:
          type, sourceUrl, videoTitle, channelName, publishedAt,
          segments, candidateClaims
    """
    step = "initializing"
    video_title = ""
    channel_name = ""
    published_at = ""

    try:
        # ==============================================================
        # STEP 1 — Download audio with yt-dlp
        # ==============================================================
        step = "downloading audio"
        with tempfile.TemporaryDirectory() as tmpdir:
            # Fetch metadata first
            metadata = _get_video_metadata(url)
            video_title = metadata.get("title", "")
            channel_name = metadata.get("channel", "")
            published_at = metadata.get("published_at", "")

            # Download audio track
            audio_template = os.path.join(tmpdir, "audio.%(ext)s")
            subprocess.run(
                [
                    "yt-dlp",
                    "-x",  # extract audio
                    "--audio-format", "mp3",
                    "--audio-quality", "0",  # best quality
                    "--no-playlist",
                    "--extractor-args", "youtube:player_client=android",
                    "-o", audio_template,
                    url,
                ],
                capture_output=True,
                check=True,
                timeout=600,
            )

            # yt-dlp may append extra extension; find the actual file
            audio_path = _find_audio_file(tmpdir)
            if audio_path is None:
                raise RuntimeError(
                    "yt-dlp did not produce an audio file in the temp directory"
                )

            # ==========================================================
            # STEP 2 — Transcribe with Whisper large-v3
            # ==========================================================
            step = "transcribing with Whisper"
            whisper_model = load_whisper_model()
            try:
                transcript_result = transcribe_korean(whisper_model, audio_path)
            finally:
                whisper_cleanup()  # free GPU memory for LLM

            transcript_text = transcript_result["text"]
            transcript_segments = transcript_result["segments"]

            if not transcript_text.strip():
                raise RuntimeError(
                    "Whisper returned empty transcript — audio may be silent or corrupted"
                )

            # ==========================================================
            # STEP 3 — Extract claims with LLM
            # ==========================================================
            step = "extracting claims with LLM"
            video_info = {
                "title": video_title,
                "channel": channel_name,
                "published_at": published_at,
                "url": url,
            }

            llm_pipe = load_llm()
            try:
                claims = extract_claims(llm_pipe, transcript_text, video_info)
            finally:
                llm_cleanup()

            # ==========================================================
            # STEP 4 — Build segment summaries from Whisper output
            # ==========================================================
            segments = _build_segments(transcript_segments)

            # ==========================================================
            # STEP 5 — Assemble output candidate JSON
            # ==========================================================
            return {
                "type": "youtube_candidate",
                "sourceUrl": url,
                "videoTitle": video_title,
                "channelName": channel_name,
                "publishedAt": published_at,
                "segments": segments,
                "candidateClaims": claims,
            }

    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.decode("utf-8", errors="replace") if isinstance(exc.stderr, bytes) else (exc.stderr or str(exc))
        raise RuntimeError(f"yt-dlp failed at step '{step}': {stderr[:1000]}")
    except Exception as exc:
        raise RuntimeError(f"Pipeline failed at step '{step}': {exc}")


# ===================================================================
# Local Entrypoint (runs on user's machine)
# ===================================================================


@app.local_entrypoint()
def main(url: str) -> None:
    """
    Run the pipeline and save the candidate JSON locally.

    Usage:
        modal run scripts/modal-transcribe/app.py -- --url "https://youtu.be/..."
    """
    print(f"🚀  Processing: {url}")
    print(f"    Title:      {_video_title_preview(url)}")

    result = process_youtube.remote(url)

    # Generate output filename
    video_id = _extract_video_id(url)
    date_str = datetime.now().strftime("%Y%m%d")
    filename = f"candidate-{date_str}-{video_id}.json"

    # Ensure output directory exists
    output_dir = Path(CANDIDATE_OUTPUT_DIR).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    n_claims = len(result.get("candidateClaims", []))
    n_segments = len(result.get("segments", []))

    print()
    print(f"✅  Candidate saved: {output_path}")
    print(f"📊  Claims extracted: {n_claims}")
    print(f"📝  Transcript segments: {n_segments}")
    print(f"🎬  Video: {result.get('videoTitle', '')}")
    print(f"📺  Channel: {result.get('channelName', '')}")


# ===================================================================
# Helpers
# ===================================================================


def _get_video_metadata(url: str) -> Dict[str, str]:
    """Fetch YouTube video metadata without downloading."""
    result = subprocess.run(
        [
            "yt-dlp",
            "--print", "%(title)s",
            "--print", "%(channel)s",
            "--print", "%(upload_date)s",
            "--no-warnings",
            url,
        ],
        capture_output=True,
        text=True,
        check=True,
        timeout=30,
    )
    lines = result.stdout.strip().split("\n")
    title = lines[0] if len(lines) > 0 else ""
    channel = lines[1] if len(lines) > 1 else ""
    upload_date = lines[2] if len(lines) > 2 else ""

    published_at = ""
    if len(upload_date) == 8:
        published_at = (
            f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:8]}"
        )

    return {
        "title": title,
        "channel": channel,
        "published_at": published_at,
    }


def _video_title_preview(url: str) -> str:
    """Get a short video title preview for logging."""
    try:
        meta = _get_video_metadata(url)
        title = meta.get("title", "")
        if len(title) > 60:
            return title[:57] + "..."
        return title
    except Exception:
        return "(could not fetch title)"


def _extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    if "v=" in url:
        vid = url.split("v=")[-1].split("&")[0]
    elif "youtu.be/" in url:
        vid = url.split("youtu.be/")[-1].split("?")[0]
    else:
        vid = uuid.uuid4().hex[:8]
    # Sanitize
    vid = "".join(c for c in vid if c.isalnum() or c in "-_")
    return vid if len(vid) <= 20 else vid[:20]


def _find_audio_file(directory: str) -> Optional[str]:
    """
    Find the audio file produced by yt-dlp in the given directory.

    yt-dlp with `-x --audio-format mp3 -o audio.%(ext)s` typically
    produces `audio.mp3` but may append a suffix if the file exists.
    """
    for fname in os.listdir(directory):
        fpath = os.path.join(directory, fname)
        if os.path.isfile(fpath) and fname.endswith(".mp3"):
            return fpath
    # Fallback: try any audio-like extension
    audio_exts = {".mp3", ".wav", ".m4a", ".opus", ".ogg", ".flac"}
    for fname in os.listdir(directory):
        fpath = os.path.join(directory, fname)
        if os.path.isfile(fpath) and os.path.splitext(fname)[1].lower() in audio_exts:
            return fpath
    # Try `audio.mp3` directly (yt-dlp may create `audio.mp3` without suffix)
    direct = os.path.join(directory, "audio.mp3")
    if os.path.exists(direct):
        return direct
    return None


def _build_segments(
    whisper_segments: List[Dict[str, Any]],
    max_segments: int = 50,
) -> List[Dict[str, str]]:
    """Convert Whisper segments to output format with HH:MM:SS timestamps."""
    segments = []
    for seg in whisper_segments[:max_segments]:
        segments.append({
            "startTime": _format_timestamp(seg["start"]),
            "endTime": _format_timestamp(seg["end"]),
            "summary": seg["text"][:200],
        })
    return segments


def _format_timestamp(seconds: float) -> str:
    """Convert seconds (float) to HH:MM:SS format."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"
