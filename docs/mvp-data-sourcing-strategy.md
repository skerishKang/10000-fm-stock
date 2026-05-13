# MVP Data Sourcing Strategy

## Purpose

This document defines the data sourcing policy for the FM-Stock static MVP.

The product value is not the original source file. The product value is the normalized data extracted from public references:

- `source`
- `segment`
- `claim`
- `evaluation`
- `knowledge_note`
- `expert`
- security, benchmark, and price reference data

The MVP must stay focused on manual curation, stable schemas, and static JSON outputs before adding backend storage, live APIs, crawling, login, or automated ingestion.

## Operating sequence

The approved implementation sequence is:

```text
manual curation + stable schema
-> static sample price/evaluation data
-> local normalization/build scripts
-> search-assisted candidate workflow
-> broker/public API adapters
-> backend only if truly needed
```

This order is required because the difficult product problem is not scraping. The difficult product problem is deciding which public statements are verifiable claims, separating them from educational knowledge, preserving legally safer references, and evaluating them consistently after the target horizon.

## Source storage policy

### Allowed in the repository

The repository may store:

- source URL
- source type
- publisher, channel, brokerage, firm, speaker, author, or analyst name
- publication date
- YouTube start/end time
- report page or section reference
- short operator notes
- short legally safe excerpts when necessary
- paraphrased claim summaries
- paraphrased educational knowledge notes
- structured JSON candidates and approved static data

### Not allowed in the repository

The repository must not store or redistribute:

- original video files
- original report PDFs
- copied full report text
- full raw transcripts
- downloaded source archives
- broker API secrets
- account credentials
- private certificates
- API keys
- browser-side live API credentials

Originals and raw working material must stay outside the repository.

Recommended Windows/WSL local layout:

```text
/mnt/g/Ddrive/BatangD/task/workdiary/
├── 10000-fm-stock/
└── 10000-fm-stock-local-sources/
    ├── reports/
    │   └── 2026/
    │       └── 05/
    ├── expert-sources/
    │   └── transcripts/
    └── analysis/
```

Equivalent Windows paths:

```text
G:\Ddrive\BatangD\task\workdiary\10000-fm-stock\
G:\Ddrive\BatangD\task\workdiary\10000-fm-stock-local-sources\
```

The local originals folder must be a sibling of the Git repository, not a child folder inside it.

The repository-side `research-workspace/` is only for templates, references, short notes, candidate records, and structured outputs.

## Manual curation as the MVP default

Manual curation remains the primary MVP workflow.

This is intentional. The early product needs human judgment for:

- deciding whether a statement is actually a forecast
- deciding whether the claim is stock-specific, industry-level, macro, strategy, or educational-only
- identifying the base date
- identifying the target horizon
- identifying direction such as `bullish`, `bearish`, `neutral`, `watch`, or `risk`
- separating verifiable claims from educational knowledge
- deduplicating repeated claims across videos and reports
- preserving source references without copying source content
- rejecting ambiguous or unverifiable statements

A manually curated small dataset is preferable to a large automatically scraped dataset with weak provenance and poor claim quality.

## Candidate versus official data

Candidate data must not be treated as official project data.

Recommended states:

```text
candidate_source
-> reviewed_source
-> claim_candidate
-> approved_claim
-> evaluated_claim
```

A source or claim is official only after human review and explicit promotion into the app's approved static data files.

User-entered or operator-entered source links from a static page must include:

```json
{
  "status": "candidate",
  "official": false
}
```

## Data validation workflow

Run the local validator before and after any change to static JSON data under `data/`:

```bash
node scripts/validate-data.js
```

This validator is the minimum merge gate for data-changing PRs. It checks:

- JSON parse and array root shape
- id presence and duplicate ids
- claim references to experts, sources, and segments
- evaluation references to claims
- knowledge note references to experts, sources, and segments
- key enum values
- candidate source `status: "candidate"` and `official: false`

A PR that changes `candidate-sources.sample.json`, `source-links.json`, `sources.json`, `segments.json`, `claims.json`, `evaluations.json`, or `knowledge_notes.json` should not be marked ready until the validator exits with status 0 and prints:

```text
Validation passed.
```

If validation fails, fix the structured data contract rather than bypassing the script. Do not paste raw source payloads, copied report text, full transcripts, or private local file contents into issue or PR comments.

## Search-assisted curation

Search-assisted workflows are allowed later, but their output must enter a review queue.

Search may help find:

- expert names
- YouTube videos or channel references
- ticker/company mentions
- sector/theme references
- public brokerage report links
- public articles, interviews, or broadcasts
- date-range candidates

Search output must not write directly to `claims.json`, `knowledge-notes.json`, or evaluation files.

The correct search-assisted flow is:

```text
search result
-> candidate_source
-> human review
-> claim/knowledge candidate extraction
-> approval
-> static JSON promotion
```

## Static JSON schema expectations

The exact schema can evolve, but the following expectations define the minimum stable contract.

### `sources`

A source record should identify the public reference without redistributing the original content.

Required or expected fields:

- `id`
- `type`
- `url`
- `title`
- `publisher`
- `speakerOrAuthor`
- `publishedAt`
- `status`
- `official`
- `notes` or review memo fields

Source types may include:

- `youtube_channel`
- `youtube_video`
- `broker_research`
- `broker_report`
- `report_aggregator`
- `article`
- `broadcast`
- `other`

### `segments`

A segment record should point to the specific portion of a source that supports an extracted claim or knowledge note.

Expected fields:

- `id`
- `sourceId`
- `startTime` and `endTime` for video sources
- `pageOrSection` for report sources
- `summary`
- `status`

Segments must not contain full transcripts or full report text.

### `claims`

A claim record should represent a verifiable statement.

Expected fields:

- `id`
- `expertId`
- `sourceId`
- `segmentId`
- `ticker`
- `companyName`
- `industry`
- `claimType`
- `direction`
- `claimText`
- `evidence`
- `baseDate`
- `targetDate`
- `timeHorizon`
- `status`

Current MVP sample data already follows this broad pattern with records such as `claim_001`, `expertId`, `sourceId`, `segmentId`, `ticker`, `companyName`, `industry`, `claimType`, `direction`, `claimText`, `evidence`, `baseDate`, `targetDate`, `timeHorizon`, and `status`.

### `knowledge_notes`

A knowledge note should preserve useful educational information separately from return-verifiable claims.

Expected fields:

- `id`
- `sourceId`
- `segmentId`
- `expertId` or `authorId`
- `topic`
- `industry`
- `summary`
- `keyPoints`
- `relatedTickers`
- `relatedCompanies`
- `tags`
- `status`

Knowledge notes must not be evaluated as stock-prediction accuracy unless they contain a distinct verifiable claim.

### `securities`

A security record should normalize listed assets used by claims and evaluations.

Expected fields:

- `securityId`
- `ticker`
- `name`
- `market`
- `currency`
- `country`
- `industry`
- `isActive`
- `dataSource`

### `prices`

Price data should initially be sample static data or carefully derived static data.

Expected fields:

- `securityId` or `ticker`
- `date`
- `open`
- `high`
- `low`
- `close`
- `adjustedClose`
- `volume`
- `currency`
- `dataSource`

### `benchmarks`

Benchmark records are needed for alpha calculation.

Expected fields:

- `benchmarkId`
- `name`
- `date`
- `close`
- `return`
- `currency`
- `dataSource`

Potential Korean market benchmarks:

- KOSPI
- KOSDAQ
- KOSPI200

### `evaluations`

Evaluation records should be generated from claims and price/benchmark snapshots.

Expected fields:

- `id`
- `claimId`
- `ticker` or `securityId`
- `baseDate`
- `basePrice`
- `horizonDate`
- `horizonPrice`
- `rawReturn`
- `benchmarkId`
- `benchmarkReturn`
- `alpha`
- `verdict`
- `calculationMethod`
- `dataSource`

Supported initial horizons:

- `1M`
- `3M`
- `6M`
- `12M`

## Price and market data policy

### MVP phase

The static MVP should use sample static price, benchmark, and evaluation data first.

This keeps the UI and evaluation model testable without adding external API risk.

### Next phase

Add local/offline scripts to normalize public market data into static JSON.

Suggested later tooling:

```text
tools/
  fetch-public-prices.js
  fetch-broker-prices.js
  normalize-securities.js
  normalize-prices.js
  build-evaluations.js
```

Generated outputs should remain static JSON:

```text
data/
  securities.json
  prices_daily_sample.json
  benchmarks_daily_sample.json
  evaluations.json
```

### Public data candidates

For Korean equities, prioritize reproducible public datasets where terms allow the intended use.

Candidate classes:

- listed security master data
- KRX-related public data via public data portals
- daily OHLCV series
- benchmark/index series such as KOSPI, KOSDAQ, and KOSPI200

For overseas equities, review providers separately. Possible candidates may include free or low-cost historical data providers, but the project must check freshness, continuity, rate limits, and redistribution terms before committing derived datasets.

## Broker API policy

Broker APIs are in scope only for later phases.

They must not be added as browser-side runtime dependencies for the static MVP.

Broker API constraints usually include:

- app keys
- app secrets
- account linkage
- certificates
- rate limits
- trading permissions
- redistribution restrictions
- account-specific terms

If broker APIs are used later, they should be wrapped as local/offline adapters that produce reviewable static JSON outputs. They must not expose credentials in the repository or static site.

## Runtime and backend non-goals

The following are out of scope for the static MVP data sourcing layer:

- login
- user accounts
- Supabase
- Firebase
- database writes
- backend API
- cron jobs
- automatic YouTube transcript extraction
- automatic report crawling
- live browser-side market data API calls
- broker API calls from the browser
- automatic promotion from candidate source to official claim

## PR and implementation rules

Future PRs must preserve these rules:

1. Keep source-original safeguards intact.
2. Do not add original PDFs, full transcripts, or copied full report text.
3. Do not add credentials or API secrets.
4. Do not bind the static browser runtime to broker APIs or live market APIs.
5. Use candidate records with `official: false` until human review promotes them.
6. Add schema changes in small PRs with clear migration notes.
7. Keep generated or local runtime artifacts out of git unless explicitly approved as static sample data.
8. Keep frontend implementation, local data tooling, and policy documentation in separate PRs when possible.

## Current decision

For the current MVP, the approved data sourcing policy is:

```text
manual references + human-reviewed extraction + static JSON outputs
```

This protects the project from legal, credential, and architectural overreach while keeping the product focused on its core function: turning public expert statements into verifiable claims and educational knowledge notes.
