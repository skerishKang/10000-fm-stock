# Mimo v2.5 Pro Handoff

Date: 2026-05-19
Repository: `skerishKang/10000-fm-stock`

## Role

You are acting as a local implementation model for the FM-Stock static MVP.

Work carefully. Do not push directly to `main`. Create focused branches and PRs. Keep each PR small and verifiable.

## Repository rules

- Static MVP only: HTML, CSS, Vanilla JavaScript, JSON data files.
- No backend, database, login, crawler, broker API, or live price API work unless a separate issue explicitly asks for it.
- Do not commit original videos, original report PDFs, full raw transcripts, copied full report text, downloaded source archives, API keys, app secrets, credentials, certificates, or tokens.
- Data-changing work must run `node scripts/validate-data.js`.
- Keep HTML/CSS/JS files under roughly 500 lines where practical.
- Prefer module splits by folder and filename.

## Current CTO priority

The highest-priority problem is runtime calculation correctness.

Validated JSON data and runtime metrics currently disagree on direction values, date fields, and percentage units. Fix these before investing in UI polish.

## Do first

### Task 1: Return calculation contract fix

Issues:

- #151
- #152
- #144 if PR #146 is not already merged

Recommended branch:

```text
fix/return-calculation-contract
```

Primary file:

```text
assets/js/metrics/metrics-returns.js
```

Expected behavior:

- `bullish` is the canonical upward direction.
- `bearish` is the canonical downward direction.
- `long` and `short` may remain aliases, but should not be the only supported values.
- `calculateReturnsForPeriods()` should use `claim.baseDate` for current data.
- `getEvaluatedPrice()` should use `claim.targetDate` first, not the current date.
- Do not change data files for this PR unless you find a separate data error.

Validation:

```bash
node scripts/validate-data.js
```

Manual smoke if possible:

- dashboard metrics still render
- claims page still renders
- ranking page still renders
- expert detail page behavior is noted even if it is currently blocked by separate init/HTML issues

### Task 2: Percentage unit contract

Issues:

- #133
- #153

Recommended branch:

```text
fix/percentage-unit-contract
```

Primary files:

```text
assets/js/utils/utils-dom.js
assets/js/utils/utils-format.js
assets/js/metrics/*.js
assets/js/**/render*.js
```

Expected behavior:

- Canonical internal and JSON unit is raw percentage points.
- `16.67` means 16.67 percent.
- Formatters should not multiply by 100 unless the function name clearly says it accepts decimal inputs.
- Existing data should not display as x100.

Validation:

```bash
node scripts/validate-data.js
```

Confirm that `returnRate: 16.67` displays as 16.67 percent, not 1667 percent.

### Task 3: Return metrics smoke test

Issue:

- #159

Recommended branch:

```text
test/return-metrics-smoke
```

Expected file:

```text
scripts/smoke-return-metrics.js
```

The smoke should cover:

1. bullish claim with `baseDate`, `targetDate`, basePrice, targetPrice, and matching evaluation
2. bearish claim with matching evaluation
3. raw percentage output remains raw percentage points
4. evaluated price lookup uses target date rather than current date

It must be dependency-free and runnable with Node.

## Do next

### Task 4: CI and static asset tooling

Issues and existing PRs:

- #134 / PR #141
- #135 / PR #142

Do not duplicate these PRs. Review and update the existing PRs if needed.

### Task 5: Expert detail page cleanup

Issue:

- #155

Primary file:

```text
pages/experts-detail.html
```

Expected fixes:

- add missing `</body>`
- add `?v=` query strings to local CSS and JS references
- align nav with main pages, including SourceHub
- confirm script order remains safe

### Task 6: Page init registry

Issue:

- #154

Expected result:

- all JS-hydrated pages have explicit init paths
- `experts.html` and `experts-detail.html` are wired if their modules are present
- existing dashboard, claims, and source-hub behavior does not regress

## Do later

### Task 7: Runtime dataset policy

Issue:

- #156

Choose either:

- promote `sources` and `segments` to required core datasets, or
- add page-level required dataset declarations

### Task 8: DOM insertion safety audit

Issue:

- #157

Use `textContent` for plain text and escape source-derived strings before HTML insertion.

### Task 9: Folder role documentation

Issue:

- #158

Document top-level folder responsibilities and local source boundaries.

## Report format back to CTO

When you finish any task, report in this format:

```md
## Result
- Issue(s): #...
- Branch:
- PR:
- Head SHA:
- Changed files:

## Validation
- node scripts/validate-data.js: PASS/FAIL/NOT RUN
- smoke-return-metrics: PASS/FAIL/NOT RUN
- browser smoke: PASS/FAIL/NOT RUN, with reason

## Safety
- Data files changed: yes/no
- Source originals added: yes/no
- Secrets added: yes/no
- Backend/API/Auth/DB changes: yes/no

## Notes
- What was fixed
- What remains blocked
- Any behavior intentionally not changed
```

## Scoring criteria for your result

Your result will be scored out of 100 using:

- correctness: 35
- scope control: 20
- validation quality: 20
- safety / no forbidden materials: 15
- report clarity: 10

A good result is 88+.
A result that fixes code but does not validate is usually below 80.
A result that changes data, source policy, or unrelated UI without justification is below 75.
A result that adds source originals, secrets, or broad unreviewable changes fails regardless of code quality.
