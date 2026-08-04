# 10000 FM Stock

FM-Stock is a static MVP for recording public stock and industry statements made by analysts, YouTubers, broadcast guests, investors, and report authors, then evaluating those statements after a defined horizon.

The project has two existing product goals:

1. Verify whether public stock or industry forecasts were directionally and quantitatively useful.
2. Preserve useful industry and company knowledge from public videos and reports as educational notes.

The documented next product direction is **FMIndex**, a separate community market-sentiment index that records how public investor communities felt about the market, sectors, and securities at a known time and evaluates what happened afterward.

## Current status

```text
CURATION_PIPELINE_MATURE
STATIC_PRODUCT_FUNCTIONAL
REAL_DATA_AND_SCORING_NOT_READY
FMINDEX_DOCUMENTED_NOT_IMPLEMENTED
```

Important current limitations:

- current expert, source, claim, and evaluation records are demo/sample data
- demo and production datasets are not yet technically separated
- the authoritative evaluation method is not yet implemented as one versioned build artifact
- stored evaluation results and browser-side metric recalculation can diverge
- market price and benchmark inputs are not yet sufficient to reproduce every evaluation
- overdue evaluation operations are not yet implemented
- FMIndex collection, classification, aggregation, and publication are planning documents only

Do not present the current sample rankings as verified real-person performance.

See [`docs/project-status-2026-08-04.md`](docs/project-status-2026-08-04.md).

## Product boundaries

### FM-Stock

```text
public source reference
-> segment
-> attributable claim or knowledge note
-> authoritative outcome evaluation
-> claim and expert evidence
```

FM-Stock remains the source, claim, knowledge, and evaluation system.

### FMIndex

```text
approved community source
-> time-bounded observations
-> entity and sentiment classification
-> quality-controlled aggregate
-> short-horizon outcome evaluation
```

FMIndex is the approved product name for the community sentiment direction. It is not a rename of FM-Stock.

Preferred naming:

- Product: `FMIndex`
- Slug: `fmindex`
- Korean description: `커뮤니티 시장심리지수`
- Initial source-specific display: `FMIndex · FMKorea`

FMIndex should be implemented in a separate collection and aggregation boundary and integrate with FM-Stock through shared security, market-data, and evaluation contracts. Do not add automated community collection or raw community archives directly to the static browser runtime.

See:

- [`docs/fmindex-product-vision.md`](docs/fmindex-product-vision.md)
- [`docs/fmindex-architecture.md`](docs/fmindex-architecture.md)
- [`docs/fmindex-data-and-collection-policy.md`](docs/fmindex-data-and-collection-policy.md)
- [`docs/fmindex-research-plan.md`](docs/fmindex-research-plan.md)
- [`docs/fmstock-fmindex-roadmap.md`](docs/fmstock-fmindex-roadmap.md)

## Current MVP scope

The existing application is intentionally static:

- HTML
- CSS
- Vanilla JavaScript
- JSON data files
- dependency-light Node.js local scripts

The current browser runtime does not use a database, login system, Firebase, Supabase, backend API, automatic crawler, live price API, or broker API.

Future FMIndex implementation may require a separate private pipeline, scheduler, storage, or model runtime. Technology selection is deferred until the benchmark and source-policy phases justify it.

## Evaluation policy direction

All public results should eventually come from one authoritative, versioned evaluation artifact.

```text
claim or FMIndex aggregate
+ normalized security
+ price and benchmark snapshots
+ evaluation policy version
-> deterministic evaluation candidate
-> human review
-> official evaluation
```

Missing data, invalid statements, and unverifiable subjects must not be counted as failed predictions.

See [`docs/evaluation-methodology.md`](docs/evaluation-methodology.md).

## Source storage policy

Original source files are not stored or redistributed in this repository.

Allowed references include:

- source URL
- YouTube start/end time
- report URL or local `privatePath`
- report page or section
- short operator memo
- structured claim, evaluation, and knowledge note JSON
- synthetic FMIndex fixtures
- approved aggregate FMIndex artifacts without unnecessary personal data

Do not commit:

- original videos
- original report PDFs
- full raw transcripts
- copied full report text
- downloaded source archives
- raw community archives or source HTML dumps
- usernames and profile histories for individual behavioral profiling
- private or login-only content
- session cookies or collection credentials
- API keys, app secrets, account credentials, certificates, or tokens

Raw working materials should stay in an approved local or private boundary, such as:

```text
/mnt/g/Ddrive/BatangD/task/workdiary/
├── 10000-fm-stock/
└── 10000-fm-stock-local-sources/
```

FMIndex collection must not start until a source-specific collection, retention, and publication policy is approved. Public visibility alone is not sufficient authorization.

## Local static server

Run the static site locally from the repository root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Operator workflow

Use this flow for manual curation:

```text
SourceHub candidate input
-> research workspace export template
-> promotion checklist review
-> official data edit or promotion apply
-> local validator
-> PR review
```

Relevant files:

- SourceHub page: `pages/source-hub.html`
- SourceHub candidate sample: `data/candidate-sources.sample.json`
- Candidate source export template: `research-workspace/exports/candidate-sources.template.json`
- Claim candidate export template: `research-workspace/exports/claim-candidates.template.json`
- Knowledge note candidate export template: `research-workspace/exports/knowledge-note-candidates.template.json`
- Promotion checklist: `docs/promotion-checklist.md`
- Official data editing guide: `docs/data-editing-guide.md`
- Data sourcing strategy: `docs/mvp-data-sourcing-strategy.md`
- Pipeline runbook: `docs/source-segment-claim-pipeline-operations.md`
- Project folder map: `docs/project-map.md`
- Local validator: `scripts/validate-data.js`

Candidate records in the research workspace must remain `status: "candidate"` and `official: false` until human review promotes them into official `data/*.json` files.

FMIndex should reuse the same candidate -> preview -> review -> official pattern for aggregate publication.

## Data validation

Run the local JSON contract validator before and after changing any data files under `data/` or JSON templates under `research-workspace/exports/`:

```bash
node scripts/validate-data.js
```

The validator checks static MVP data contracts including:

- JSON parse and array root shape
- record ID presence and duplicate IDs
- claim references to experts, sources, and segments
- evaluation references to claims
- knowledge note references
- key enum values
- candidate source `status: "candidate"` and `official: false`
- research workspace JSON template baseline rules

Expected successful output ends with:

```text
Validation passed.
```

Current additional local checks include:

```bash
node scripts/smoke-return-metrics.js
node scripts/audit-static-assets.js
```

A future CI expansion should make metric smoke tests, static asset audits, overdue checks, and evaluation consistency mandatory for relevant changes.

## Recommended development order

1. Separate demo and production datasets.
2. Implement one authoritative evaluation schema and policy version.
3. Add reproducible security, price, and benchmark contracts.
4. Add due and overdue evaluation operations.
5. Correct direction-aware metrics and rankings.
6. Expand CI and browser validation.
7. Build an FMIndex label guide and manually labeled pilot dataset.
8. Benchmark entity linking and sentiment classification.
9. Compare transparent aggregation formulas.
10. Approve and test one limited source adapter in a separate private pipeline.
11. Publish delayed aggregate research only after quality and policy gates pass.

Do not start FMIndex development with a crawler.

## Development rules

- Do not modify or push directly to `main`.
- Use branch -> PR -> review -> squash merge.
- Keep each HTML/CSS/JS file under roughly 500 lines where practical.
- Prefer folder-name/file-name module splits.
- Keep frontend changes, local tooling changes, data changes, and policy documentation in separate PRs when possible.
- Do not promote candidate data to official data without human review.
- Do not publish real-person rankings from demo or unreproducible data.
- Do not let model output or collection jobs write directly to official FMIndex aggregates.
- Version any methodology change that can alter a public score or verdict.
