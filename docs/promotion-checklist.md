# Candidate-to-Official Promotion Checklist

## Purpose

This checklist defines when a candidate source, segment, claim, or knowledge note can be promoted into official FM-Stock static data.

The project should optimize for defensible curation quality, not raw ingestion volume. A small set of well-referenced claims is better than a large set of ambiguous, weakly sourced, or legally risky records.

## Non-negotiable safeguards

Before any promotion, confirm all of the following:

- Do not store original video files.
- Do not store original report PDFs.
- Do not store full raw transcripts.
- Do not store copied full report text.
- Do not commit downloaded source archives.
- Do not commit API keys, app secrets, credentials, certificates, tokens, or broker account material.
- Use URL, YouTube start/end time, report page/section, or local `privatePath` references instead of source originals.
- Keep raw working material in the sibling local sources folder, not inside the Git repository.

## Promotion flow

Approved flow:

```text
candidate_source
-> reviewed_source
-> segment
-> claim_candidate and/or knowledge_note
-> approved_claim
-> evaluated_claim
```

A source, claim, or knowledge note is official only after human review and promotion into approved static JSON files.

## Candidate source -> reviewed source

Promote a candidate source only when all required checks pass.

Required checks:

- Source is public, reviewable, or represented by a local private reference path.
- Source can be identified later using one of:
  - URL
  - YouTube URL plus start/end time
  - report URL plus page/section
  - local `privatePath` plus page/section
- Publisher, channel, brokerage, speaker, author, or analyst is identifiable enough for later review.
- Publication date is known or explicitly marked unknown before official use.
- Candidate record has `status: "candidate"` and `official: false` before promotion.
- No full transcript, report body, or source-original payload is copied into the repository.

Reject or keep as candidate if:

- The source cannot be relocated.
- The source is only a screenshot without a stable reference.
- Authenticated/private material cannot be cited safely.
- The operator cannot distinguish the speaker, publisher, or date.
- The source requires storing an original file inside the repository to remain useful.

## Reviewed source -> segment

A segment should identify the exact part of a source that supports a claim or knowledge note.

For YouTube or video sources, require:

- `sourceId`
- `startTime`
- `endTime`
- concise segment title
- short summary

For reports or articles, require one of:

- `page`
- `pageOrSection`
- section heading
- paragraph-level location memo when page numbers are not available

Segment summary rules:

- Summarize the content in your own words.
- Do not paste a full transcript.
- Do not paste a full report paragraph unless explicitly approved as a short legally safe excerpt.
- Prefer paraphrase and location reference.

Reject or keep as source-only if:

- The relevant passage cannot be located precisely.
- The segment mixes unrelated claims.
- The segment only contains generic commentary with no usable claim or knowledge value.

## Segment -> claim candidate

A claim candidate must be a verifiable statement, not just useful commentary.

A statement is a claim candidate when it has at least most of the following:

- identifiable speaker or author
- identifiable company, ticker, industry, market, or macro target
- directional stance such as bullish, bearish, neutral, risk, watch, or recovery
- time horizon or inferable target period
- base date
- measurable outcome or observable future condition
- sufficient context to evaluate after 1M, 3M, 6M, or 12M

Strong claim examples:

- A says Samsung Electronics is likely to rise over the next six months because DRAM prices are rebounding.
- B says SK Hynix will outperform KOSPI over 12 months due to HBM supply growth.
- C says KOSPI may recover to 3000 by year-end if rate cuts begin.
- D says a stock's earnings will miss consensus in the next quarter.

Weak or invalid claim examples:

- This sector is interesting.
- This company is good long term.
- I am watching this stock.
- It might go up or down.
- Nobody knows what will happen.
- The industry is important.

Weak statements may still become knowledge notes, but they should not become approved claims unless a verifiable target can be defined.

## Segment -> knowledge note

A knowledge note preserves educational or analytical information that is useful even when it is not a return-verifiable forecast.

Promote to knowledge note when the segment explains:

- industry structure
- company business model
- supply chain
- market cycle
- cost driver
- demand driver
- technology trend
- regulation or policy background
- valuation concept
- risk factor
- benchmark or macro mechanism

Knowledge note requirements:

- `sourceId`
- `segmentId`
- `expertId` or author reference
- topic
- industry or relevant domain when available
- concise summary
- key points
- tags

Knowledge note boundaries:

- Do not evaluate a pure knowledge note as forecast accuracy.
- If a knowledge note contains a distinct forecast, split the forecast into a separate claim candidate.
- Keep educational summary paraphrased.
- Do not copy full source text.

## Claim candidate -> approved claim

A claim candidate can become an approved claim only when it can be evaluated later.

Required fields:

- `id`
- `expertId`
- `sourceId`
- `segmentId`
- `ticker` or market/industry target when applicable
- `companyName` or target label
- `industry`
- `claimType`
- `direction`
- `claimText`
- `evidence`
- `baseDate`
- `basePrice` or base index level when applicable
- `targetDate`
- `targetPrice` or target index level when applicable, if the claim includes a numeric target
- `timeHorizon`
- `status`

Approval checks:

- The claim text is paraphrased and does not overstate the original statement.
- Direction is explicit or reasonably inferable.
- Base date is the publication or statement date unless a different basis is documented.
- Target date follows the stated horizon or the project's standard horizon rule.
- Base price comes from an approved static/sample price source or is explicitly marked as sample data.
- Evidence is concise and does not copy source-original text.
- The claim is not duplicated by an existing approved claim unless it represents a materially different source, speaker, date, horizon, or target.

Reject or keep as candidate if:

- Direction cannot be determined.
- Target cannot be evaluated later.
- The statement is purely educational.
- The claim depends on undisclosed private information.
- The source location is not reproducible.
- The wording is too ambiguous to judge hit, miss, or partial hit.

## Approved claim -> evaluated claim

An approved claim becomes evaluated only after the target horizon has passed or the evaluation rule allows interim evaluation.

Evaluation requirements:

- `claimId`
- evaluation date
- evaluated price or index value
- return rate
- benchmark return where applicable
- alpha where applicable
- result verdict
- short memo explaining the result

Verdict guidance:

- `hit`: direction and material outcome were broadly correct.
- `partial_hit`: direction or thesis was partly correct but target, magnitude, or timing was meaningfully off.
- `miss`: direction, target, or thesis was materially wrong.
- `invalid`: original statement was not evaluable or was later judged too ambiguous.

Evaluation safeguards:

- Do not retroactively rewrite the approved claim to fit the result.
- Do not change base date or target horizon after evaluation unless correcting a documented data error.
- Keep calculation method consistent across comparable claims.
- Preserve benchmark and price assumptions.

## Claim vs knowledge note decision table

| Statement type | Official destination |
| --- | --- |
| Clear stock direction with horizon | `claims.json` |
| Clear target price or index level | `claims.json` |
| Earnings/profit estimate with period | `claims.json` |
| Sector cycle explanation without forecast | `knowledge_notes.json` |
| Business model explanation | `knowledge_notes.json` |
| Risk factor explanation | `knowledge_notes.json` |
| Vague opinion without evaluable target | keep as candidate or reject |
| Ambiguous statement with no direction | reject as official claim |
| Educational explanation plus forecast | split into both claim and knowledge note |

## Data PR merge gate

Any PR that changes official or candidate static data must run:

```bash
node scripts/validate-data.js
```

A data-changing PR is not ready if validation fails.

Validation passing is necessary but not sufficient. Human review must still check source location, claim wording, evidentiary quality, and source-original safeguards.

## Operator review summary template

Use this checklist when promoting a candidate:

```text
Promotion review

Source:
- sourceId/candidateId:
- source type:
- URL/privatePath:
- time/page/section:
- publisher/channel/brokerage:
- speaker/author/analyst:
- publishedAt:

Classification:
- reviewed source: PASS/FAIL
- segment-worthy: PASS/FAIL
- claim candidate: PASS/FAIL
- knowledge note: PASS/FAIL

Claim review, if applicable:
- direction clear: PASS/FAIL
- horizon clear: PASS/FAIL
- base date clear: PASS/FAIL
- target/evaluation rule clear: PASS/FAIL
- duplicate check: PASS/FAIL

Knowledge review, if applicable:
- educational value: PASS/FAIL
- paraphrased summary: PASS/FAIL
- no full source text: PASS/FAIL

Repository safety:
- no original PDF/video/transcript: PASS/FAIL
- no copied full report text: PASS/FAIL
- no credentials/secrets: PASS/FAIL

Validator:
- node scripts/validate-data.js: PASS/FAIL

Decision:
- promote / keep candidate / reject
```
