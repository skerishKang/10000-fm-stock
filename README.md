# 10000 FM Stock

FM-Stock is a static MVP for recording public stock and industry statements made by analysts, YouTubers, broadcast guests, investors, and report authors, then evaluating those statements after a 6-12 month horizon.

The project has two product goals:

1. Verify whether public stock or industry forecasts were directionally and quantitatively useful.
2. Preserve useful industry and company knowledge from public videos and reports as educational notes.

## Current MVP scope

The MVP is intentionally static:

- HTML
- CSS
- Vanilla JavaScript
- JSON data files

The MVP does not use a database, login system, Firebase, Supabase, backend API, automatic crawler, live price API, or broker API.

## Source storage policy

Original source files are not stored or redistributed in this repository.

Allowed references include:

- source URL
- YouTube start/end time
- report URL or local privatePath
- report page or section
- short operator memo
- structured claim, evaluation, and knowledge note JSON

Do not commit:

- original videos
- original report PDFs
- full raw transcripts
- copied full report text
- downloaded source archives
- API keys, app secrets, account credentials, certificates, or tokens

Raw working materials should stay in a sibling local folder such as:

```text
/mnt/g/Ddrive/BatangD/task/workdiary/
├── 10000-fm-stock/
└── 10000-fm-stock-local-sources/
```

## Local static server

Run the static site locally from the repository root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Operator workflow

Use this flow for manual curation:

```text
SourceHub candidate input
-> research workspace export template
-> promotion checklist review
-> official data edit
-> local validator
-> PR review
```

Relevant files:

- SourceHub page: `pages/source-hub.html`
- SourceHub candidate sample: `data/candidate-sources.sample.json`
- Candidate source export template: `research-workspace/exports/candidate-sources.template.json`
- Claim candidate export template: `research-workspace/exports/claim-candidates.template.json`
- Knowledge note candidate export template: `research-workspace/exports/knowledge-note-candidates.template.json`
- Promotion checklist: `docs/promotion-checklist.md`
- Official data editing guide: `docs/data-editing-guide.md`
- Data sourcing strategy: `docs/mvp-data-sourcing-strategy.md`
- Local validator: `scripts/validate-data.js`

Candidate records in the research workspace must remain `status: "candidate"` and `official: false` until human review promotes them into official `data/*.json` files.

## Data validation

Run the local JSON contract validator before and after changing any data files under `data/` or JSON templates under `research-workspace/exports/`:

```bash
node scripts/validate-data.js
```

The validator checks static MVP data contracts including:

- JSON parse and array root shape
- record id presence and duplicate ids
- claim references to experts, sources, and segments
- evaluation references to claims
- knowledge note references
- key enum values
- candidate source `status: "candidate"` and `official: false`
- research workspace JSON template baseline rules

Expected successful output ends with:

```text
Validation passed.
```

A data-changing PR should not be considered ready if this command fails.

## Development rules

- Do not modify or push directly to `main`.
- Use branch -> PR -> review -> squash merge.
- Keep each HTML/CSS/JS file under roughly 500 lines where practical.
- Prefer folder-name/file-name module splits.
- Keep frontend changes, local tooling changes, and policy documentation in separate PRs when possible.
- Do not promote candidate data to official data without human review.
