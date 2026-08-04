# FMIndex Target Architecture

## Architecture decision

FMIndex must be developed as a separate collection and aggregation boundary that integrates with FM-Stock through versioned data contracts.

Do not place automated community collection, raw post archives, model inference, or scheduled aggregation directly in the current static browser application.

Recommended boundary:

```text
FM-Stock repository
- official claims
- experts
- sources and segments
- knowledge notes
- shared security identifiers
- market-data snapshots
- authoritative evaluation artifacts
- static public or review UI

FMIndex collector and research workspace
- source adapters
- collection jobs
- raw or restricted observations
- normalization
- entity extraction
- sentiment inference
- duplicate and abuse controls
- aggregate builds
- publication candidates

Published contract
- approved aggregate JSON
- methodology metadata
- coverage and quality reports
- outcome evaluations
```

## Repository strategy

### Current phase

Document FMIndex in `10000-fm-stock` because the shared evaluation model and product relationship must be explicit.

### Implementation phase

Prefer a separate repository such as:

```text
skerishKang/fmindex
```

or an equivalent private data-pipeline repository.

Reasons:

- different data volume
- different update cadence
- source-specific compliance controls
- restricted raw observations
- credentials and scheduled jobs
- model and batch-processing dependencies
- independent incident response

The exact repository name and visibility are deferred until implementation starts.

## Logical components

### 1. Source adapter

Responsibilities:

- retrieve only approved public content
- respect source-specific rate, access, and retention rules
- record collection time and source timestamps
- produce immutable intake records
- report partial failures

Output:

```text
collection batch
raw observation reference
collection diagnostics
```

### 2. Normalizer

Responsibilities:

- canonical text normalization
- post/comment distinction
- timestamp normalization to UTC plus source timezone
- URL and source ID normalization
- engagement field normalization
- deletion and modification state where observable
- content hash and duplicate features

### 3. Privacy and minimization filter

Responsibilities:

- remove unnecessary personal identifiers
- transform author identifiers to source-scoped pseudonymous hashes when needed for duplicate and abuse analysis
- redact direct contact details and accidental sensitive data
- enforce retention classes

### 4. Entity linker

Responsibilities:

- map mentions to `securityId`, company, industry, market, index, or theme
- preserve confidence and alternative candidates
- distinguish company names from ordinary words
- support aliases, ticker symbols, abbreviations, and slang

### 5. Sentiment classifier

Responsibilities:

- polarity
- emotion
- intensity
- conviction
- uncertainty
- sarcasm or irony risk
- classification confidence
- model and prompt version

The classifier must preserve uncertainty. Low-confidence observations can be excluded from public aggregates or placed in a separate quality bucket.

### 6. Quality and abuse controls

Responsibilities:

- exact and near-duplicate detection
- repeated author weighting limits
- copied headline detection
- spam and promotional content filtering
- bot-like burst indicators
- engagement manipulation indicators
- source outage and coverage anomaly detection

These controls reduce weight or exclude observations according to a versioned policy. They do not silently delete audit records.

### 7. Aggregator

Responsibilities:

- create market, sector, theme, and security windows
- compute sample size and eligible weight
- generate sentiment, attention, disagreement, and confidence metrics
- apply smoothing where declared
- produce versioned aggregate artifacts

### 8. Publication review

Responsibilities:

- inspect coverage and anomaly reports
- confirm approved source and policy versions
- prevent low-sample or failed-quality aggregates from publication
- promote aggregate candidates to official published data

The existing FM-Stock preview/review/apply pattern is the model to reuse.

### 9. Outcome evaluator

Responsibilities:

- resolve market sessions and prices
- calculate 1D, 5D, 20D, and 60D outcomes
- calculate benchmark-relative outcomes
- evaluate extreme-sentiment cohorts
- attach `evaluationPolicyVersion`

This component should reuse the authoritative evaluation contract defined in `docs/evaluation-methodology.md`.

## Data flow

```text
approved public source
-> collection batch
-> normalized observation
-> privacy minimization
-> entity candidates
-> sentiment inference
-> quality and abuse features
-> eligible observations
-> aggregate candidate
-> quality report
-> human publication review
-> published FMIndex aggregate
-> due evaluation
-> authoritative outcome evaluation
```

## Shared identity contracts

FM-Stock and FMIndex must share canonical references.

### Security

```json
{
  "securityId": "KRX-005930",
  "ticker": "005930",
  "name": "삼성전자",
  "market": "KRX",
  "currency": "KRW",
  "country": "KR",
  "activeFrom": "1975-06-11",
  "activeTo": null,
  "aliases": ["삼전", "Samsung Electronics"]
}
```

### Observation time

Store:

- `publishedAt`
- `collectedAt`
- `sourceTimezone`
- `marketSessionId` when resolved

Do not use collection time as publication time.

### Policy references

Every published artifact must identify:

- collection policy version
- normalization version
- entity-linker version
- sentiment-model version
- quality-weighting version
- aggregation version
- evaluation version when evaluated

## Observation contract

Restricted observation example:

```json
{
  "id": "obs-example",
  "source": "fmkorea",
  "sourceSurface": "stock-board",
  "contentType": "comment",
  "sourceRecordKeyHash": "sha256:...",
  "threadKeyHash": "sha256:...",
  "authorKeyHash": "sha256:...",
  "publishedAt": "2026-08-04T01:15:00Z",
  "collectedAt": "2026-08-04T01:20:00Z",
  "textFingerprint": "sha256:...",
  "retainedTextClass": "restricted-short-retention",
  "engagement": {
    "views": null,
    "comments": null,
    "reactions": 3
  },
  "entities": [
    {
      "securityId": "KRX-005930",
      "confidence": 0.94
    }
  ],
  "sentiment": {
    "polarity": -0.72,
    "label": "negative",
    "emotion": "fear",
    "intensity": 0.84,
    "conviction": 0.61,
    "uncertainty": 0.24,
    "sarcasmRisk": 0.18,
    "confidence": 0.91,
    "modelVersion": "fmindex-sentiment-0.1.0"
  },
  "quality": {
    "duplicateClusterId": null,
    "spamRisk": 0.05,
    "eligible": true,
    "weight": 0.91,
    "policyVersion": "fmindex-quality-0.1.0"
  }
}
```

Raw text retention is a source- and policy-specific decision. Published aggregate data must not require public raw text.

## Aggregate contract

```json
{
  "id": "fmindex-fmkorea-KRX-005930-20260804T0100Z-1h",
  "source": "fmkorea",
  "scopeType": "security",
  "scopeId": "KRX-005930",
  "window": "1h",
  "windowStart": "2026-08-04T01:00:00Z",
  "windowEnd": "2026-08-04T02:00:00Z",
  "publishedObservationCount": 41,
  "eligibleObservationCount": 35,
  "uniqueAuthorEstimate": 22,
  "positiveWeight": 6.2,
  "negativeWeight": 19.5,
  "neutralWeight": 4.7,
  "sentimentScore": -44.7,
  "attentionScore": 63.2,
  "disagreementScore": 28.4,
  "confidence": 0.82,
  "coverageStatus": "sufficient",
  "versions": {
    "collection": "0.1.0",
    "normalization": "0.1.0",
    "entity": "0.1.0",
    "sentiment": "0.1.0",
    "quality": "0.1.0",
    "aggregation": "0.1.0"
  },
  "builtAt": "2026-08-04T02:05:00Z",
  "publicationStatus": "candidate"
}
```

## Coverage states

```text
sufficient
low_sample
partial_collection
source_unavailable
quality_blocked
under_review
```

A failed collection window must not be published as neutral sentiment.

## Storage classes

### Public repository

Allowed:

- schemas
- synthetic fixtures
- methodology
- aggregate samples with no unnecessary personal data
- approved published aggregates
- quality summaries
- evaluation artifacts

### Private or restricted pipeline storage

Potentially allowed subject to policy:

- collection batch metadata
- short-retention normalized text
- source record hashes
- pseudonymous author hashes
- model outputs
- duplicate clusters
- moderation and compliance review artifacts

### Never commit

- credentials
- session cookies
- source access tokens
- private or login-only content
- full raw archives
- personal profiles
- unnecessary usernames or contact details
- content obtained by bypassing technical controls

## Deployment stages

```text
local benchmark
-> private research environment
-> delayed internal aggregate
-> reviewed public research preview
-> production aggregate service
```

Each transition requires explicit quality and compliance gates.

## Failure isolation

- A source adapter failure must not corrupt prior official aggregates.
- A sentiment-model change must create a new build, not overwrite old results silently.
- A market-data outage must mark evaluations pending, not failed.
- A source policy change must be able to disable collection without breaking FM-Stock.
- Raw-data retention deletion must not alter already published aggregate facts, but the audit record must note the retention action.
