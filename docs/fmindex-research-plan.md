# FMIndex Research and Validation Plan

## Purpose

FMIndex must demonstrate measurement validity before it becomes a live index. This plan defines the minimum offline experiments, benchmark datasets, evaluation reports, and promotion gates.

## Research sequence

```text
label definitions
-> manually labeled benchmark
-> deterministic baseline
-> model benchmark
-> aggregation experiments
-> historical outcome study
-> limited collection pilot
-> delayed research preview
```

Automated collection is not the first milestone.

## Benchmark dataset

### Initial size

Recommended first target:

```text
1,000 to 3,000 observations
```

A smaller pilot of 200 to 300 observations may validate the annotation guide, but it is not sufficient for a launch decision.

### Required diversity

Include:

- market-wide posts
- security-specific posts
- sector and theme posts
- post titles and comments
- bullish, bearish, neutral, and unclear items
- fear, greed, excitement, frustration, uncertainty, and humor
- slang, abbreviations, misspellings, sarcasm, rhetorical questions, and quoted speech
- high and low engagement
- repeated and near-duplicate content
- content with no valid investable entity

### Time separation

Create training/development and test sets with time separation where possible. Near-duplicate messages and the same thread must not leak across splits.

## Annotation dimensions

Required labels:

- `contentType`
- `marketScope`
- `entities`
- `polarity`
- `emotion`
- `intensity`
- `conviction`
- `uncertainty`
- `sarcasmRisk`
- `predictionLike`
- `spamOrPromotion`
- `duplicateCluster`
- `adjudicationStatus`

## Label guide quality

Before large annotation:

1. Two annotators label the same pilot set.
2. Disagreements are classified by cause.
3. Label definitions and examples are revised.
4. A second pilot is labeled.
5. Inter-annotator agreement and unresolved ambiguity are reported.

Do not hide inherently ambiguous classes by forcing consensus without recording disagreement.

## Baseline systems

### Lexicon baseline

A simple positive/negative term baseline provides a lower bound and exposes domain slang gaps.

### Rule baseline

Rules can handle obvious patterns such as ticker aliases, repeated laughter, strong profanity, negation, target prices, and explicit buy/sell phrasing.

### General language-model baseline

Evaluate a general classifier with a fixed prompt or model version.

### Domain-adapted candidate

Only after baseline results are recorded should the project introduce domain tuning, retrieval examples, or fine-tuning.

## Entity-linking evaluation

Report:

- exact security match precision and recall
- company and sector match precision and recall
- no-entity accuracy
- alias and slang slice performance
- ambiguous-name errors
- multi-entity performance

False entity links can invert a security-level index, so high precision is preferred for publication.

## Sentiment evaluation

Report at minimum:

- macro and per-class precision, recall, and F1
- confusion matrix
- confidence calibration
- neutral and unclear handling
- sarcasm slice
- quoted-speech slice
- post versus comment slice
- market versus security slice
- sector slices where sample permits

## Aggregation experiments

Compare transparent formulas.

### Baseline A — equal weight

Every eligible observation contributes equally.

### Baseline B — classifier confidence

Weight by calibrated classification confidence with an upper cap.

### Baseline C — author-capped

Apply source-scoped repeated-author caps.

### Baseline D — duplicate-cluster capped

Cap a duplicate cluster so copied content does not dominate.

### Baseline E — limited engagement weight

Apply a small capped engagement multiplier and compare whether it improves outcome association or only amplifies popular noise.

Each experiment must publish its aggregation version and coverage effects.

## Window experiments

Initial windows:

```text
15 minutes — research only
1 hour
1 day
5 trading days
```

For low-volume securities, use longer windows or label insufficient coverage rather than forcing an hourly score.

## Outcome study

For each aggregate snapshot, evaluate:

- next 1 trading day return
- next 5 trading day return
- next 20 trading day return
- next 60 trading day return
- benchmark-relative return
- realized volatility
- maximum favorable and adverse excursion

Study both directional and contrarian hypotheses.

### Directional hypothesis

Positive sentiment predicts positive future directional return.

### Contrarian hypothesis

Extreme positive sentiment predicts weaker future performance, and extreme negative sentiment predicts rebound.

Do not select the successful hypothesis after observing results without clearly labeling it exploratory.

## Cohort analysis

Required cohorts:

- sentiment deciles
- extreme top and bottom 5 or 10 percent
- attention spike versus normal
- high disagreement versus low disagreement
- high-confidence versus low-confidence model output
- market-wide versus security-specific
- sector groups
- high-liquidity versus low-liquidity securities
- expert/community agreement versus disagreement

## Statistical safeguards

- disclose sample sizes
- use out-of-sample periods
- correct or clearly disclose multiple hypothesis testing
- avoid overlapping-window inflation where it materially affects inference
- report confidence intervals where practical
- report effect size, not only significance
- preserve negative and null findings
- version every dataset and experiment

## Product quality metrics

FMIndex has two distinct quality areas.

### Measurement quality

- entity precision
- sentiment classification quality
- coverage
- duplicate control
- confidence calibration
- source continuity

### Outcome relationship

- return difference by sentiment cohort
- benchmark-relative difference
- stability across periods
- stability across sectors
- drawdown and volatility relationship
- failure during regime changes

A strong classifier does not guarantee predictive value. The two must be reported separately.

## Minimum research-preview gate

A delayed public research preview requires:

- approved source policy
- benchmark dataset and label guide version
- entity and sentiment benchmark report
- aggregation comparison report
- at least one out-of-sample historical study
- coverage and missing-window policy
- visible sample counts and methodology versions
- no claim of guaranteed prediction
- correction and publication rollback path

## Required artifacts

```text
research/fmindex/
├── label-guide.md
├── dataset-card.md
├── benchmark-report.md
├── entity-error-analysis.md
├── sentiment-error-analysis.md
├── aggregation-experiments.md
├── outcome-study.md
├── known-limitations.md
└── release-decision.md
```

The future implementation may choose different paths, but the artifact roles must remain.

## Stop conditions

Pause or redesign before public launch when:

- source collection is not approved or is unstable
- entity precision is too low for security-level publication
- sentiment performance collapses on slang or sarcasm
- repeated users or duplicates dominate results
- coverage is too sparse for the advertised window
- outcome findings disappear out of sample
- methodology changes are not reproducible
- personal-data minimization cannot be enforced
