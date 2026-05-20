#!/usr/bin/env node
/*
 * init-claim-candidates.js
 *
 * Initialize local claim candidate placeholders for official segments
 * that don't have claims yet.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const OFFICIAL_SOURCES_FILE = path.join(REPO_ROOT, 'data', 'sources.json');
const OFFICIAL_SEGMENTS_FILE = path.join(REPO_ROOT, 'data', 'segments.json');
const OFFICIAL_CLAIMS_FILE = path.join(REPO_ROOT, 'data', 'claims.json');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const LOCAL_CLAIMS_DIR = path.join(LOCAL_ROOT, 'claims');
const LOCAL_CANDIDATES_FILE = path.join(LOCAL_CLAIMS_DIR, 'claim-candidates.json');

function safeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
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
  const args = process.argv.slice(2);
  const segmentIdIdx = args.indexOf('--segment-id');
  let targetSegmentId = null;

  if (segmentIdIdx >= 0) {
    const val = args[segmentIdIdx + 1];
    if (!val || val.startsWith('--')) {
      console.error('Error: --segment-id requires a non-empty value.');
      process.exit(1);
    }
    targetSegmentId = val;
  }

  console.log('FM-Stock claim candidate initializer');
  console.log('====================================');

  // Load official data
  const officialSources = loadJsonArray(OFFICIAL_SOURCES_FILE, 'Official sources');
  const officialSegments = loadJsonArray(OFFICIAL_SEGMENTS_FILE, 'Official segments');
  const officialClaims = loadJsonArray(OFFICIAL_CLAIMS_FILE, 'Official claims');

  // Load or initialize local candidates
  let localCandidates = [];

  if (fs.existsSync(LOCAL_CANDIDATES_FILE)) {
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

    // Validate every item is a non-null object
    for (let i = 0; i < localCandidates.length; i++) {
      const item = localCandidates[i];
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        console.error(`Error: Local claim candidate at index ${i} is not an object.`);
        process.exit(1);
      }
    }
  }

  // Build sets for quick lookup
  const officialClaimSegmentIds = new Set(officialClaims.map((c) => c.segmentId).filter(Boolean));
  const localCandidateSegmentIds = new Set(localCandidates.map((c) => c.segmentId).filter(Boolean));
  const localCandidateIds = new Set(localCandidates.map((c) => c.id).filter(Boolean));

  console.log('Official sources count:', officialSources.length);
  console.log('Official segments count:', officialSegments.length);
  console.log('Official claims count:', officialClaims.length);
  console.log('Existing local candidates count:', localCandidates.length);

  // Filter segments
  let targetSegments = officialSegments;
  if (targetSegmentId) {
    const found = officialSegments.find((s) => s.id === targetSegmentId);
    if (!found) {
      console.error(`Error: Segment not found: ${targetSegmentId}`);
      process.exit(1);
    }
    targetSegments = [found];
  }

  const added = [];
  let skippedOfficialClaim = 0;
  let skippedLocalCandidate = 0;
  const now = new Date().toISOString();

  targetSegments.forEach((segment) => {
    // Skip if official claim exists for this segment
    if (officialClaimSegmentIds.has(segment.id)) {
      skippedOfficialClaim++;
      return;
    }

    // Skip if local candidate already exists for this segment
    if (localCandidateSegmentIds.has(segment.id)) {
      skippedLocalCandidate++;
      return;
    }

    const slug = safeSlug(segment.id);
    const newId = `claim_candidate_${slug}_001`;

    // Check for ID collision with existing local candidates
    if (localCandidateIds.has(newId)) {
      console.error(`Error: Generated candidate id "${newId}" already exists in local candidates for a different segment.`);
      process.exit(1);
    }

    localCandidates.push({
      id: newId,
      sourceCandidateId: '',
      sourceId: segment.sourceId,
      segmentId: segment.id,
      expertId: '',
      ticker: '',
      companyName: '',
      industry: '',
      claimType: 'stock_forecast',
      direction: 'bullish',
      claimText: '',
      evidence: [],
      baseDate: null,
      basePrice: null,
      targetDate: null,
      targetPrice: null,
      timeHorizon: '6M',
      sourceReference: {
        url: '',
        privatePath: '',
        startTime: segment.startTime ?? null,
        endTime: segment.endTime ?? null,
        pageOrSection: segment.page != null ? String(segment.page) : '',
        referenceMemo: ''
      },
      promotionReview: {
        directionClear: false,
        horizonClear: false,
        baseDateClear: false,
        targetOrEvaluationRuleClear: false,
        duplicateChecked: false,
        reviewer: '',
        reviewedAt: null,
        decision: 'keep_candidate'
      },
      status: 'candidate',
      official: false,
      createdAt: now,
      updatedAt: now
    });

    localCandidateSegmentIds.add(segment.id);
    added.push(segment.id);
  });

  console.log('Added candidates count:', added.length);
  console.log('Skipped existing official claim count:', skippedOfficialClaim);
  console.log('Skipped existing local candidate count:', skippedLocalCandidate);

  // Write only if new candidates were added
  if (added.length > 0) {
    fs.mkdirSync(LOCAL_CLAIMS_DIR, { recursive: true });
    fs.writeFileSync(LOCAL_CANDIDATES_FILE, JSON.stringify(localCandidates, null, 2) + '\n', 'utf8');
    console.log('');
    console.log('Output file path:', LOCAL_CANDIDATES_FILE);
  } else {
    console.log('');
    console.log('No new candidates to add. Output file unchanged.');
  }

  if (added.length > 0) {
    console.log('');
    console.log('Added:');
    added.forEach((id) => console.log(`- ${id}`));
  }

  process.exit(0);
}

main();
