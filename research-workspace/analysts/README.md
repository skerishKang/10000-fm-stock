# Analysts Workspace

Use this folder for brokerage analysts, research firms, and report candidates.

## Manual input files

- `analyst-index.template.csv`: analyst/person index.
- `firms.template.csv`: brokerage/research-center URLs.
- `reports.template.csv`: individual report candidates.
- `report-notes/`: manually written analysis notes for selected report pages or sections.

## Report type classification

Use fields rather than folders for content classification.

Recommended report types:

- `company`: company or ticker report
- `industry`: sector or industry report
- `strategy`: market strategy or outlook
- `macro`: economy, rates, FX, inflation
- `derivatives`: derivatives, bonds, structured products, or other specialist reports
- `other`: uncategorized

## Rule

PDF/report originals must not be committed. Store only URL references, page/section references, short notes, and extracted candidates.

```text
analyst -> firm -> report -> report note -> claim/knowledge candidate
```
