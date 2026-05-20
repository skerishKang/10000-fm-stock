#!/usr/bin/env node
/*
 * generate-claim-promotion-preview.js
 *
 * Generate a preview JSON of claim candidates ready for promotion
 * from local claim-candidates.json. Produces a local-only preview
 * in the shape of official data/claims.json.
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
const PREVIEW_FILE = path.join(LOCAL_ROOT, 'claims', 'claim-promotions.preview.json');

const VALID_CLAIM_TYPES = ['stock_forecast', 'market_forecast', 'earnings_estimate', 'other'];
const VALID_DIRECTIONS = ['bullish', 'bearish', 'neutral', 'educational_only'];

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

function main() {
  console.log('FM-Stock claim promotion preview generator');
  console.log('==========================================');

  // --- Load official data ---
  const officialExperts = loadJsonArray(OFFICIAL_EXPERTS_FILE, 'Official experts');
  const officialSources = loadJsonArray(OFFICIAL_SOURCES_FILE, 'Official sources');
  const officialSegments = loadJsonArray(OFFICIAL_SEGMENTS_FILE, 'Official segments');
  const officialClaims = loadJsonArray(OFFICIAL_CLAIMS_FILE, 'Official claims');

  // --- Load local candidates ---
  if (!fs.existsSync(LOCAL_CANDIDATES_FILE)) {
    console.log('Local claim candidates file not found:', LOCAL_CANDIDATES_FILE);
    console.log('No local claim candidates.');

    // Clear stale preview if exists
    const previewDir = path.dirname(PREVIEW_FILE);
    fs.mkdirSync(previewDir, { recursive: true });
    fs.writeFileSync(PREVIEW_FILE, JSON.stringify([], null, 2) + '\n', 'utf8');
    console.log('');
    console.log('Preview output path:', PREVIEW_FILE);
    process.exit(0);
  }

  let candidates;
  try {
    candidates = JSON.parse(fs.readFileSync(LOCAL_CANDIDATES_FILE, 'utf8'));
  } catch (err) {
    console.error('Error: Failed to parse local claim candidates file:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(candidates)) {
    console.error('Error: Local claim candidates file root is not an array.');
    process.exit(1);
  }

  // --- Build lookup sets ---
  const officialExpertIds = new Set(officialExperts.map((e) => e.id));
  const officialSourceIds = new Set(officialSources.map((s) => s.id));
  const officialSegmentIds = new Set(officialSegments.map((s) => s.id));
  const officialClaimIds = new Set(officialClaims.map((c) => c.id));
  const segmentMap = new Map(officialSegments.map((s) => [s.id, s]));

  // Check for duplicate IDs inside local candidates
  const candidateIdSet = new Set();
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate) && isNonEmptyString(candidate.id)) {
      if (candidateIdSet.has(candidate.id)) {
        console.error(`Error: Duplicate candidate ID inside local file: ${candidate.id}`);
        process.exit(1);
      }
      candidateIdSet.add(candidate.id);
    }
  }

  const previewRecords = [];
  const skipped = [];

  candidates.forEach((candidate) => {
    const skip = (reason) => {
      const isObj = candidate && typeof candidate === 'object' && !Array.isArray(candidate);
      skipped.push({ id: (isObj && candidate.id) || '(no id)', reason });
    };

    // Guard: non-null object, not array
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      skip('item is not a non-null object');
      return;
    }

    // id
    if (!isNonEmptyString(candidate.id)) {
      skip('missing or empty id');
      return;
    }

    // Duplicate against official claims
    if (officialClaimIds.has(candidate.id)) {
      skip('id already exists in official claims');
      return;
    }

    // expertId
    if (!isNonEmptyString(candidate.expertId)) {
      skip('missing or empty expertId');
      return;
    }
    if (!officialExpertIds.has(candidate.expertId)) {
      skip('expertId not found in official experts');
      return;
    }

    // sourceId
    if (!isNonEmptyString(candidate.sourceId)) {
      skip('missing or empty sourceId');
      return;
    }
    if (!officialSourceIds.has(candidate.sourceId)) {
      skip('sourceId not found in official sources');
      return;
    }

    // segmentId
    if (!isNonEmptyString(candidate.segmentId)) {
      skip('missing or empty segmentId');
      return;
    }
    if (!officialSegmentIds.has(candidate.segmentId)) {
      skip('segmentId not found in official segments');
      return;
    }

    // sourceId/segmentId consistency
    const segment = segmentMap.get(candidate.segmentId);
    if (segment && segment.sourceId !== candidate.sourceId) {
      skip('segment.sourceId does not match candidate sourceId');
      return;
    }

    // companyName
    if (!isNonEmptyString(candidate.companyName)) {
      skip('missing or empty companyName');
      return;
    }

    // claimType
    if (!VALID_CLAIM_TYPES.includes(candidate.claimType)) {
      skip(`invalid claimType: ${JSON.stringify(candidate.claimType)}`);
      return;
    }

    // direction
    if (!VALID_DIRECTIONS.includes(candidate.direction)) {
      skip(`invalid direction: ${JSON.stringify(candidate.direction)}`);
      return;
    }

    // claimText
    if (!isNonEmptyString(candidate.claimText)) {
      skip('missing or empty claimText');
      return;
    }

    // evidence
    if (!Array.isArray(candidate.evidence)) {
      skip('evidence is not an array');
      return;
    }

    // baseDate
    if (!isIsoDate(candidate.baseDate)) {
      skip('baseDate is not YYYY-MM-DD');
      return;
    }

    // targetDate
    if (!isIsoDate(candidate.targetDate)) {
      skip('targetDate is not YYYY-MM-DD');
      return;
    }

    // targetDate >= baseDate
    if (candidate.targetDate < candidate.baseDate) {
      skip('targetDate is before baseDate');
      return;
    }

    // basePrice
    if (!isFiniteNumber(candidate.basePrice)) {
      skip('basePrice is not a finite number');
      return;
    }

    // targetPrice
    if (!isFiniteNumber(candidate.targetPrice)) {
      skip('targetPrice is not a finite number');
      return;
    }

    // status
    if (candidate.status !== 'candidate' && candidate.status !== 'pending') {
      skip(`status is ${JSON.stringify(candidate.status)} (expected: candidate or pending)`);
      return;
    }

    // official
    if (candidate.official !== false) {
      skip('official is not false');
      return;
    }

    // promotionReview
    if (!candidate.promotionReview || typeof candidate.promotionReview !== 'object' || Array.isArray(candidate.promotionReview)) {
      skip('promotionReview is not an object');
      return;
    }

    const pr = candidate.promotionReview;

    // promotionReview.decision
    if (pr.decision !== 'approved') {
      skip(`promotionReview.decision is ${JSON.stringify(pr.decision || 'keep_candidate')}`);
      return;
    }

    // promotionReview flags
    if (pr.directionClear !== true) {
      skip('directionClear is not true');
      return;
    }
    if (pr.horizonClear !== true) {
      skip('horizonClear is not true');
      return;
    }
    if (pr.baseDateClear !== true) {
      skip('baseDateClear is not true');
      return;
    }
    if (pr.targetOrEvaluationRuleClear !== true) {
      skip('targetOrEvaluationRuleClear is not true');
      return;
    }
    if (pr.duplicateChecked !== true) {
      skip('duplicateChecked is not true');
      return;
    }

    // Eligible - build preview record
    const sr = candidate.sourceReference || {};
    previewRecords.push({
      id: candidate.id,
      expertId: candidate.expertId,
      sourceId: candidate.sourceId,
      segmentId: candidate.segmentId,
      ticker: candidate.ticker || '',
      companyName: candidate.companyName,
      industry: candidate.industry || '',
      claimType: candidate.claimType,
      direction: candidate.direction,
      claimText: candidate.claimText,
      evidence: candidate.evidence,
      baseDate: candidate.baseDate,
      basePrice: candidate.basePrice,
      targetDate: candidate.targetDate,
      targetPrice: candidate.targetPrice,
      timeHorizon: candidate.timeHorizon || '',
      status: candidate.status,
      sourceReference: {
        url: sr.url || '',
        privatePath: sr.privatePath || '',
        startTime: sr.startTime ?? null,
        endTime: sr.endTime ?? null,
        pageOrSection: sr.pageOrSection || '',
        referenceMemo: sr.referenceMemo || ''
      },
      promotion: {
        sourceCandidateId: candidate.id,
        reviewedAt: pr.reviewedAt || null,
        reviewer: pr.reviewer || ''
      }
    });
  });

  // --- Output ---
  console.log('');
  console.log('Official experts count:', officialExperts.length);
  console.log('Official sources count:', officialSources.length);
  console.log('Official segments count:', officialSegments.length);
  console.log('Official claims count:', officialClaims.length);
  console.log('Local claim candidates count:', candidates.length);
  console.log('Eligible preview records count:', previewRecords.length);
  console.log('Skipped records count:', skipped.length);

  if (skipped.length > 0) {
    console.log('');
    console.log('Skipped reasons by candidate id:');
    skipped.forEach((s) => console.log(`- ${s.id}: ${s.reason}`));
  }

  // Always write preview file to prevent stale data
  const previewDir = path.dirname(PREVIEW_FILE);
  fs.mkdirSync(previewDir, { recursive: true });
  fs.writeFileSync(PREVIEW_FILE, JSON.stringify(previewRecords, null, 2) + '\n', 'utf8');

  console.log('');
  console.log('Preview output path:', PREVIEW_FILE);

  process.exit(0);
}

main();
