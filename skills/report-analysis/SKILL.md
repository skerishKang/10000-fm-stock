---
name: report-analysis
description: "Use when extracting claims from brokerage reports, analyst PDFs, or financial research documents. Outputs candidate JSON aligned with data/claims.json schema."
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [research, brokerage, analyst-reports, claim-extraction, stock-forecast]
    related_skills: [evaluating-llms-harness]
---

# Report Analysis (Brokerage Report Claim Extraction)

## Overview

Extracts structured claim data from brokerage reports, analyst PDFs, and financial research documents for the 10000-fm-stock project. Outputs `report_candidate` JSON that aligns with the project's `data/claims.json`, `data/sources.json`, and `data/segments.json` schemas.

Designed for Korean securities reports from firms like 한국투자증권, 삼성증권, 미래에셋증권, etc., but works with any language report.

## When to Use

- User provides a PDF path, screenshot, or URL to a brokerage/analyst report
- User asks to "extract claims" or "analyze" a securities report
- Need to convert report content into FM-Stock data format
- Need to identify analyst predictions, target prices, and investment opinions

**Don't use for:** YouTube video analysis (use `research-workspace/prompts/expert-video-claim-extraction.md`), general stock research without a specific report, or data file editing (use `data-editing-guide.md`).

## Core Constraints

| Rule | Detail |
|------|--------|
| 원본 금지 | Original PDF/report body/transcripts must NEVER be stored in the repo |
| Reference only | Store URL, `privatePath`, page number, section location only |
| Paraphrase only | Summaries must be paraphrased — no direct quotes from source text |
| Schema compliance | Output must align with `data/claims.json` field structure |
| No direct edits | Never modify `data/*.json` files directly — output candidate JSON only |
| OCR disclaimer | Note OCR/scan errors when working with scanned PDFs or images |

## Analysis Steps

### Step 1: Identify Source

Extract and record:

| Field | Schema field | Notes |
|-------|-------------|-------|
| Report title | `sourceCandidate.title` | Full report title |
| Brokerage firm | `sourceCandidate.publisher` | 증권사명 (e.g., 한국투자증권, 삼성증권) |
| Analyst name | `sourceCandidate.speakerOrAuthor` | 애널리스트명 |
| Publication date | `sourceCandidate.publishedAt` | ISO format: `YYYY-MM-DD` |
| Document URL | `sourceCandidate.url` | Direct URL or null |
| Local file path | `sourceCandidate.privatePath` | Path relative to repo root (e.g., `reports/2026/05/...`) or null |

### Step 2: Extract Segments

For each distinct topic/section in the report:

| Field | Notes |
|-------|-------|
| `pageOrSection` | Page number + section name (e.g., "p.3, 반도체 업황 섹션") |
| `summary` | Paraphrased summary (1-2 sentences, no quotes) |

### Step 3: Extract Claims

For each verifiable forecast or prediction:

| Field | Notes |
|-------|-------|
| `expertId` | Analyst identifier (e.g., `analyst_김철수` or candidate name) |
| `ticker` | Stock ticker code (e.g., `005930` for 삼성전자) |
| `companyName` | Company name in Korean |
| `industry` | Industry sector (e.g., 반도체, 조선, 2차전지) |
| `direction` | `bullish` / `bearish` / `neutral` / `educational_only` |
| `basePrice` | Current/reference price at analysis date (numeric) |
| `targetPrice` | Predicted target price (numeric) |
| `baseDate` | Analysis/publication date in `YYYY-MM-DD` |
| `targetDate` | Target evaluation date in `YYYY-MM-DD` |
| `claimText` | Paraphrased claim body (1-3 sentences, no direct quotes) |
| `evidence` | 3-5 bullet points supporting the claim (paraphrased reasons) |

**Note:** The `data/claims.json` schema also requires `id`, `sourceId`, `segmentId`, `claimType`, `timeHorizon`, and `status`. These are assigned during promotion from candidate to official data. The candidate JSON does not include them.

### Step 4: Classify Claims vs Knowledge Notes

Use the decision table:

| Statement type | Destination |
|----------------|-------------|
| Clear stock direction + horizon | `claims.json` candidate |
| Clear target price/level | `claims.json` candidate |
| Earnings/profit estimate + period | `claims.json` candidate |
| Sector cycle explanation (no forecast) | Knowledge note |
| Business model explanation | Knowledge note |
| Risk factor explanation | Knowledge note |
| Vague opinion, no evaluable target | Reject or keep as candidate |
| Educational + forecast combined | Split into both |

## Output Format

```json
{
  "type": "report_candidate",
  "sourceInfo": {
    "title": "리포트 제목",
    "publisher": "증권사명",
    "speakerOrAuthor": "애널리스트명",
    "publishedAt": "2025-06-01",
    "url": "https://example.com/report"或 null,
    "privatePath": "reports/2026/05/..." 或 null
  },
  "segments": [
    {
      "pageOrSection": "p.3, 반도체 업황 섹션",
      "summary": "해당 페이지 요약 (의역, 인용 금지)"
    }
  ],
  "candidateClaims": [
    {
      "expertId": "analyst_name",
      "ticker": "005930",
      "companyName": "삼성전자",
      "industry": "반도체",
      "direction": "bullish",
      "basePrice": 50000,
      "targetPrice": 70000,
      "baseDate": "2025-06-01",
      "targetDate": "2025-12-31",
      "claimText": "의역된 claim 본문 (인용 금지)",
      "evidence": ["근거 1", "근거 2", "근거 3"]
    }
  ]
}
```

## File Processing Patterns

### PDF Files

1. Extract text if searchable PDF
2. If scanned PDF, use OCR/vision analysis
3. Note OCR errors/disclaimers if present

### Images (Screenshots/Charts)

1. Use vision analysis to extract text/numbers
2. Note any OCR uncertainty in output

### URLs

1. Store the report URL in `sourceInfo.url`
2. Do NOT scrape or store the full report content

## Error Handling

| Error | Action |
|-------|--------|
| OCR failure | Note reason, output what can be identified |
| Analyst unidentified | Use "unknown" or brokerage name as placeholder |
| Date unclear | Use best estimate, mark with note |
| Price unavailable | Omit `targetPrice` or mark as not specified |
| Full report too long | Focus on key claims sections, skip general market commentary |

## Local Source Paths

- Reports: `reports/YYYY/MM/` (inside repo root — folder structure tracked via `.gitkeep`, actual PDFs excluded by `.gitignore`)
- Filename pattern: `YYYYMMDD_hankyung_증권사_주제_회사명.pdf`
- Raw PDFs are gitignored by `*.pdf` rule; only folder structure and metadata committed

## Common Pitfalls

1. **Direct quote usage** — Always paraphrase. Never copy report text verbatim into `claimText` or `evidence`.
2. **Missing direction** — If bullish/bearish cannot be determined, classify as `educational_only` or skip as a claim (convert to knowledge note instead).
3. **Skipping horizon** — If no target date is stated, use standard horizons (1M/3M/6M/12M) based on report context, and note the assumption.
4. **Including full report in repo** — The `privatePath` reference is sufficient. Never commit PDFs, screenshots, or full transcripts.
5. **Outputting to `data/*.json` directly** — Always output candidate JSON. Human review and promotion required before editing data files.
6. **Missing basePrice** — If current price isn't stated in the report, look it up or omit. Don't fabricate values.
7. **Duplicating claims** — Check existing `data/claims.json` before generating candidates to avoid duplicates.

## Verification Checklist

- [ ] `sourceInfo` has publisher, analyst name, publication date
- [ ] Each segment has `pageOrSection` + paraphrased `summary`
- [ ] Each claim has ticker, company, direction, dates
- [ ] `claimText` is paraphrased, not a direct quote
- [ ] `evidence` has 3-5 bullet points
- [ ] No original report text copied into output
- [ ] No PDF/image file paths in data files (only references)
- [ ] Output is valid JSON matching candidate format
- [ ] Claims classified correctly (claim vs knowledge note vs reject)
