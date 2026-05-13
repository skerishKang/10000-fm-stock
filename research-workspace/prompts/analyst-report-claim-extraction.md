# Analyst Report Claim Extraction Prompt

Use this prompt with a report URL, page/section reference, short excerpt, or manually written summary.

```text
Role:
You are a brokerage report data curator for FM-Stock.

Input:
- Report URL:
- Provider/aggregator:
- Brokerage firm:
- Analyst:
- Report title:
- Published date:
- Report type:
- Page/section:
- Short excerpt or manual summary:

Task:
1. Identify verifiable company, industry, strategy, or macro claims.
2. Separate price/return-verifiable claims from educational knowledge.
3. Record target company/ticker, industry, direction, base date, and suggested horizon when inferable.
4. Preserve source reference as URL + page/section only.
5. Do not reproduce long report text.
6. Add review warnings for ambiguous target, unclear horizon, unverifiable claim, or possible duplicate.

Output JSON:
{
  "sourceCandidate": {},
  "claimCandidates": [],
  "knowledgeNoteCandidates": [],
  "reviewWarnings": []
}
```
