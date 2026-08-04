---
name: FMIndex or evaluation implementation
description: Plan a scoped FM-Stock evaluation or FMIndex implementation change
title: "[P?] "
labels: []
assignees: []
---

## Background

Describe the verified current behavior, affected data or pages, and why the change is needed.

## Goal

State one measurable outcome.

## Scope

- 

## Out of scope

- 

## Data and policy impact

- Dataset mode affected: demo / production / both / none
- Official data changed: yes / no
- Evaluation policy version affected: yes / no
- FMIndex collection policy affected: yes / no
- Raw or restricted data involved: yes / no
- Personal-data or source-compliance review required: yes / no

## Contracts and versions

List schemas, policy versions, model versions, aggregate versions, or migration notes.

## Acceptance criteria

- [ ] 

## Validation

- [ ] `node scripts/validate-data.js`
- [ ] `node scripts/smoke-return-metrics.js`
- [ ] `node scripts/audit-static-assets.js`
- [ ] relevant unit or contract tests
- [ ] browser smoke when runtime UI changes
- [ ] accessibility smoke when UI changes
- [ ] old/new metric comparison when evaluation logic changes
- [ ] benchmark and error report when model or aggregation logic changes

## Safety and publication checks

- [ ] no source originals, raw community archives, credentials, cookies, or secrets committed
- [ ] candidate or model output does not write directly to official data
- [ ] demo and production records are not mixed
- [ ] missing data is not converted into a failed prediction or neutral index
- [ ] sample count, coverage, versions, and limitations remain visible
- [ ] rollback or correction path is documented

## Dependencies

- 

## Related documents

- `docs/project-status-2026-08-04.md`
- `docs/evaluation-methodology.md`
- `docs/fmindex-product-vision.md`
- `docs/fmindex-architecture.md`
- `docs/fmindex-data-and-collection-policy.md`
- `docs/fmindex-research-plan.md`
- `docs/fmstock-fmindex-roadmap.md`
