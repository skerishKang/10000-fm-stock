# FMIndex Data and Collection Policy

## Purpose

This document defines the minimum policy gates for collecting, retaining, classifying, aggregating, evaluating, and publishing community sentiment data for FMIndex.

It is a product and engineering policy, not a substitute for source-specific legal review.

## Core rule

Collection is not authorized merely because content is visible in a browser.

Before implementing an adapter, document:

- source and exact surface
- whether the surface is public or requires authentication
- applicable terms and published access rules
- robots and technical access signals where relevant
- expected request volume
- fields collected
- retention period
- publication form
- operator responsible for review
- shutdown and deletion procedure

## Approved-source record

Every source adapter requires an approved source policy record.

```json
{
  "source": "fmkorea",
  "surface": "stock-board",
  "policyVersion": "fmindex-source-fmkorea-0.1.0",
  "approvalStatus": "research_only",
  "approvedAt": null,
  "approvedBy": null,
  "publicOnly": true,
  "authenticationAllowed": false,
  "collectionRatePolicy": "not-defined",
  "rawTextRetentionDays": 0,
  "publishedOutput": "aggregate_only",
  "notes": "Implementation blocked until review is complete."
}
```

Until the record is approved, use synthetic or manually supplied benchmark text only.

## Collection principles

### Public and necessary

Collect only fields necessary to create and audit aggregate sentiment.

### No access-control bypass

Do not bypass login requirements, CAPTCHAs, rate limits, blocks, paywalls, or other technical controls.

### Rate restraint

Use conservative, source-specific request rates. Support caching, incremental collection, backoff, and a global kill switch.

### Honest identification

Where appropriate and permitted, identify the client and provide a project contact route. Do not masquerade as unrelated users or rotate identities to evade controls.

### Incremental operation

Prefer collecting newly available records and observable updates instead of repeatedly downloading historical pages.

### Failure transparency

Partial or failed windows must be marked as incomplete. They must not be converted into neutral sentiment.

## Personal-data minimization

FMIndex is an aggregate market-sentiment product, not an individual-user profiling product.

Default policy:

- do not publish usernames
- do not publish user profile links
- do not build cross-community identity graphs
- do not infer sensitive personal traits
- do not expose individual activity history
- use source-scoped keyed hashes only when needed for duplicate and concentration controls
- rotate or delete pseudonymous keys according to retention policy

Direct contact details or accidental sensitive information must be redacted or excluded.

## Content retention classes

### Class A — aggregate-only

Retain no raw text after classification and quality checks.

Stored:

- aggregate counts
- version metadata
- quality report
- outcome evaluation

### Class B — short-retention restricted text

Retain normalized text for a short documented period for classifier review, then delete it.

Stored after expiry:

- content fingerprint
- derived labels
- entity links
- aggregate contribution record

### Class C — manually approved evidence excerpt

A short excerpt may be retained only when necessary for a specific research audit or correction and when the use is approved. Full threads and full transcripts are not the default.

## Public repository policy

The public `10000-fm-stock` repository must contain only:

- schemas
- policy documents
- synthetic fixtures
- explicitly approved aggregate samples
- methodology and benchmark reports
- outcome evaluation artifacts that do not expose unnecessary personal data

It must not contain:

- raw community archives
- private or login-only content
- usernames and profile histories
- collection credentials
- session cookies
- access tokens
- source HTML dumps
- CAPTCHA material
- bypass tooling
- unreviewed model-training exports

## Text handling

### Normalization

Text normalization may remove formatting noise while preserving sentiment-bearing meaning. The normalization version must be stored.

### Quotation and publication

Public product surfaces should generally display aggregate results and paraphrased topics. Direct excerpts require a defined use case, minimal length, attribution policy, and review.

### Deletion and modification

When source content is observed as deleted or materially modified, record the state where operationally feasible. Public aggregates need not be retroactively erased automatically, but correction and deletion policies must define when recomputation is required.

## Candidate and official boundaries

Reuse the FM-Stock pattern:

```text
collected observation
-> normalized candidate
-> classified candidate
-> aggregate preview
-> quality and compliance review
-> official aggregate
```

No model or collection job writes directly to official published data.

## Data quality gates

An aggregate is blocked from publication when any of the following applies:

- sample below declared threshold
- source collection incomplete beyond tolerance
- duplicate concentration above threshold
- one author or thread dominates beyond policy
- entity confidence below threshold
- classifier confidence below threshold
- source policy not approved
- model or aggregation version missing
- observation timestamps unreliable
- anomalous volume unexplained

## Model governance

Each sentiment or entity model release requires:

- model identifier and version
- training or prompt provenance
- benchmark dataset version
- label definitions
- per-class metrics
- confusion matrix
- calibration or confidence analysis
- slang and sarcasm error review
- sector and security slice review
- known limitations
- rollback version

A model improvement cannot silently rewrite historical public aggregates. Rebuilt histories require a new aggregate build version and comparison report.

## Labeling policy

Manual labels should include at least:

```text
entity targets
polarity
emotion
intensity
conviction
uncertainty
sarcasm risk
spam or promotion
duplicate relation
adjudication status
```

Annotators must distinguish:

- the author's sentiment from quoted sentiment
- sentiment toward a security from sentiment toward the market
- factual negative news from the author's emotional stance
- rhetorical questions from predictions
- joking or sarcastic statements from literal statements

Disagreements should be adjudicated and preserved for error analysis.

## Aggregation safeguards

### Repeated-author cap

One author must not dominate a window. Use a declared maximum contribution or diminishing weight.

### Duplicate control

Exact and near-duplicate text, copied headlines, and repeated memes require clustering and capped contribution.

### Engagement weighting

Do not assume reactions or comments equal truth. Engagement weighting must be separately tested and capped.

### Low-volume handling

Low-volume windows should be labeled `low_sample`, not extrapolated into a strong score.

### Source combination

Source-specific indices must be published before a combined multi-source index. Combined weighting requires coverage normalization and a separate methodology version.

## Correction and challenge process

Public FMIndex output requires a correction mechanism for:

- wrong security mapping
- wrong source timestamp
- material collection gap
- model misclassification affecting a published event
- duplicate or spam failure
- incorrect market outcome
- policy violation

Correction records should include:

- affected aggregate IDs
- reason
- old and new values
- policy and model versions
- reviewer
- correction time

## Incident response

The collection system must support:

- immediate source-specific shutdown
- credential revocation
- retention deletion job
- affected-batch identification
- publication freeze
- public correction note when necessary
- post-incident report

## Launch gates

### Offline benchmark gate

- synthetic or manually provided data only
- label guide complete
- benchmark report complete

### Private collection gate

- source policy approved
- storage and retention configured
- kill switch tested
- no public publication

### Research preview gate

- quality thresholds met
- aggregate methodology published
- delayed output only
- correction path active
- investment-information disclaimer visible

### Production gate

- multi-period reliability report
- source continuity monitoring
- incident response tested
- evaluation methodology stable
- data freshness and coverage visible
- ongoing review owner assigned
