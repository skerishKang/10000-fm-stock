# Project Folder Map

This document defines the role and boundary of the top-level folders in the static FM-Stock MVP.

It is meant for human reviewers, agents, and future contributors who need to know where official app data, candidate materials, local-only working materials, documentation, and tooling should live.

## Repository-wide rules

- Keep source originals and private working materials outside this repository.
- Keep raw working materials in a sibling local-only folder such as `10000-fm-stock-local-sources/`.
- Use branch -> PR -> review -> squash merge. Do not push directly to `main`.
- Run `node scripts/validate-data.js` when changing official data under `data/` or JSON templates under `research-workspace/exports/`.
- Keep static MVP scope: HTML, CSS, vanilla JavaScript, JSON, local scripts, and documentation.

## Top-level folder roles

| Folder | Role | Boundary | Validation / review notes |
|---|---|---|---|
| `.github/` | GitHub Actions workflows and repository automation. | Workflow YAML only. Do not put app runtime code or source materials here. | Workflow changes should explain what event/path triggers are affected. |
| `.hermes/` | Agent or local orchestration metadata when present. | Treat as tool metadata. Do not store source originals or private working materials. | Review for accidental private material before committing. |
| `assets/` | Runtime static assets for the app: CSS, JavaScript, images, and frontend modules. | This is production/static MVP runtime code. Do not place raw research files or original reports here. | JS/CSS changes should run applicable Node checks and browser smoke where practical. |
| `candidate/` | Candidate or staging materials when used by the workflow. | Candidate materials are not official app data until reviewed and promoted. Do not store source originals. | Candidate JSON should remain clearly marked as candidate/non-official. |
| `data/` | Official app JSON data consumed by runtime pages and validator. | Only structured, reviewed app data belongs here. No raw transcripts, original PDFs, videos, or copied full report text. | Any change requires `node scripts/validate-data.js`. |
| `docs/` | Project documentation, policies, checklists, architecture notes, and review roadmaps. | Documentation only. Do not use docs as a storage location for source originals or raw transcripts. | Documentation PRs usually do not require data validation unless they alter data examples/templates. |
| `pages/` | Static HTML pages for the MVP UI. | HTML shell and script/style references only. No raw data dumps or source originals. | Run `node scripts/audit-static-assets.js` after asset reference changes. |
| `reports/` | Generated or summarized project reports if used. | Do not commit original report files, copied full reports, or downloaded archives. Store only generated summaries or short review artifacts that comply with source policy. | Review carefully for source-original leakage before PR. |
| `research-workspace/` | Structured research workflow templates and exports. | Workspace exports are candidate/staging artifacts, not automatically official app data. No original videos, PDFs, full transcripts, or copied full report text. | JSON templates/exports under `research-workspace/exports/` require `node scripts/validate-data.js`. |
| `scripts/` | Local tooling, validators, audits, smoke scripts, and maintenance utilities. | Scripts should be dependency-light and should not embed private material. | Tooling changes should document expected output and failure behavior. |
| `skills/` | Project or agent skill instructions when present. | Instructional material only. Do not place app runtime code, data, or source originals here. | Review for outdated or conflicting instructions. |

## Official data versus candidate data

Official runtime data lives in `data/*.json` and should be treated as reviewed app data. Candidate data should stay in `candidate/` or `research-workspace/exports/` until a human review promotes it into the official data files.

Candidate records should remain clearly marked as candidate and non-official until promotion.

## Local-only source boundary

The repository may reference source URLs, timestamps, report pages, report sections, short operator memos, and structured claim/evaluation/knowledge-note JSON. It must not redistribute source originals.

Keep private or bulky source materials outside the repository, for example:

```text
/mnt/g/Ddrive/BatangD/task/workdiary/
├── 10000-fm-stock/
└── 10000-fm-stock-local-sources/
```

The `10000-fm-stock-local-sources/` sibling folder is the correct place for local original materials if they are needed during manual research. Those files must not be committed.

## When to run validators

Run `node scripts/validate-data.js` for:

- changes to `data/*.json`
- changes to JSON templates or exports under `research-workspace/exports/`
- changes to scripts that affect data validation behavior

Run `node scripts/audit-static-assets.js` for:

- changes to `pages/*.html`
- changes to local CSS/JS asset references
- asset version query string changes

Run relevant smoke scripts for runtime logic changes, such as:

- `node scripts/smoke-return-metrics.js` after return/evaluation metric logic changes

## PR safety checklist

Before opening or merging a PR, confirm:

- Data files changed: yes/no
- Source originals added: no
- Raw transcripts or full report text added: no
- Private auth material added: no
- Backend/API/Auth/DB changes: no, unless explicitly in scope
- Required validation commands passed or the reason for not running them is documented
