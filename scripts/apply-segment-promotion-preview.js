#!/usr/bin/env node
/*
 * apply-segment-promotion-preview.js
 *
 * Safely apply eligible records from local segment promotion preview to
 * the official data/segments.json file.
 * Defaults to dry-run; use --apply to actually modify the file.
 * Rolls back if post-apply validation fails.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const OFFICIAL_SOURCES_FILE = path.join(REPO_ROOT, 'data', 'sources.json');
const OFFICIAL_SEGMENTS_FILE = path.join(REPO_ROOT, 'data', 'segments.json');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const PREVIEW_FILE = path.join(LOCAL_ROOT, 'segments', 'segment-promotions.preview.json');

function isFiniteNumber(val) {
  return typeof val === 'number' && isFinite(val);
}

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim() !== '';
}

function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');

  console.log('FM-Stock segment promotion preview applier');
  console.log('==========================================');
  console.log(`Mode: ${isApply ? 'APPLY' : 'DRY-RUN'}`);
  if (!isApply) {
    console.log('(Use --apply to commit changes to data/segments.json)');
  }
  console.log('');

  // --- Load official sources ---
  if (!fs.existsSync(OFFICIAL_SOURCES_FILE)) {
    console.error('Error: Official sources file not found:', OFFICIAL_SOURCES_FILE);
    process.exit(1);
  }

  let officialSources;
  try {
    officialSources = JSON.parse(fs.readFileSync(OFFICIAL_SOURCES_FILE, 'utf8'));
  } catch (err) {
    console.error('Error: Failed to parse official sources file:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(officialSources)) {
    console.error('Error: Official sources file root is not an array.');
    process.exit(1);
  }

  // --- Load official segments ---
  if (!fs.existsSync(OFFICIAL_SEGMENTS_FILE)) {
    console.error('Error: Official segments file not found:', OFFICIAL_SEGMENTS_FILE);
    process.exit(1);
  }

  let officialSegments;
  try {
    officialSegments = JSON.parse(fs.readFileSync(OFFICIAL_SEGMENTS_FILE, 'utf8'));
  } catch (err) {
    console.error('Error: Failed to parse official segments file:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(officialSegments)) {
    console.error('Error: Official segments file root is not an array.');
    process.exit(1);
  }

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

  const officialSourceIds = new Set(officialSources.map((s) => s.id));
  const officialSegmentIds = new Set(officialSegments.map((s) => s.id));
  const previewIds = new Set();
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

    // Duplicate inside preview
    if (previewIds.has(record.id)) {
      console.error(`Error: Duplicate ID inside preview file: ${record.id}`);
      process.exit(1);
    }
    previewIds.add(record.id);

    // Already in official segments
    if (officialSegmentIds.has(record.id)) {
      skip('id already exists in official segments');
      return;
    }

    // sourceId
    if (!isNonEmptyString(record.sourceId)) {
      skip('missing or empty sourceId');
      return;
    }

    // sourceId must exist in official sources
    if (!officialSourceIds.has(record.sourceId)) {
      skip('sourceId not found in official sources');
      return;
    }

    // title
    if (!isNonEmptyString(record.title)) {
      skip('missing or empty title');
      return;
    }

    // summary
    if (!isNonEmptyString(record.summary)) {
      skip('missing or empty summary');
      return;
    }

    // startTime: null/undefined or finite number
    const hasStartTime = record.startTime !== null && record.startTime !== undefined;
    if (hasStartTime && !isFiniteNumber(record.startTime)) {
      skip('startTime is not a finite number');
      return;
    }

    // endTime: null/undefined or finite number
    const hasEndTime = record.endTime !== null && record.endTime !== undefined;
    if (hasEndTime && !isFiniteNumber(record.endTime)) {
      skip('endTime is not a finite number');
      return;
    }

    // endTime >= startTime when both present
    if (hasStartTime && hasEndTime && isFiniteNumber(record.startTime) && isFiniteNumber(record.endTime)) {
      if (record.endTime < record.startTime) {
        skip('endTime is less than startTime');
        return;
      }
    }

    // page: null/undefined or finite number
    if (record.page !== null && record.page !== undefined && !isFiniteNumber(record.page)) {
      skip('page is not null or a finite number');
      return;
    }

    // Eligible - build clean record
    eligibleRecords.push({
      id: record.id,
      sourceId: record.sourceId,
      startTime: record.startTime ?? null,
      endTime: record.endTime ?? null,
      page: record.page ?? null,
      title: record.title,
      summary: record.summary
    });
  });

  // --- Output ---
  console.log('');
  console.log('Official sources count:', officialSources.length);
  console.log('Official segments count before:', officialSegments.length);
  console.log('Preview records count:', previewRecords.length);
  console.log('Eligible records count:', eligibleRecords.length);
  console.log('Skipped count:', skipped.length);

  if (skipped.length > 0) {
    console.log('');
    console.log('Skipped reasons:');
    skipped.forEach((s) => console.log(`- ${s.id}: ${s.reason}`));
  }

  if (eligibleRecords.length > 0) {
    if (isApply) {
      // Preserve original file content for byte-for-byte rollback
      const originalContent = fs.readFileSync(OFFICIAL_SEGMENTS_FILE, 'utf8');

      const updatedSegments = officialSegments.concat(eligibleRecords);
      fs.writeFileSync(OFFICIAL_SEGMENTS_FILE, JSON.stringify(updatedSegments, null, 2) + '\n', 'utf8');
      console.log('');
      console.log('Applied changes to:', OFFICIAL_SEGMENTS_FILE);
      console.log('Official segments count after:', updatedSegments.length);

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
        fs.writeFileSync(OFFICIAL_SEGMENTS_FILE, originalContent, 'utf8');
        console.error('Rollback complete. data/segments.json restored to original state.');
        process.exit(1);
      }
    } else {
      console.log('');
      console.log('Dry-run complete. No changes made to official segments.');
    }
  } else {
    console.log('');
    console.log('No eligible records to apply.');
  }

  process.exit(0);
}

main();
