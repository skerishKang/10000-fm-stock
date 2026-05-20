#!/usr/bin/env node
/*
 * check-claim-candidate-readiness.js
 *
 * Read-only readiness check for local claim candidates before promotion
 * to official data/claims.json.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const OFFICIAL_EXPERTS_FILE = path.join(REPO_ROOT, 'data', 'experts.json');
const OFFICIAL_SOURCES_FILE = path.join(REPO_ROOT, 'data', 'sources.json');
const OFFICIAL_SEGMENTS_FILE = path.join(REPO_ROOT, 'data', 'segments.json');
const OFFICIAL_CLAIMS_FILE = path.join(REPO_ROOT, 'data', 'claims.json');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const LOCAL_CANDIDATES_FILE = path.join(LOCAL_ROOT, 'claims', 'claim-candidates.json');

const VALID_CLAIM_TYPES = ['stock_forecast', 'market_forecast', 'earnings_estimate', 'other'];
const VALID_DIRECTIONS = ['bullish', 'bearish', 'neutral', 'educational_only'];
const BLOCKED_DECISIONS = ['blocked', 'reject'];

function isFiniteNumber(val) {
  return typeof val === 'number' && isFinite(val);
}

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim() !== '';
}

function isIsoDate(val) {
  return typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val);
}

function loadJsonArray(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${label} file not found:`, filePath);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Error: Failed to parse ${label} file:`, err.message);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error(`Error: ${label} file root is not an array.`);
    process.exit(1);
  }

  return data;
}

function checkCandidate(candidate, ctx) {
  const blockingIssues = [];
  const reviewIssues = [];

  // Type check
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { status: 'blocked', reason: 'candidate is not an object' };
  }

  // id
  if (!isNonEmptyString(candidate.id)) {
    blockingIssues.push('missing id');
  } else if (ctx.officialClaimIds.has(candidate.id)) {
    blockingIssues.push('id already exists in official claims');
  }

  // expertId
  if (!isNonEmptyString(candidate.expertId)) {
    reviewIssues.push('missing expertId');
  } else if (!ctx.officialExpertIds.has(candidate.expertId)) {
    blockingIssues.push('unknown expertId');
  }

  // sourceId
  if (!isNonEmptyString(candidate.sourceId)) {
    blockingIssues.push('missing sourceId');
  } else if (!ctx.officialSourceIds.has(candidate.sourceId)) {
    blockingIssues.push('unknown sourceId');
  }

  // segmentId
  if (!isNonEmptyString(candidate.segmentId)) {
    blockingIssues.push('missing segmentId');
  } else if (!ctx.officialSegmentIds.has(candidate.segmentId)) {
    blockingIssues.push('unknown segmentId');
  }

  // sourceId + segmentId consistency
  if (isNonEmptyString(candidate.sourceId) && isNonEmptyString(candidate.segmentId)) {
    const segment = ctx.segmentMap.get(candidate.segmentId);
    if (segment && segment.sourceId !== candidate.sourceId) {
      blockingIssues.push('segment.sourceId mismatch');
    }
  }

  // companyName
  if (!isNonEmptyString(candidate.companyName)) {
    reviewIssues.push('missing companyName');
  }

  // claimType
  if (!VALID_CLAIM_TYPES.includes(candidate.claimType)) {
    blockingIssues.push(`invalid claimType: ${JSON.stringify(candidate.claimType)}`);
  }

  // direction
  if (!VALID_DIRECTIONS.includes(candidate.direction)) {
    blockingIssues.push(`invalid direction: ${JSON.stringify(candidate.direction)}`);
  }

  // claimText
  if (!isNonEmptyString(candidate.claimText)) {
    reviewIssues.push('missing claimText');
  }

  // evidence
  if (!Array.isArray(candidate.evidence)) {
    blockingIssues.push('evidence is not an array');
  }

  // baseDate
  if (candidate.baseDate !== null && candidate.baseDate !== undefined) {
    if (!isIsoDate(candidate.baseDate)) {
      blockingIssues.push('baseDate is not YYYY-MM-DD');
    }
  } else {
    reviewIssues.push('missing baseDate');
  }

  // targetDate
  if (candidate.targetDate !== null && candidate.targetDate !== undefined) {
    if (!isIsoDate(candidate.targetDate)) {
      blockingIssues.push('targetDate is not YYYY-MM-DD');
    }
  } else {
    reviewIssues.push('missing targetDate');
  }

  // date order
  if (isIsoDate(candidate.baseDate) && isIsoDate(candidate.targetDate)) {
    if (candidate.targetDate < candidate.baseDate) {
      blockingIssues.push('targetDate is before baseDate');
    }
  }

  // basePrice
  if (candidate.basePrice !== null && candidate.basePrice !== undefined) {
    if (!isFiniteNumber(candidate.basePrice)) {
      blockingIssues.push('basePrice is not a finite number');
    }
  } else {
    reviewIssues.push('missing basePrice');
  }

  // targetPrice
  if (candidate.targetPrice !== null && candidate.targetPrice !== undefined) {
    if (!isFiniteNumber(candidate.targetPrice)) {
      blockingIssues.push('targetPrice is not a finite number');
    }
  } else {
    reviewIssues.push('missing targetPrice');
  }

  // status
  if (candidate.status !== 'candidate') {
    blockingIssues.push('status is not candidate');
  }

  // official
  if (candidate.official !== false) {
    blockingIssues.push('official is not false');
  }

  // promotionReview
  if (!candidate.promotionReview || typeof candidate.promotionReview !== 'object' || Array.isArray(candidate.promotionReview)) {
    blockingIssues.push('promotionReview is not an object');
  } else {
    const pr = candidate.promotionReview;
    const decision = pr.decision || 'keep_candidate';

    if (BLOCKED_DECISIONS.includes(decision)) {
      blockingIssues.push(`promotionReview.decision is ${decision}`);
    }

    // Check flags only if decision is approved
    if (decision === 'approved') {
      if (pr.directionClear !== true) reviewIssues.push('directionClear is not true');
      if (pr.horizonClear !== true) reviewIssues.push('horizonClear is not true');
      if (pr.baseDateClear !== true) reviewIssues.push('baseDateClear is not true');
      if (pr.targetOrEvaluationRuleClear !== true) reviewIssues.push('targetOrEvaluationRuleClear is not true');
      if (pr.duplicateChecked !== true) reviewIssues.push('duplicateChecked is not true');
    }
  }

  // Classification
  if (blockingIssues.length > 0) {
    return { status: 'blocked', reason: blockingIssues.join('; ') };
  }

  const decision = (candidate.promotionReview && candidate.promotionReview.decision) || 'keep_candidate';

  if (decision === 'approved') {
    if (reviewIssues.length > 0) {
      return { status: 'needsManualReview', reason: reviewIssues.join('; ') };
    }
    return { status: 'ready', reason: '' };
  }

  // keep_candidate or missing decision
  if (reviewIssues.length > 0) {
    return { status: 'needsManualReview', reason: reviewIssues.join('; ') };
  }
  return { status: 'needsManualReview', reason: `decision is ${decision}` };
}

function main() {
  console.log('FM-Stock claim candidate readiness');
  console.log('==================================');

  // Load official data
  const officialExperts = loadJsonArray(OFFICIAL_EXPERTS_FILE, 'Official experts');
  const officialSources = loadJsonArray(OFFICIAL_SOURCES_FILE, 'Official sources');
  const officialSegments = loadJsonArray(OFFICIAL_SEGMENTS_FILE, 'Official segments');
  const officialClaims = loadJsonArray(OFFICIAL_CLAIMS_FILE, 'Official claims');

  // Load local candidates
  if (!fs.existsSync(LOCAL_CANDIDATES_FILE)) {
    console.log('Local claim candidates file not found:', LOCAL_CANDIDATES_FILE);
    console.log('');
    console.log('No local claim candidates found.');
    process.exit(0);
  }

  let localCandidates;
  try {
    localCandidates = JSON.parse(fs.readFileSync(LOCAL_CANDIDATES_FILE, 'utf8'));
  } catch (err) {
    console.error('Error: Failed to parse local claim candidates file:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(localCandidates)) {
    console.error('Error: Local claim candidates file root is not an array.');
    process.exit(1);
  }

  const ctx = {
    officialExpertIds: new Set(officialExperts.map((e) => e.id)),
    officialSourceIds: new Set(officialSources.map((s) => s.id)),
    officialSegmentIds: new Set(officialSegments.map((s) => s.id)),
    officialClaimIds: new Set(officialClaims.map((c) => c.id)),
    segmentMap: new Map(officialSegments.map((s) => [s.id, s]))
  };

  console.log('Official experts count:', officialExperts.length);
  console.log('Official sources count:', officialSources.length);
  console.log('Official segments count:', officialSegments.length);
  console.log('Official claims count:', officialClaims.length);
  console.log('Local claim candidates count:', localCandidates.length);

  const ready = [];
  const needsManualReview = [];
  const blocked = [];

  localCandidates.forEach((candidate) => {
    const result = checkCandidate(candidate, ctx);
    const isObj = candidate && typeof candidate === 'object' && !Array.isArray(candidate);
    const entry = {
      id: (isObj && candidate.id) || '(no id)',
      reason: result.reason
    };

    if (result.status === 'ready') ready.push(entry);
    else if (result.status === 'blocked') blocked.push(entry);
    else needsManualReview.push(entry);
  });

  console.log('');
  console.log('Ready:', ready.length);
  console.log('Needs manual review:', needsManualReview.length);
  console.log('Blocked:', blocked.length);

  if (ready.length > 0) {
    console.log('');
    console.log('Ready:');
    ready.forEach((e) => console.log(`- ${e.id}`));
  }

  if (needsManualReview.length > 0) {
    console.log('');
    console.log('Needs manual review:');
    needsManualReview.forEach((e) => console.log(`- ${e.id} | ${e.reason}`));
  }

  if (blocked.length > 0) {
    console.log('');
    console.log('Blocked:');
    blocked.forEach((e) => console.log(`- ${e.id} | ${e.reason}`));
  }

  process.exit(0);
}

main();
