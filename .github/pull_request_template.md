## Summary

Refs #

Describe what this PR changes and why.

## Change type

Check all that apply.

- [ ] Docs only
- [ ] Runtime/UI change
- [ ] Official data change under `data/`
- [ ] Research workspace candidate/template change
- [ ] Local tooling or validation script change
- [ ] GitHub/repository operations change

## Scope guard

- [ ] I did not modify or push directly to `main`.
- [ ] This PR is limited to the stated branch and issue scope.
- [ ] I did not add original PDFs, videos, full transcripts, full report text, downloaded source archives, credentials, secrets, certificates, tokens, or API keys.
- [ ] Candidate material remains `status: "candidate"` and `official: false` until reviewed and promoted.

## Validation

Use `N/A` only when the check is not relevant.

- [ ] `node scripts/validate-data.js` passed / N/A
- [ ] Local browser smoke passed / N/A
- [ ] Network 404 checked for UI changes / N/A
- [ ] Console uncaught errors checked for UI changes / N/A
- [ ] Changed file list matches intended scope

## Data PR checklist

Required when changing official `data/*.json` files.

- [ ] Expert/source/segment references checked / N/A
- [ ] Claim/evaluation references checked / N/A
- [ ] Claim vs knowledge note separation checked / N/A
- [ ] Duplicate records checked / N/A
- [ ] Ambiguous statements rejected or kept as candidate / N/A
- [ ] Source location can be reproduced by URL, time, page, section, or privatePath / N/A

## Runtime/UI checklist

Required when changing HTML/CSS/JS runtime files.

- [ ] Local static server tested / N/A
- [ ] Changed page renders / N/A
- [ ] Existing affected flows still work / N/A
- [ ] Version query bump applied where changed CSS/JS assets require cache invalidation / N/A

## Notes for reviewer

Add anything the reviewer should know, including local-only limitations, screenshots, or follow-up work.
