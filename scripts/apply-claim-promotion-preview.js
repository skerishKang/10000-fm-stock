#!/usr/bin/env node
/*
 * apply-claim-promotion-preview.js
 *
 * Safely apply eligible records from local claim promotion preview to
 * the official data/claims.json file.
 * Defaults to dry-run; use --apply to actually modify the file.
 * Rolls back if post-apply validation fails.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const OFFICIAL_EXPERTS_FILE = path.join(REPO_ROOT, 'data', 'experts.json');
const OFFICIAL_SOURCES_FILE = path.join(REPO_ROOT, 'data', 'sources.json');
const OFFICIAL_SEGMENTS_FILE = path.join(REPO_ROOT, 'data', 'segments.json');
const OFFICIAL_CLAIMS_FILE = path.join(REPO_ROOT, 'data', 'claims.json');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const PREVIEW_FILE = path.join(LOCAL_ROOT, 'claims', 'claim-promotions.preview.json');

const VALID_CLAIM_TYPES = ['stock_forecast', 'market_forecast', 'earnings_estimate', 'other'];
const VALID_DIRECTIONS = ['bullish', 'bearish', 'neutral', 'educational_only'];
const VALID_STATUSES = ['evaluated', 'invalid', 'candidate', 'pending'];

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
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');

  console.log('FM-Stock claim promotion preview applier');
  console.log('=========================================');
  console.log(`Mode: ${isApply ? 'APPLY' : 'DRY-RUN'}`);
  if (!isApply) {
    console.log('(Use --apply to commit changes to data/claims.json)');
  }
  console.log('');

  // --- Load official data ---
  const officialExperts = loadJsonArray(OFFICIAL_EXPERTS_FILE, 'Official experts');
  const officialSources = loadJsonArray(OFFICIAL_SOURCES_FILE, 'Official sources');
  const officialSegments = loadJsonArray(OFFICIAL_SEGMENTS_FILE, 'Official segments');
  const officialClaims = loadJsonArray(OFFICIAL_CLAIMS_FILE, 'Official claims');

  // --- Load preview ---
  if (!fs.existsSync(PREVIEW_FILE)) {
    console.log('Preview file not found:', PREVIEW_FILE);
    console.log('No preview records. Nothing to apply.');
    process.exit(0);
  }

  let previewRecords;
  try {
    previewRecords = JSON.parse(fs.readFileSync(PREVIEW_FILE, 'utf8'));
  } catch (err) {
    console.error('Error: Failed to parse preview file:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(previewRecords)) {
    console.error('Error: Preview file root is not an array.');
    process.exit(1);
  }

  // --- Build lookup sets ---
  const officialExpertIds = new Set(officialExperts.map((e) => e.id));
  const officialSourceIds = new Set(officialSources.map((s) => s.id));
  const officialSegmentIds = new Set(officialSegments.map((s) => s.id));
  const officialClaimIds = new Set(officialClaims.map((c) => c.id));
  const segmentMap = new Map(officialSegments.map((s) => [s.id, s]));

  // Check for duplicate IDs inside preview
  const previewIdSet = new Set();
  for (const record of previewRecords) {
    if (record && typeof record === 'object' && !Array.isArray(record) && isNonEmptyString(record.id)) {
      if (previewIdSet.has(record.id)) {
        console.error(`Error: Duplicate ID inside preview file: ${record.id}`);
        process.exit(1);
      }
      previewIdSet.add(record.id);
    }
  }

  const eligibleRecords = [];
  const skipped = [];

  previewRecords.forEach((record) => {
    const skip = (reason) => {
      const isObj = record && typeof record === 'object' && !Array.isArray(record);
      skipped.push({ id: (isObj && record.id) || '(no id)', reason });
    };

    // Guard: non-null object, not array
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      skip('preview record is not an object');
      return;
    }

    // id
    if (!isNonEmptyString(record.id)) {
      skip('missing or empty id');
      return;
    }

    // Duplicate against official claims
    if (officialClaimIds.has(record.id)) {
      skip('id already exists in official claims');
      return;
    }

    // expertId
    if (!isNonEmptyString(record.expertId)) {
      skip('missing or empty expertId');
      return;
    }
    if (!officialExpertIds.has(record.expertId)) {
      skip('expertId not found in official experts');
      return;
    }

    // sourceId
    if (!isNonEmptyString(record.sourceId)) {
      skip('missing or empty sourceId');
      return;
    }
    if (!officialSourceIds.has(record.sourceId)) {
      skip('sourceId not found in official sources');
      return;
    }

    // segmentId
    if (!isNonEmptyString(record.segmentId)) {
      skip('missing or empty segmentId');
      return;
    }
    if (!officialSegmentIds.has(record.segmentId)) {
      skip('segmentId not found in official segments');
      return;
    }

    // sourceId/segmentId consistency
    const segment = segmentMap.get(record.segmentId);
    if (segment && segment.sourceId !== record.sourceId) {
      skip('segment.sourceId does not match record sourceId');
      return;
    }

    // companyName
    if (!isNonEmptyString(record.companyName)) {
      skip('missing or empty companyName');
      return;
    }

    // claimType
    if (!VALID_CLAIM_TYPES.includes(record.claimType)) {
      skip(`invalid claimType: ${JSON.stringify(record.claimType)}`);
      return;
    }

    // direction
    if (!VALID_DIRECTIONS.includes(record.direction)) {
      skip(`invalid direction: ${JSON.stringify(record.direction)}`);
      return;
    }

    // claimText
    if (!isNonEmptyString(record.claimText)) {
      skip('missing or empty claimText');
      return;
    }

    // evidence
    if (!Array.isArray(record.evidence)) {
      skip('evidence is not an array');
      return;
    }

    // baseDate
    if (!isIsoDate(record.baseDate)) {
      skip('baseDate is not YYYY-MM-DD');
      return;
    }

    // targetDate
    if (!isIsoDate(record.targetDate)) {
      skip('targetDate is not YYYY-MM-DD');
      return;
    }

    // targetDate >= baseDate
    if (record.targetDate < record.baseDate) {
      skip('targetDate is before baseDate');
      return;
    }

    // basePrice
    if (!isFiniteNumber(record.basePrice)) {
      skip('basePrice is not a finite number');
      return;
    }

    // targetPrice
    if (!isFiniteNumber(record.targetPrice)) {
      skip('targetPrice is not a finite number');
      return;
    }

    // status
    if (!VALID_STATUSES.includes(record.status)) {
      skip(`invalid status: ${JSON.stringify(record.status)}`);
      return;
    }

    // Eligible - build official claim record (strip preview-only metadata)
    eligibleRecords.push({
      id: record.id,
      expertId: record.expertId,
      sourceId: record.sourceId,
      segmentId: record.segmentId,
      ticker: record.ticker || '',
      companyName: record.companyName,
      industry: record.industry || '',
      claimType: record.claimType,
      direction: record.direction,
      claimText: record.claimText,
      evidence: record.evidence,
      baseDate: record.baseDate,
      basePrice: record.basePrice,
      targetDate: record.targetDate,
      targetPrice: record.targetPrice,
      timeHorizon: record.timeHorizon || '',
      status: record.status
    });
  });

  // --- Output ---
  console.log('');
  console.log('Official experts count:', officialExperts.length);
  console.log('Official sources count:', officialSources.length);
  console.log('Official segments count:', officialSegments.length);
  console.log('Official claims count before:', officialClaims.length);
  console.log('Preview records count:', previewRecords.length);
  console.log('Eligible records count:', eligibleRecords.length);
  console.log('Skipped records count:', skipped.length);

  if (skipped.length > 0) {
    console.log('');
    console.log('Skipped reasons:');
    skipped.forEach((s) => console.log(`- ${s.id}: ${s.reason}`));
  }

  if (eligibleRecords.length > 0) {
    if (isApply) {
      // Preserve original file content for byte-for-byte rollback
      const originalContent = fs.readFileSync(OFFICIAL_CLAIMS_FILE, 'utf8');

      const updatedClaims = officialClaims.concat(eligibleRecords);
      fs.writeFileSync(OFFICIAL_CLAIMS_FILE, JSON.stringify(updatedClaims, null, 2) + '\n', 'utf8');
      console.log('');
      console.log('Applied changes to:', OFFICIAL_CLAIMS_FILE);
      console.log('Official claims count after:', updatedClaims.length);

      // Run validation
      console.log('');
      console.log('Running validation...');
      const result = spawnSync('node', ['scripts/validate-data.js'], {
        cwd: REPO_ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8'
      });

      if (result.stdout) console.log(result.stdout);
      if (result.stderr) console.error(result.stderr);

      if (result.status === 0) {
        console.log('Validation PASSED. Changes retained.');
        process.exit(0);
      } else {
        // Rollback
        console.error('Validation FAILED. Rolling back...');
        fs.writeFileSync(OFFICIAL_CLAIMS_FILE, originalContent, 'utf8');
        console.error('Rollback complete. data/claims.json restored to original state.');
        process.exit(1);
      }
    } else {
      console.log('');
      console.log('Dry-run complete. No changes made to official claims.');
    }
  } else {
    console.log('');
    console.log('No eligible records to apply.');
  }

  process.exit(0);
}

main();
