"""
Whisper transcription utilities for Korean (and multilingual) speech.

Uses openai-whisper large-v3 model for high-accuracy Korean transcription.
Includes GPU memory management helpers.
"""

import whisper
import torch
from typing import Optional

MODEL_NAME = "large-v3"

# Module-level cache so we don't reload across calls within same container
_model: Optional[whisper.Whisper] = None


def load_whisper_model() -> whisper.Whisper:
    """
    Load Whisper large-v3 model with module-level cache.

    Returns:
        Loaded Whisper model instance.
    """
    global _model
    if _model is None:
        _model = whisper.load_model(MODEL_NAME)
    return _model


def transcribe_korean(
    model: whisper.Whisper,
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


def cleanup() -> None:
    """
    Free GPU memory used by Whisper.
    Call this after transcription to make room for LLM.
    """
    global _model
    _model = None
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


# ---------------------------------------------------------------------------
# Convenience: one-shot transcribe (load → transcribe → cleanup)
# ---------------------------------------------------------------------------

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
        cleanup()
