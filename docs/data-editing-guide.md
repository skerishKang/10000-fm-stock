# Official Data Editing Guide

## Purpose

This guide explains how to promote reviewed candidates into official `data/*.json` files without breaking references or mixing candidate material with approved static data.

Use this guide after candidate material has already passed the promotion checklist in `docs/promotion-checklist.md`.

## Editing order

Use this order for official data changes:

```text
experts
-> sources
-> segments
-> claims and/or knowledge_notes
-> evaluations
-> validator
-> PR review
```

Do not start by adding a claim. A claim depends on an expert, source, and segment. An evaluation depends on a claim.

## File roles

| File | Role | Main references |
| --- | --- | --- |
| `data/experts.json` | People or organizations making statements | referenced by claims and knowledge notes |
| `data/sources.json` | Public source record | referenced by segments, claims, knowledge notes |
| `data/segments.json` | Precise source location | references sources; referenced by claims and knowledge notes |
| `data/claims.json` | Verifiable forecast or estimate | references experts, sources, segments |
| `data/knowledge_notes.json` | Educational information | references experts, sources, segments |
| `data/evaluations.json` | Result after target horizon | references claims |
| `data/candidate-sources.sample.json` | Static candidate sample queue | not official source data |
| `data/source-links.json` | Curation link list | not an official claim source |

## Step 1. Expert record

Add or reuse an expert before adding claims or knowledge notes.

Check:

- The expert does not already exist under a variant name.
- `id` follows the current project pattern.
- `type` is valid for the validator.
- `displayName` is suitable for UI display.
- Main industries and companies are arrays.

Do not create a new expert just because a channel, firm, or author name has minor spelling differences. Prefer one canonical expert record when the identity is the same.

## Step 2. Source record

Add or reuse a source record before adding segments.

Check:

- Source can be relocated by URL, local `privatePath`, or stable reference metadata.
- Source type matches the current schema.
- Title, publisher, and publication date are present.
- Original source files are not committed.
- Source record does not copy full transcript, full report text, or raw payload.

For YouTube or video sources, preserve URL and later use segment `startTime` and `endTime`.

For reports, preserve URL or `privatePath` plus page or section in the segment.

## Step 3. Segment record

Add a segment for the exact source portion that supports a claim or knowledge note.

Check:

- `sourceId` points to an existing source.
- Segment location is precise enough to re-check.
- YouTube/video segment has `startTime` and `endTime` when possible.
- Report/article segment has page, section, or short location memo.
- Summary is paraphrased.
- Segment does not contain full source text.

One source can have multiple segments. Prefer smaller segments when one source contains multiple unrelated claims.

## Step 4A. Claim record

Add a claim only when the segment contains a verifiable forecast or estimate.

Check:

- `expertId` exists.
- `sourceId` exists.
- `segmentId` exists.
- `claimType` is valid.
- `direction` is valid and clear.
- `claimText` is paraphrased and does not overstate the source.
- `baseDate` is the statement/publication date unless documented otherwise.
- `targetDate` follows the source horizon or project horizon rule.
- `targetDate` must be greater than or equal to `baseDate`.
- `basePrice` and `targetPrice` are numeric when the current schema requires them.
- `evidence` is a short array of paraphrased reasons, not copied source text.
- `status` reflects the lifecycle state.

Reject or keep in candidate exports if:

- Direction is unclear.
- Horizon is unclear and cannot be standardized.
- The statement is purely educational.
- The source location cannot be reproduced.
- It duplicates an existing claim without meaningful difference.

## Step 4B. Knowledge note record

Add a knowledge note when the segment contains educational information that is useful independently of forecast accuracy.

Check:

- `expertId`, `sourceId`, and `segmentId` exist.
- Topic is concise.
- Summary is paraphrased.
- `keyPoints` is an array.
- `tags` is an array.
- Pure knowledge notes are not evaluated as stock prediction accuracy.

If a segment contains both educational explanation and a distinct forecast, split them into a knowledge note and a claim.

## Step 5. Evaluation record

Add an evaluation only after the target horizon has passed or after the evaluation rule allows evaluation.

Check:

- `claimId` exists.
- Each claim has at most one authoritative evaluation record.
- Claim status and evaluation status are consistent.
- `evaluatedAt` uses `YYYY-MM-DD`.
- `evaluatedAt` should not be earlier than the referenced claim's `baseDate`.
- `evaluatedPrice`, `returnRate`, `benchmarkReturn`, and `alpha` are finite numbers.
- `result` is one of the validator-supported verdicts.
- Evaluation memo does not rewrite the original claim.

Do not add a second evaluation record for the same claim. If a re-evaluation or correction is needed, update the existing evaluation record and explain the reason in `memo` or the PR body.

Do not change the claim wording, base date, or target date to fit the evaluation result unless correcting a documented data error.

## Status consistency rules

Recommended lifecycle:

```text
candidate export
-> approved official data
-> evaluated official data
```

Practical checks:

- Candidate material belongs in `research-workspace/exports/`, not official `data/*.json`.
- Official records belong in `data/*.json` only after review.
- A claim with `status: evaluated` must have at least one matching evaluation record.
- A claim's `targetDate` must not be earlier than its `baseDate`.
- An invalid claim may have an evaluation record only when `evaluation.result` is also `invalid`; this records that the statement was not evaluable as a forecast.
- An invalid claim with a non-invalid evaluation result is inconsistent and should be fixed before review.
- A candidate or pending claim should not have an evaluation record.
- A claim must not have more than one evaluation record in the MVP data model.
- An invalid claim should not be used for ranking as a successful forecast.
- Knowledge notes should not be forced into evaluations.

## Duplicate checks

Before adding new records, search for duplicates by:

- expert name
- source URL or title
- segment source/time/page
- ticker or company name
- claim text meaning
- base date and target date
- evaluation `claimId`

A repeated statement can be a separate claim only when it differs materially by source, speaker, date, horizon, target, or thesis.

A repeated evaluation for the same claim is not allowed. Correct the existing evaluation record instead.

## Data PR checklist

Every official data PR must include:

```text
Data PR checklist

Scope:
- changed files:
- official data files changed:
- candidate/export files changed:

Source safety:
- no original PDFs/videos/transcripts: PASS/FAIL
- no copied full report text: PASS/FAIL
- no credentials/secrets: PASS/FAIL

Reference integrity:
- expert references checked: PASS/FAIL
- source references checked: PASS/FAIL
- segment references checked: PASS/FAIL
- claim references checked: PASS/FAIL

Curation quality:
- claim vs knowledge note separation checked: PASS/FAIL
- duplicates checked: PASS/FAIL
- ambiguous statements rejected or kept as candidate: PASS/FAIL

Validation:
- node scripts/validate-data.js: PASS/FAIL

Decision:
- ready for review / needs fix
```

## Required validation

Run from the repository root:

```bash
node scripts/validate-data.js
```

A data-changing PR is not ready if validation fails.

Validation passing is necessary but not sufficient. Human review must still verify claim wording, source reproducibility, and source-original safeguards.
