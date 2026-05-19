# Local Source Intake Workflow

This document defines the first source intake workflow for FM-Stock.

The goal is simple: users should not manually edit JSON files just to add new source materials. They should be able to drop files into a local inbox, paste links into a text file, and run one local command to create candidate source records for review.

## Why this is local-only

The app is currently a static HTML/CSS/JS MVP. A browser-only page cannot reliably rename files, move files, or write directly to arbitrary local folders without a backend or special browser APIs.

For the first implementation, use a serverless local Node script. A web dashboard with drag-and-drop can be added later if a local backend is introduced.

## Folder layout

Create this sibling folder next to the GitHub repository:

```text
workdiary/
├── 10000-fm-stock/
└── 10000-fm-stock-local-sources/
    ├── inbox/
    │   ├── files/
    │   └── links/
    │       └── links.txt
    ├── processed/
    ├── candidates/
    └── logs/
```

Only the `10000-fm-stock/` folder is the GitHub repository. The `10000-fm-stock-local-sources/` folder is local-only and must not be committed.

The repository `.gitignore` already blocks common source-original file types and `*-local-sources/` folders.

## User workflow

1. Drop PDFs, documents, images, or text files into:

```text
10000-fm-stock-local-sources/inbox/files/
```

2. Paste YouTube, report, or web links into:

```text
10000-fm-stock-local-sources/inbox/links/links.txt
```

3. Run from the repository root:

```bash
node scripts/intake-local-sources.js
```

4. Review generated candidates:

```text
10000-fm-stock-local-sources/candidates/sources.candidate.json
10000-fm-stock-local-sources/logs/intake-log.jsonl
```

## Candidate record shape

The first slice only creates source candidates. It does not parse report text, extract transcripts, generate segments, or create claims.

Example:

```json
{
  "id": "source_20260520_001",
  "type": "youtube",
  "title": "YouTube source 20260520 001",
  "url": "https://www.youtube.com/watch?v=abc123",
  "privatePath": "",
  "publisher": "",
  "publishedAt": "",
  "addedAt": "2026-05-20T03:00:00.000Z",
  "visibility": "public",
  "memo": "Candidate generated from local intake",
  "status": "candidate",
  "official": false
}
```

## Type classification

The script uses basic classification:

| Input | Type |
|---|---|
| YouTube URL | `youtube` |
| Other URL | `web` |
| `.pdf` | `report` |
| `.doc`, `.docx`, `.hwp`, `.hwpx`, `.txt`, `.md` | `document` |
| `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` | `image` |
| Anything else | `file` |

## What this script does not do yet

- It does not move or rename source files.
- It does not parse PDF/DOCX/HWP text.
- It does not call a local model.
- It does not generate `segments.json` or `claims.json`.
- It does not promote candidates into official `data/*.json`.
- It does not require a local server.

Those should be added in later slices after the inbox contract is stable.

## Later slices

Recommended next steps:

1. Add optional file renaming and `processed/` movement.
2. Add duplicate detection using file hash and normalized URL.
3. Add transcript/text extraction into `extracted/`.
4. Add local model extraction to generate segment and claim candidates.
5. Add a review workflow that promotes candidate records into `data/*.json`.
6. Add a local dashboard only if the script workflow becomes too limiting.
