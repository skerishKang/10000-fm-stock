# FM-Stock YouTube Transcriber & Claim Analyzer (Modal)

Serverless GPU pipeline for transcribing Korean financial YouTube videos and extracting stock-related claims using AI.

**Pipeline:** YouTube URL → audio download (yt-dlp) → Whisper large-v3 transcription → Qwen2.5-7B-Instruct claim analysis → candidate JSON output

## Prerequisites

- Python 3.10+
- [Modal](https://modal.com) account (free tier includes $30/month GPU credits)
- Modal CLI installed and configured

## Setup

### 1. Install Modal CLI

```bash
pip install modal
```

### 2. Configure Modal Token

```bash
modal token new
```

This opens a browser window to authenticate with your Modal account and generates API tokens locally (saved in `~/.modal.toml`). No tokens are stored in this repository.

### 3. Verify Setup

```bash
modal profile current
modal environment ls
```

## Usage

### Basic Run

```bash
cd 10000-fm-stock/
modal run scripts/modal-transcribe/app.py -- --url "https://youtu.be/VIDEO_ID"
```

Replace `VIDEO_ID` with any YouTube video ID or full URL.

### Examples

```bash
# Using full URL
modal run scripts/modal-transcribe/app.py -- --url "https://www.youtube.com/watch?v=xxxxxx"

# Using short URL
modal run scripts/modal-transcribe/app.py -- --url "https://youtu.be/xxxxxx"

# With playlist flag (only processes first video)
modal run scripts/modal-transcribe/app.py -- --url "https://youtube.com/watch?v=xxxxxx&list=xxxx"
```

### First Run (Cold Start)

The first invocation downloads model weights (Whisper large-v3 ~3GB, Qwen2.5-7B ~15GB quantized to ~4GB) and caches them in a Modal Volume. Expect **3–5 minutes** for the initial run. Subsequent runs use cached models and are much faster.

## Output

The result is saved as a JSON file in `candidate/youtube_candidates/`:

```
candidate/youtube_candidates/
└── candidate-20250514-<video_id>.json
```

### Output Schema

```json
{
  "type": "youtube_candidate",
  "sourceUrl": "https://youtube.com/watch?v=...",
  "videoTitle": "video title",
  "channelName": "channel name",
  "publishedAt": "YYYY-MM-DD",
  "segments": [
    {
      "startTime": "HH:MM:SS",
      "endTime": "HH:MM:SS",
      "summary": "..."
    }
  ],
  "candidateClaims": [
    {
      "ticker": "005930",
      "companyName": "삼성전자",
      "industry": "반도체",
      "claimType": "stock_forecast",
      "direction": "bullish",
      "claimText": "...",
      "evidence": ["..."],
      "baseDate": "2025-05-01",
      "basePrice": 78000,
      "targetDate": "2025-11-01",
      "targetPrice": 95000,
      "timeHorizon": "6M"
    }
  ]
}
```

## Architecture

### Files

| File | Purpose |
|------|---------|
| `app.py` | Modal app definition, entrypoints, orchestration |
| `whisper_utils.py` | Whisper large-v3 model loading & Korean transcription |
| `claim_extractor.py` | Qwen2.5-7B-Instruct loading & financial claim extraction |
| `requirements.txt` | Python dependencies |

### How It Works

1. **`modal run`** invokes the local entrypoint (`main()`)
2. The local entrypoint calls `process_youtube.remote(url)` on Modal's cloud infrastructure
3. **In the cloud (T4 GPU container):**
   - `yt-dlp` downloads audio and fetches metadata
   - `Whisper large-v3` transcribes Korean speech to text
   - Whisper is unloaded and GPU memory is freed
   - `Qwen2.5-7B-Instruct` (4-bit quantized) extracts financial claims
   - Result JSON is returned to the local machine
4. **Locally:** the JSON is saved to `candidate/youtube_candidates/`

### Model Caching

Model weights are stored in a Modal Volume (`fm-stock-hf-cache`) mounted at `/root/.cache/`. This persists across runs and reduces cold-start latency.

- **Whisper large-v3**: ~3 GB (downloaded once)
- **Qwen2.5-7B-Instruct (4-bit)**: ~4 GB (downloaded once)

## Limitations & Constraints

- **No raw media stored**: Audio files are downloaded to a temporary directory and deleted after transcription.
- **No modification of `data/*.json`**: Output goes only to `candidate/youtube_candidates/`.
- **Korean transcription**: Whisper is configured for Korean (`language="ko"`). Works well with mixed Korean/English.
- **Transcript length**: Truncated to ~12,000 characters for LLM context window.
- **T4 GPU (16GB VRAM)**: Models are loaded sequentially with memory cleanup between steps.
- **yt-dlp restrictions**: YouTube may rate-limit or block downloads. Using a VPN or cookies may help for high-volume usage.
- **Audio quality**: Background music, low volume, or overlapping speech can reduce transcription accuracy.

## Troubleshooting

### "No module named 'whisper'"

Ensure Modal has the correct image built:
```bash
modal image rebuild fm-stock-transcriber
```

### "Failed at step 'downloading audio'"

- Check that the URL is valid and the video is publicly accessible
- YouTube may block downloads in some regions; try with a VPN
- Pass cookies to yt-dlp using `--cookies-from-browser` (requires local browser installation)

### "CUDA out of memory"

- The T4 has 16GB VRAM. The pipeline loads whisper (~6GB) and Qwen (~4GB) sequentially with cleanup.
- If other Modal functions are running, try again in a few minutes.
- Reduce `MAX_TRANSCRIPT_CHARS` in `claim_extractor.py` if needed.

### "HTTP Error 429" (Rate Limited)

YouTube rate-limiting is common. Add a delay or use authenticated download:
```bash
# Add to yt-dlp command in app.py:
"--sleep-interval", "5",
"--max-sleep-interval", "30",
```

## Advanced Configuration

### Using Modal Secrets for HuggingFace Token

If you need gated models or experience download issues:

```bash
modal secret create huggingface-token --env HF_TOKEN=hf_your_token_here
```

Then uncomment the `secrets` parameter in `app.py`:
```python
@app.function(
    ...,
    secrets=[modal.Secret.from_name("huggingface-token")],
)
```

### Changing the LLM Model

Edit `claim_extractor.py` and change `MODEL_ID`. Models known to work well for Korean financial text:
- `Qwen/Qwen2.5-7B-Instruct` (default)
- `Qwen/Qwen2.5-14B-Instruct` (requires A100 or larger GPU)
- `google/gemma-2-9b-it` (good multilingual support)
- `LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct` (Korean-native model)

## References

- [Modal Documentation](https://modal.com/docs)
- [Whisper (OpenAI)](https://github.com/openai/whisper)
- [Qwen2.5 (Alibaba)](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
