# Engineering Review Roadmap

Date: 2026-05-19
Repository: `skerishKang/10000-fm-stock`

This document records the CTO-level review outcome for the current static MVP. It is intentionally written as an execution roadmap for future PRs, not as a product pitch.

## Current assessment

The repository has a reasonable MVP structure:

- static HTML/CSS/Vanilla JS frontend
- JSON-based data storage
- local validator for data contracts
- explicit source storage policy that forbids original videos, PDFs, full transcripts, copied full report text, source archives, and secrets

The main risk is not folder structure. The main risk is that validated JSON data and runtime JavaScript calculations do not currently share one fully consistent contract.

The most important mismatches are:

1. `direction` enum mismatch: data uses `bullish` / `bearish`, while return logic checks `long` / `short`.
2. date field mismatch: claim schema uses `baseDate` / `targetDate`, while period return calculation looks for `date` / `createdAt`.
3. percentage unit mismatch: data and calculations use raw percentage points, while some formatters document or apply decimal percentage behavior.
4. evaluated price timing mismatch: current main uses the current date as reference, while claim evaluation should be aligned with `claim.targetDate`.

These issues can make data validation pass while dashboard, ranking, hit/miss, and expert metrics are still wrong.

## Existing open issues and PRs already covering part of the work

Do not create duplicate work for these unless the scope changes.

| Issue | Scope | Existing PR |
|---|---|---|
| #133 | `formatPercent()` multiplies by 100 even though data stores raw percentage values | #139 |
| #134 | Add GitHub Actions workflow for data validator | #141 |
| #135 | Add static asset version audit script | #142 |
| #136 | Format `YYYY-MM-DD` without `Date` parsing | #140 |
| #144 | `getEvaluatedPrice()` uses current date instead of claim target date | #146 |

## New issue map from this review

| Issue | Priority | Purpose |
|---|---:|---|
| #151 | P0 | Align return metrics direction enum with claim data |
| #152 | P0 | Use `baseDate` from the claim schema in period return calculation |
| #153 | P0 | Define one canonical percentage unit across metrics and formatters |
| #159 | P0 | Add regression smoke for return calculation contract |
| #134 | P1 | Add data validator CI |
| #135 | P1 | Add static asset audit tooling |
| #155 | P1 | Repair `experts-detail.html` structure, navigation, and asset versioning |
| #154 | P2 | Add page initialization registry for all static pages |
| #156 | P2 | Align runtime required dataset policy with reference dependencies |
| #157 | P2 | Standardize safe DOM insertion for runtime messages |
| #158 | P3 | Document root folder roles and local-source boundaries |

## Recommended PR sequence

### PR A: return calculation contract fix

Target issues:

- #151
- #152
- #144 / PR #146 if not merged first

Recommended scope:

- `assets/js/metrics/metrics-returns.js`

Required behavior:

- Treat `bullish` as upward/long direction.
- Treat `bearish` as downward/short direction.
- Keep `long` and `short` as backward-compatible aliases only if useful.
- Use `claim.baseDate` as the canonical claim start date.
- Use `claim.targetDate` for evaluated price lookup.
- Do not change data files unless there is a separate data correction.

Validation:

- `node scripts/validate-data.js`
- Manual smoke on dashboard, claims, ranking, and expert detail if those pages are wired.

### PR B: percentage formatting contract fix

Target issues:

- #133
- #153

Recommended scope:

- `assets/js/utils/utils-dom.js`
- `assets/js/utils/utils-format.js`
- any renderer using return, alpha, benchmarkReturn, hit rate, win rate, or drawdown formatting

Required behavior:

- Canonical project unit: raw percentage points.
- Example: `16.67` means 16.67 percent.
- Formatters should not multiply by 100 unless the function name explicitly says it accepts decimal inputs.

Validation:

- Confirm `returnRate: 16.67` renders as `16.67%`, not `1667%`.
- `node scripts/validate-data.js`

### PR C: return metrics regression smoke

Target issue:

- #159

Recommended scope:

- `scripts/smoke-return-metrics.js`
- README or docs note explaining how to run it

Required coverage:

- bullish claim with `baseDate` and `targetDate`
- bearish claim with `baseDate` and `targetDate`
- raw percentage output remains raw percentage points
- evaluated price lookup aligns with target date

Validation:

- `node scripts/smoke-return-metrics.js`
- `node scripts/validate-data.js`

### PR D: CI and static asset tooling

Target issues:

- #134 / PR #141
- #135 / PR #142

Recommended scope:

- `.github/workflows/data-validate.yml`
- `scripts/audit-static-assets.js`

Validation:

- GitHub Actions workflow syntax is valid.
- `node scripts/audit-static-assets.js` has a deliberate warning/error policy.
- `node scripts/validate-data.js`

### PR E: expert detail HTML cleanup

Target issue:

- #155

Recommended scope:

- `pages/experts-detail.html`

Required behavior:

- Add missing `</body>` before `</html>`.
- Add version query strings to local CSS and JS references.
- Align nav menu with other main pages, including SourceHub.
- Keep script order safe: core scripts first, page modules next, `app-main.js` last.

### PR F: page initialization registry

Target issue:

- #154

Recommended scope:

- `assets/js/app/app-main.js`
- `assets/js/app/app-router.js`
- page-specific `*-main.js` modules as needed

Required behavior:

- All pages that require hydration have a clear init path.
- Unknown pages fail gracefully.
- Existing dashboard, claims, and source-hub behavior remains unchanged.

### PR G: runtime dataset policy

Target issue:

- #156

Recommended scope:

- `assets/js/data/data-loader.js`
- optional docs update if needed

Required behavior:

- Runtime required datasets do not conflict with validator reference requirements.
- `sources` and `segments` are either promoted to required core datasets or enforced by page-level requirements.

### PR H: DOM insertion safety audit

Target issue:

- #157

Recommended scope:

- JS renderers under `assets/js/**`
- shared DOM/escape utility if needed

Required behavior:

- Plain text uses `textContent`.
- Source-derived strings are escaped before HTML insertion.
- `innerHTML` and `insertAdjacentHTML` are limited to fixed templates or escaped content.

### PR I: folder role documentation

Target issue:

- #158

Recommended scope:

- `README.md`, `docs/project-map.md`, or small per-folder README files

Required behavior:

- Clarify top-level folder responsibilities.
- Explicitly state that original source materials remain forbidden in the repository.

## Merge discipline

- Do not push directly to `main`.
- Use one branch per focused PR.
- Keep PRs small enough to review.
- Avoid mixing data changes, runtime logic changes, tooling, and documentation unless the issue explicitly requires it.
- Any PR touching data or validation must run `node scripts/validate-data.js`.
- Any PR touching HTML asset references should run the static asset audit once #135 is merged.

## Done definition for this review package

This roadmap is complete when:

- all issues above exist,
- this document is merged or otherwise kept as the current execution map,
- follow-up implementation PRs are created according to the sequence above,
- unresolved implementation work is handed off with exact issue numbers and acceptance criteria.
