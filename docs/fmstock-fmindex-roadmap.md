# FM-Stock and FMIndex Roadmap

## Roadmap principle

The next phase is not feature expansion for its own sake. The sequence prioritizes data truth, evaluation reproducibility, and source-compliant research before live collection or public ranking.

## Phase 0 — Documentation and backlog

Status: documented in branch `docs/fmindex-strategy-and-backlog`.

Deliverables:

- current project status
- authoritative evaluation methodology
- FMIndex product definition
- target architecture and data contracts
- collection, minimization, and publication policy
- research and validation plan
- implementation backlog and Epic

Exit condition:

- no implementation implied
- development order agreed
- FMIndex named and scoped

## Phase 1 — Demo and production boundary

Goals:

- mark current records as demo fixtures
- add dataset metadata
- display visible demo disclosure on every public screen
- prevent demo records from being mistaken for real expert or source evaluations
- define production-data promotion criteria

Target artifacts:

```text
data/dataset-metadata.json
fixtures/demo/** or equivalent boundary
```

Exit condition:

- dataset mode is machine-readable and visible
- no real-person ranking can be published from demo mode

## Phase 2 — Authoritative evaluation core

Goals:

- implement one evaluation contract
- remove page-specific verdict divergence
- separate verdict states from missing-data states
- normalize bullish and bearish outcomes
- use benchmark data from evaluation inputs
- support policy versions

Exit condition:

- one deterministic build creates official evaluation candidates
- all pages display authoritative results
- old and new result comparison report exists

## Phase 3 — Claim-type evaluators

Goals:

- stock price evaluator
- market/index evaluator
- earnings estimate evaluator
- range forecast evaluator
- educational-only exclusion

Exit condition:

- each claim declares its evaluator type
- incompatible records are rejected or marked unverifiable
- tests cover each evaluator

## Phase 4 — Market-data reproducibility

Goals:

- canonical securities
- daily price snapshots
- benchmark snapshots
- trading-day resolution
- corporate-action and price-basis policy
- market data build reports

Exit condition:

- every evaluation can be reproduced from versioned inputs
- data source and resolved dates are displayed

## Phase 5 — Due evaluation operations

Goals:

- not-due, pending-data, ready, under-review, and evaluated lifecycle
- overdue report
- evaluation candidate generation
- review and apply with rollback
- operator dashboard or report

Exit condition:

- no expired pending claim remains invisible
- every overdue record has a reason and next action

## Phase 6 — Ranking trustworthiness

Goals:

- strict versus weighted accuracy
- minimum sample policy
- invalid and insufficient-data disclosure
- date-range and policy-version display
- correction and supersession history
- metric consistency tests

Exit condition:

- expert and claim rankings are reproducible
- ranking pages explain sample and methodology
- demo and production results cannot be mixed

## Phase 7 — CI and release gates

Goals:

- run data validation on all relevant changes
- run metric smoke tests in CI
- run static asset audit in CI
- run overdue and evaluation-consistency checks
- add browser smoke and accessibility checks
- publish build reports as artifacts

Exit condition:

- required checks protect `main`
- metric logic changes cannot merge without contract tests

## Phase 8 — FMIndex annotation pilot

Goals:

- label guide
- 200–300 observation pilot
- annotator disagreement analysis
- entity alias registry
- first sentiment baseline

No automated collection is required.

Exit condition:

- label guide is usable
- ambiguity and failure cases are documented
- larger benchmark plan approved

## Phase 9 — FMIndex benchmark

Goals:

- 1,000–3,000 diverse observations
- time-separated test set
- entity-linking benchmark
- sentiment benchmark
- sarcasm, slang, and quoted-speech slices
- confidence calibration

Exit condition:

- benchmark report and known limitations exist
- publication precision threshold is defined

## Phase 10 — FMIndex aggregation research

Goals:

- equal-weight baseline
- confidence weighting
- repeated-author caps
- duplicate-cluster caps
- limited engagement weighting
- low-sample and partial-coverage behavior

Exit condition:

- aggregation version is chosen for research use
- weighting effects and failure modes are reported

## Phase 11 — Historical outcome study

Goals:

- 1D, 5D, 20D, and 60D outcomes
- directional and contrarian hypotheses
- attention and disagreement cohorts
- expert/community agreement cohorts
- out-of-sample evaluation

Exit condition:

- predictive, contrarian, or null findings are documented honestly
- no product signal claim exceeds evidence

## Phase 12 — Limited approved collection pilot

Goals:

- source policy approval
- one source adapter
- incremental collection
- retry, backoff, and kill switch
- restricted retention
- private aggregate previews

Exit condition:

- collection health and compliance review pass
- no raw archive enters the public repository
- no public live index yet

## Phase 13 — FMIndex delayed research preview

Goals:

- delayed aggregate publication
- visible source, sample, coverage, versions, and update time
- correction path
- aggregate outcome tracking
- no individual-user profiling

Exit condition:

- research preview gate in `docs/fmindex-data-and-collection-policy.md` passes

## Phase 14 — FM-Stock and FMIndex integration

Goals:

- shared security IDs
- same-time expert claim and community aggregate comparison
- agreement/disagreement cohorts
- unified outcome evidence page
- independent source and policy versions

Exit condition:

- each side remains independently auditable
- integration does not copy raw community content into FM-Stock

## Phase 15 — Multi-source expansion

Goals:

- source-specific adapters and indices
- coverage normalization
- combined index methodology
- source outage isolation
- source-specific correction controls

Exit condition:

- source-specific indices remain visible
- combined score has a separate validated methodology

## Deferred decisions

- final FMIndex repository name and visibility
- database and queue technology
- scheduled hosting platform
- model provider or fine-tuning approach
- exact source adapter implementation
- real-time versus delayed publication interval
- monetization model

These decisions should be made only when the preceding data and operational requirements justify them.

## First development sequence

When development resumes, use this order:

1. demo/production boundary
2. authoritative evaluation schema and tests
3. market data contracts
4. due-evaluation operations
5. metric and ranking correction
6. CI expansion
7. FMIndex label guide and pilot dataset

Do not start with a crawler.
