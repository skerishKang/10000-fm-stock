# Evaluation Methodology

## Purpose

This document defines the target evaluation policy for FM-Stock and the shared outcome-evaluation layer used by FMIndex.

The repository must produce results that are:

- reproducible
- explainable
- versioned
- direction-aware
- source-linked
- comparable across time
- distinguishable from missing or invalid data

## One authoritative evaluation

The authoritative outcome is a generated and reviewed evaluation record. Browser pages must display that record and must not independently invent a different verdict.

```text
claim or index observation
+ normalized security
+ market-data snapshots
+ benchmark snapshots
+ evaluation policy version
-> deterministic evaluator
-> evaluation candidate
-> review
-> authoritative evaluation
```

UI-only calculations may format or summarize authoritative fields, but they must not change the verdict.

## Required evaluation states

```text
not_due
pending_data
ready_for_evaluation
under_review
evaluated
invalid
unverifiable
superseded
```

A missing price, missing benchmark, ambiguous statement, or unresolved source is not a `miss`.

## Required verdicts

```text
hit
partial_hit
miss
invalid
unverifiable
insufficient_data
```

Recommended reporting:

- strict hit rate: `hit / evaluable`
- weighted accuracy: `(hit + 0.5 * partial_hit) / evaluable`
- invalid and insufficient-data counts shown separately
- minimum sample disclosed for every ranking

## Policy version

Every authoritative evaluation must contain a policy identifier, for example:

```json
{
  "policyVersion": "fmstock-eval-1.0.0"
}
```

A policy change that can alter a verdict or metric requires:

- a new policy version
- migration notes
- a recomputation report
- old/new result comparison
- explicit review before replacing official evaluations

## Trading-day adjustment

Target dates can fall on weekends or exchange holidays. The policy must declare one adjustment method.

Recommended default:

```text
ON_OR_AFTER_TARGET_DATE
```

Use the first valid trading session on or after the requested date, subject to a maximum tolerance window. The resolved trading date must be stored.

Alternative methods must not be silently mixed.

## Price basis

Each evaluation must identify:

- raw or adjusted close
- currency
- corporate-action treatment
- dividend treatment
- base date requested and resolved
- target date requested and resolved
- source dataset and retrieval/build time

Recommended initial basis for price forecasts:

```text
adjusted close where reliable; otherwise documented official close
```

## Direction-aware returns

Raw asset return:

```text
rawReturn = (targetPrice - basePrice) / basePrice
```

Direction sign:

```text
bullish = +1
bearish = -1
```

Directional return:

```text
directionalReturn = rawReturn * directionSign
```

Benchmark-relative performance must use an explicitly defined directional treatment. Recommended research metric:

```text
directionalAlpha = directionalReturn - directionalBenchmarkReturn
```

For a bearish view, the benchmark term must follow the same stated strategy interpretation. The project must not mix raw long-only alpha with short-direction ranking without labeling the distinction.

## Claim-type evaluators

### Stock forecast

Potential dimensions:

- direction at horizon
- target price at horizon
- target touched during interval
- benchmark-relative outcome

`target touched` and `target held at horizon` are different outcomes and must be stored separately.

Example fields:

```json
{
  "horizonDirectionMatched": true,
  "targetReachedDuringWindow": true,
  "targetReachedAtHorizon": false
}
```

### Market forecast

Use a normalized index or explicitly defined basket. Store the index identifier and methodology.

### Earnings estimate

Compare the forecasted financial metric with an authoritative reported value. Do not use stock return as the primary verdict.

Required dimensions can include:

- metric name
- period
- forecast value
- reported value
- tolerance rule
- direction or range correctness

### Range forecast

A range forecast requires a declared rule such as:

- horizon value inside range
- proportion of sessions inside range
- maximum breach

### Educational-only statement

Educational statements are not prediction claims. They belong in knowledge notes and must not enter prediction accuracy rankings.

## Evaluation record target contract

```json
{
  "id": "evaluation-example",
  "subjectType": "claim",
  "subjectId": "claim-example",
  "policyVersion": "fmstock-eval-1.0.0",
  "status": "evaluated",
  "verdict": "partial_hit",
  "requestedBaseDate": "2026-01-02",
  "resolvedBaseDate": "2026-01-02",
  "requestedTargetDate": "2026-07-02",
  "resolvedTargetDate": "2026-07-02",
  "securityId": "KRX-005930",
  "priceBasis": "adjusted_close",
  "basePrice": 70000,
  "horizonPrice": 76000,
  "maxPriceDuringWindow": 80000,
  "minPriceDuringWindow": 65000,
  "rawReturn": 0.085714,
  "directionalReturn": 0.085714,
  "benchmarkId": "KRX-KOSPI",
  "benchmarkReturn": 0.04,
  "directionalAlpha": 0.045714,
  "targetReachedDuringWindow": true,
  "targetReachedAtHorizon": false,
  "marketDataBuildId": "market-build-example",
  "calculatedAt": "2026-07-03T00:00:00Z",
  "reviewStatus": "approved",
  "reviewedBy": "human-reviewer",
  "memo": ""
}
```

## FMIndex evaluation horizons

FMIndex requires shorter horizons than long-form expert forecasts.

Initial research horizons:

```text
1 trading day
5 trading days
20 trading days
60 trading days
```

Optional intraday research must use market-session-aware timestamps and must not be mixed with daily-close evaluation without labeling.

## Due-date lifecycle

A scheduled check should classify subjects without changing verdicts:

```text
now < targetDate -> not_due
now >= targetDate and market data missing -> pending_data
now >= targetDate and inputs ready -> ready_for_evaluation
```

Only a deterministic build plus review creates an authoritative `evaluated` record.

## Ranking rules

Every ranking must show:

- policy version
- sample count
- evaluated count
- invalid and insufficient-data count
- date range
- supported claim types
- strict and weighted accuracy distinction
- benchmark and price basis

Default minimum sample thresholds must be configurable and documented. Ties and missing metrics require deterministic handling.

## Recalculation and correction

Corrections must preserve history.

```text
old evaluation
-> superseded
new evaluation
-> active
correction record
-> reason, reviewer, date, affected fields
```

Do not silently edit a published evaluation in place when the change affects the result.

## Non-goals

- financial advice
- guaranteed predictive value
- ranking real people using unverified sample data
- assigning `miss` to unavailable data
- changing verdict logic in page-specific JavaScript
- hiding unfavorable outcomes
