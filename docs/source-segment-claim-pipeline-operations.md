# Source → Segment → Claim Pipeline Operations Guide

## Purpose

This runbook covers the full source → segment → claim pipeline from local intake through official data promotion.

It is the operations-level companion to existing docs:

- `docs/promotion-checklist.md` — quality criteria and promotion safeguards
- `docs/source-intake-workflow.md` — local source intake setup and flow
- `docs/data-editing-guide.md` — static data editing rules and entity order

This document focuses on the actual script sequence, safety gates, and operator checkpoints.

## Operating principles

- Candidate and local source files are not official data.
- Preview files are review artifacts, not official data.
- Official data lives only in `data/*.json` inside the repository.
- Source originals must not be committed.
- Raw PDFs, videos, full transcripts, full report text, archives, secrets, API keys, credentials, certificates, and broker account material must not be committed.
- Preview generation must not write official data.
- Apply requires explicit `--apply` when supported.
- Dry-run is the default when supported.
- Validation must run after official data changes.
- Rollback must be verified after failed validation.

## Folder and file boundaries

### Repository files

- `data/*.json` — official static data
- `scripts/*.js` — pipeline scripts
- `docs/*.md` — documentation

### Local-only files (never commit)

- sibling `10000-fm-stock-local-sources/` folder
- `inbox/` — raw intake material
- `processed/` — moved after intake
- `candidates/` — local candidate records
- `reviews/` — review metadata
- `promotions/` — preview files
- `segments/` — segment candidates and previews
- `claims/` — claim candidates and previews
- `logs/` — generated logs

### Never commit

- source original files (PDF, DOCX, HWP, video, audio, images)
- full transcripts or copied report text
- downloaded archives
- API keys, secrets, credentials, certificates, tokens
- broker account material
- generated logs
- local candidate, review, or preview files

## End-to-end pipeline overview

| Stage | Purpose | Script | Writes official data? |
|---|---|---|---|
| 1. Local source intake | Create source candidates from inbox | `intake-local-sources.js` | No |
| 2. Source review init | Initialize review metadata for source candidates | `init-source-candidate-reviews.js` | No |
| 3. Source readiness | Check if source candidates are ready for promotion | `check-source-candidate-readiness.js` | No |
| 4. Source preview | Generate source promotion preview | `generate-source-promotion-preview.js` | No |
| 5. Source apply | Apply eligible source previews to `data/sources.json` | `apply-source-promotion-preview.js` | Yes |
| 6. Segment init | Create segment candidates for promoted sources | `init-segment-candidates.js` | No |
| 7. Segment readiness | Check if segment candidates are ready | `check-segment-candidate-readiness.js` | No |
| 8. Segment preview | Generate segment promotion preview | `generate-segment-promotion-preview.js` | No |
| 9. Segment apply | Apply eligible segment previews to `data/segments.json` | `apply-segment-promotion-preview.js` | Yes |
| 10. Claim init | Create claim candidates for segments | `init-claim-candidates.js` | No |
| 11. Claim readiness | Check if claim candidates are ready | `check-claim-candidate-readiness.js` | No |
| 12. Claim preview | Generate claim promotion preview | `generate-claim-promotion-preview.js` | No |
| 13. Claim apply | Apply eligible claim previews to `data/claims.json` | `apply-claim-promotion-preview.js` | Yes |
| 14. Validation | Verify official data integrity | `validate-data.js`, `smoke-return-metrics.js`, `audit-static-assets.js` | No |

## Stage 1. Local source intake

**Script:** `scripts/intake-local-sources.js`

**Purpose:** Read files and links from the local inbox and create source candidate records.

**Inputs:**
- `10000-fm-stock-local-sources/inbox/files/`
- `10000-fm-stock-local-sources/inbox/links/links.txt`

**Outputs:**
- `10000-fm-stock-local-sources/candidates/sources.candidate.json`

**Official data changed:** No

**Operator check:** Verify candidate count and that inbox files were moved to `processed/`.

## Stage 2. Source review init

**Script:** `scripts/init-source-candidate-reviews.js`

**Purpose:** Initialize review metadata for source candidates that lack it.

**Inputs:**
- `10000-fm-stock-local-sources/candidates/sources.candidate.json`

**Outputs:**
- `10000-fm-stock-local-sources/reviews/source-candidate-reviews.json`

**Official data changed:** No

## Stage 3. Source readiness

**Script:** `scripts/check-source-candidate-readiness.js`

**Purpose:** Classify source candidates as ready, needsManualReview, or blocked.

**Inputs:**
- `data/sources.json`
- `10000-fm-stock-local-sources/candidates/sources.candidate.json`
- `10000-fm-stock-local-sources/reviews/source-candidate-reviews.json`

**Official data changed:** No

**Operator check:** Review blocked and needsManualReview reasons before proceeding.

## Stage 4. Source promotion preview

**Script:** `scripts/generate-source-promotion-preview.js`

**Purpose:** Generate a preview of source candidates eligible for promotion.

**Inputs:**
- `data/sources.json`
- `10000-fm-stock-local-sources/candidates/sources.candidate.json`
- `10000-fm-stock-local-sources/reviews/source-candidate-reviews.json`

**Outputs:**
- `10000-fm-stock-local-sources/promotions/source-promotions.preview.json`

**Official data changed:** No

**Operator check:** Review preview records. Preview is not official data.

## Stage 5. Source promotion apply

**Script:** `scripts/apply-source-promotion-preview.js`

**Purpose:** Append eligible source preview records to official `data/sources.json`.

**Default mode:** Dry-run (no write)

**Apply mode:** `node scripts/apply-source-promotion-preview.js --apply`

**Official data changed:** Yes — `data/sources.json`

**Post-apply:** Runs `validate-data.js` automatically. Rolls back on validation failure.

**Operator check:** Verify validation passed and diff contains only expected additions.

## Stage 6. Segment init

**Script:** `scripts/init-segment-candidates.js`

**Purpose:** Create segment candidate placeholders for sources that have no segments yet.

**Inputs:**
- `data/sources.json`
- `data/segments.json`
- `10000-fm-stock-local-sources/segments/segment-candidates.json`

**Outputs:**
- `10000-fm-stock-local-sources/segments/segment-candidates.json`

**Official data changed:** No

## Stage 7. Segment readiness

**Script:** `scripts/check-segment-candidate-readiness.js`

**Purpose:** Classify segment candidates as ready, needsManualReview, or blocked.

**Inputs:**
- `data/sources.json`
- `data/segments.json`
- `10000-fm-stock-local-sources/segments/segment-candidates.json`

**Official data changed:** No

## Stage 8. Segment promotion preview

**Script:** `scripts/generate-segment-promotion-preview.js`

**Purpose:** Generate a preview of segment candidates eligible for promotion.

**Inputs:**
- `data/sources.json`
- `data/segments.json`
- `10000-fm-stock-local-sources/segments/segment-candidates.json`

**Outputs:**
- `10000-fm-stock-local-sources/segments/segment-promotions.preview.json`

**Official data changed:** No

## Stage 9. Segment promotion apply

**Script:** `scripts/apply-segment-promotion-preview.js`

**Purpose:** Append eligible segment preview records to official `data/segments.json`.

**Default mode:** Dry-run (no write)

**Apply mode:** `node scripts/apply-segment-promotion-preview.js --apply`

**Official data changed:** Yes — `data/segments.json`

**Post-apply:** Runs `validate-data.js` automatically. Rolls back on validation failure.

## Stage 10. Claim init

**Script:** `scripts/init-claim-candidates.js`

**Purpose:** Create claim candidate placeholders for segments that have no claims yet.

**Inputs:**
- `data/sources.json`
- `data/segments.json`
- `data/claims.json`
- `10000-fm-stock-local-sources/claims/claim-candidates.json`

**Outputs:**
- `10000-fm-stock-local-sources/claims/claim-candidates.json`

**Official data changed:** No

## Stage 11. Claim readiness

**Script:** `scripts/check-claim-candidate-readiness.js`

**Purpose:** Classify claim candidates as ready, needsManualReview, or blocked.

**Inputs:**
- `data/experts.json`
- `data/sources.json`
- `data/segments.json`
- `data/claims.json`
- `10000-fm-stock-local-sources/claims/claim-candidates.json`

**Official data changed:** No

**Operator check:** Ambiguous or weakly sourced claims should not be promoted.

## Stage 12. Claim promotion preview

**Script:** `scripts/generate-claim-promotion-preview.js`

**Purpose:** Generate a preview of claim candidates eligible for promotion.

**Inputs:**
- `data/experts.json`
- `data/sources.json`
- `data/segments.json`
- `data/claims.json`
- `10000-fm-stock-local-sources/claims/claim-candidates.json`

**Outputs:**
- `10000-fm-stock-local-sources/claims/claim-promotions.preview.json`

**Official data changed:** No

## Stage 13. Claim promotion apply

**Script:** `scripts/apply-claim-promotion-preview.js`

**Purpose:** Append eligible claim preview records to official `data/claims.json`.

**Default mode:** Dry-run (no write)

**Apply mode:** `node scripts/apply-claim-promotion-preview.js --apply`

**Official data changed:** Yes — `data/claims.json`

**Post-apply:** Runs `validate-data.js` automatically. Rolls back on validation failure.

## Stage 14. Validation

Run after every official data change:

```bash
node scripts/validate-data.js
node scripts/smoke-return-metrics.js
node scripts/audit-static-assets.js
```

- `validate-data.js` — checks JSON structure, unique IDs, cross-references, enum values
- `smoke-return-metrics.js` — 47 runtime contract tests for return metrics
- `audit-static-assets.js` — checks HTML files for missing or stale asset references

Expected: validate-data PASS, smoke 47/47 PASS, audit 0 errors.

## Rollback and failure handling

- Apply scripts save the original file content before writing.
- If `validate-data.js` fails after apply, the script rolls back to the original content.
- After any apply, verify the validation output shows "Validation PASSED".
- If validation failed and rollback occurred, do not merge. Investigate the cause.
- If official data changes remain after a failed validation, reset with `git checkout -- data/`.

## Git review checklist

Before creating a PR:

```bash
git status --short
git diff --stat
git diff
```

Check:

- [ ] Only expected files changed
- [ ] No source originals added
- [ ] No local candidate/preview files committed
- [ ] No secrets, API keys, or credentials
- [ ] No generated logs
- [ ] Validation passes
- [ ] PR body uses `Refs #...`

## Common mistakes to avoid

- Confusing preview generation with official data changes. Preview writes local files only.
- Confusing dry-run output with apply results. Dry-run does not write official data.
- Forgetting `--apply` and assuming changes were written.
- Committing local source files or candidate files to the repository.
- Mixing generated logs or candidates into a PR.
- Skipping the source → segment → claim order. Segments require sources. Claims require segments.
- Not checking rollback after a failed validation.

## Related docs

- `docs/promotion-checklist.md`
- `docs/source-intake-workflow.md`
- `docs/data-editing-guide.md`
