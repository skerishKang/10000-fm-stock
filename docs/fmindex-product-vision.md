# FMIndex Product Vision

## Name

**FMIndex** is the approved product and module name for the community sentiment index direction.

Preferred forms:

- Product: `FMIndex`
- Repository or package slug: `fmindex`
- Korean description: `커뮤니티 시장심리지수`
- Initial source-specific display: `FMIndex · FMKorea`

The name is broader than one community so the architecture can later support multiple sources without renaming the product.

## Product statement

> FMIndex records how public investor communities felt about the market, sectors, and securities at a specific time, converts those observations into transparent sentiment aggregates, and evaluates what happened afterward.

## Relationship with FM-Stock

FMIndex extends the same evidence-and-evaluation philosophy as FM-Stock but observes a different unit.

| System | Primary unit | Main horizon | Primary output |
|---|---|---|---|
| FM-Stock | attributable public claim | months | claim and expert evaluation |
| FMIndex | community observation window | days or weeks | market and security sentiment index |

Shared question:

> What was said or felt at a known time, and what happened later?

## Product goals

1. Measure market-wide and security-specific community sentiment over time.
2. Distinguish sentiment, emotion, conviction, attention, and disagreement.
3. Preserve enough provenance to audit aggregate results without republishing unnecessary raw content.
4. Evaluate whether extreme optimism, fear, or disagreement had predictive or contrarian value.
5. Compare community sentiment with expert claims on the same security and time period.
6. Support additional communities through source adapters while keeping one common observation and aggregate contract.

## Initial research questions

- Does extreme negative sentiment precede short-term rebounds?
- Does extreme positive sentiment precede underperformance?
- Is attention growth more predictive than sentiment direction?
- Does disagreement predict volatility rather than direction?
- Are comments more informative than post titles?
- Which sectors have the most stable sentiment-outcome relationship?
- When do expert forecasts and community sentiment diverge?
- Does one community lead or lag another?

## Initial product surfaces

### Market pulse

- current market sentiment score
- score change over 1 hour and 1 day
- attention volume
- disagreement level
- top positive and negative themes
- data freshness and sample size

### Security sentiment

- ticker and company
- hourly and daily sentiment
- post and comment counts
- positive, negative, and neutral shares
- fear, greed, excitement, frustration, and uncertainty signals
- future 1D, 5D, 20D, and 60D evaluated outcomes

### Extreme-event archive

- strongest optimism events
- strongest fear events
- attention spikes
- disagreement spikes
- later returns and benchmark-relative outcomes

### Expert versus community

- expert claim direction
- FMIndex direction at the same observation time
- subsequent market outcome
- agreement and disagreement cohorts

## Index dimensions

FMIndex should not be reduced to one opaque number. The product may display a headline score, but the underlying dimensions remain visible.

Recommended dimensions:

```text
polarity
emotion
intensity
conviction
attention
engagement
disagreement
model confidence
entity confidence
source coverage
```

## Headline score

The first research score should remain interpretable.

Example baseline:

```text
polarityScore = 100 * (positiveWeight - negativeWeight) / totalEligibleWeight
```

Range:

```text
-100 = fully negative
0 = balanced or neutral
+100 = fully positive
```

This is a baseline experiment, not a permanent product truth. Weighting, smoothing, and bot/duplicate controls must be versioned.

## Additional indices

Potential separate outputs:

- `FMIndex Sentiment`
- `FMIndex Attention`
- `FMIndex Fear`
- `FMIndex Greed`
- `FMIndex Disagreement`
- `FMIndex Momentum`
- `FMIndex Contrarian Signal` — research-only until validated

Do not combine all dimensions into one score before individual validity is measured.

## Target users

### Research user

Wants historical sentiment and outcome comparison.

### Individual investor

Wants a concise, clearly caveated view of current community mood, not a buy or sell signal.

### Journalist or analyst

Wants evidence of how investor conversation changed around an event.

### Internal operator

Wants collection health, classification confidence, missing entities, duplicate rates, and publication review queues.

## Product principles

### Evidence before volume

A smaller auditable dataset is preferred to a large opaque scrape.

### Aggregate by default

Public output should emphasize aggregates and trends, not individual community users.

### No automatic financial advice

The product describes observed sentiment and historical outcomes. It does not issue personalized recommendations.

### Methodology visible

Each chart or score must expose:

- source
- observation window
- sample size
- coverage
- model or rules version
- aggregation version
- update time
- known limitations

### Human-reviewed launch

Initial production publication requires review of source compliance, data quality, entity mapping, and model performance.

## Product phases

### Phase A — offline benchmark

- manually labeled sample
- no automated collection
- no public live index
- classification and aggregation experiments

### Phase B — limited collection research

- one approved source adapter
- restricted retention
- internal aggregates
- coverage and quality monitoring

### Phase C — research preview

- delayed aggregate publication
- methodology and sample size visible
- no real-time trading claims
- outcome evaluation after fixed horizons

### Phase D — multi-source platform

- additional community adapters
- source-specific and combined indices
- expert/community comparison
- correction and incident operations

## Explicit non-goals

- copying or redistributing entire community archives
- exposing individual-user behavioral profiles
- targeting or scoring named private individuals
- bypassing access controls
- collecting private or login-only content without an approved basis
- treating sentiment as guaranteed price prediction
- deploying an opaque model with no benchmark report
- merging raw collection into the public static repository
