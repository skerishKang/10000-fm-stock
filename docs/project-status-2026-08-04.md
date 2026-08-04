# FM-Stock Project Status — 2026-08-04

## Status

```text
CURATION_PIPELINE_MATURE
STATIC_PRODUCT_FUNCTIONAL
REAL_DATA_AND_SCORING_NOT_READY
FMINDEX_DOCUMENTED_NOT_IMPLEMENTED
```

FM-Stock is a static MVP for recording public stock and industry statements, preserving source references, separating candidate data from official data, and evaluating statements after a defined horizon.

The repository already contains a substantial manual operating pipeline:

```text
source candidate
-> human review
-> promotion preview
-> official source
-> segment candidate
-> human review
-> official segment
-> claim candidate
-> human review
-> official claim
-> evaluation
```

The next product direction is **FMIndex**, a community sentiment index that measures time-bounded market and security sentiment from public community posts and comments and later compares that sentiment with market outcomes.

## What is currently implemented

- Static HTML, CSS, and vanilla JavaScript application
- Official JSON datasets for experts, sources, segments, claims, evaluations, and knowledge notes
- SourceHub, ingest, review, claims, experts, sources, knowledge, ranking, and dashboard pages
- Candidate-to-official promotion scripts with dry-run and validation rollback patterns
- Local JSON contract validation
- Return metric smoke tests
- Static asset reference audit tooling
- Data validation GitHub Actions workflow
- Documentation for source storage, data editing, promotion, and pipeline operations

## Current strengths

### Candidate and official boundaries

Candidate records are kept non-official until explicit human review and promotion. Apply scripts require an explicit write mode and validate official data after changes.

### Source-original safeguards

The repository stores normalized references and structured records instead of original videos, report PDFs, full transcripts, copied reports, credentials, or broker secrets.

### Referential integrity

The validator checks identifiers, duplicate records, cross-dataset references, key enums, date order, candidate status, and claim/evaluation consistency.

### Dependency-light operation

The application and local tooling can operate without a database, hosted backend, login system, or browser-side market API credentials.

## Material gaps before real public ranking

### Demo data is not isolated from production data

Current experts, sources, claims, prices, and evaluations are sample records. Public pages need an explicit dataset mode and visible demo disclosure until verified production data replaces them.

### Evaluation authority is split

Some pages use stored evaluation fields while expert metrics recalculate outcomes in the browser. A single authoritative evaluation artifact and policy version are required.

### Alpha and bearish normalization are inconsistent

Benchmark return is stored on evaluation records but some expert metrics attempt to read it from claims. Bearish forecasts also require direction-aware return and benchmark treatment.

### Claim types need separate evaluators

Stock price forecasts, market forecasts, earnings estimates, and educational statements cannot share one price-target verdict rule.

### Due evaluations are not operationalized

Claims whose target dates have passed can remain pending. The repository needs an overdue evaluation queue and explicit lifecycle states.

### Market data is not reproducible

Evaluation records contain outcome values, but the repository does not yet contain the normalized price and benchmark snapshots needed to reproduce them.

### CI coverage is incomplete

The current workflow validates data changes only. Metric smoke tests, static asset audits, browser smoke checks, overdue checks, and evaluation consistency checks are not yet mandatory CI gates.

## FMIndex decision

**FMIndex** is the approved product name for the future community sentiment index.

FMIndex is not a rename of FM-Stock. The responsibilities are separated:

```text
FM-Stock
= source, claim, expert, knowledge, and outcome evaluation system

FMIndex
= community observation, entity matching, sentiment classification,
  aggregation, index publication, and short-horizon outcome evaluation system
```

They share:

- security and company identifiers
- timestamps and market sessions
- evaluation horizons
- price and benchmark snapshots
- evaluation policy versions
- public provenance and correction rules

They must not share raw runtime boundaries by default. Large-scale collection, raw community content, model inference, and repeated aggregation should not be inserted directly into the static browser runtime.

## Scope decision

### In scope for the next documentation-led phase

- Authoritative evaluation methodology
- Reproducible market data contracts
- Demo and production data separation
- Due-evaluation lifecycle
- FMIndex product definition
- FMIndex observation and aggregate schemas
- Community collection and compliance policy
- Sentiment labeling and benchmark experiment design
- Shared FM-Stock/FMIndex interfaces
- CI and release gates

### Not yet in scope

- Automated scraping
- Browser-side community collection
- Live production indexing
- Real-person public rankings
- Automatic publication without review
- A backend or database selected before data volume and operational needs are measured
- Credentials or API secrets in the repository

## Recommended implementation order

1. Define one authoritative evaluation policy and artifact.
2. Separate demo and production datasets.
3. Add security, price, benchmark, and evaluation provenance contracts.
4. Add due and overdue evaluation operations.
5. Correct metric and ranking calculations.
6. Expand CI gates.
7. Build a manually labeled FMIndex benchmark dataset.
8. Validate sentiment and entity extraction offline.
9. Define a compliant collection adapter and retention model.
10. Publish research-only FMIndex aggregates.
11. Integrate FMIndex and expert-claim comparisons only after both sides are reproducible.

## Current development rule

This document establishes planning and backlog only. It does not authorize collection, production publication, real-person ranking, repository visibility changes, or direct writes to `main`.
