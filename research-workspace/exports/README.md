# Exports Workspace

Use this folder for intermediate structured outputs before promotion into `data/*.json`.

Files here are still candidates unless explicitly promoted into the app's official `data/` files.

## Allowed content

This folder may contain:

- source candidates normalized from SourceHub previews or manual notes
- claim candidates extracted from expert videos or analyst reports
- knowledge note candidates
- short operator review notes
- promotion review status

## Not allowed content

Do not store or commit:

- original PDF reports
- original video files
- full raw transcripts
- copied full report text
- downloaded source archives
- credentials, API keys, certificates, app secrets, account material, or tokens

Use URL, YouTube start/end time, report page/section, and local `privatePath` references instead of source-original payloads.

## Templates

Use these files as safe copy-start templates:

- `candidate-sources.template.json`
- `claim-candidates.template.json`
- `knowledge-note-candidates.template.json`

Template records must remain candidate records until a human reviewer promotes them into official data files.

## Promotion gate

Before promoting any candidate into `data/*.json`, check:

1. `docs/promotion-checklist.md`
2. source-original safeguards
3. duplicate records
4. source reference reproducibility
5. `node scripts/validate-data.js` after data changes

Validation passing is required but not sufficient. Human review must still confirm that a statement is a verifiable claim or an educational knowledge note.

## Suggested file naming for real exports

For real candidate batches, use dated files rather than editing templates directly:

```text
candidate-sources.2026-05.manual.json
claim-candidates.2026-05.manual.json
knowledge-note-candidates.2026-05.manual.json
```

Keep these files small and reviewable. Large raw extraction dumps belong outside the repository unless explicitly cleaned and approved as candidate structured data.
