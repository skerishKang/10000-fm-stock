#!/usr/bin/env node
/*
 * generate-segment-promotion-preview.js
 *
 * Generate a preview JSON of segment candidates ready for promotion
 * from local segment-candidates.json. Produces a local-only preview
 * in the shape of official data/segments.json.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const OFFICIAL_SOURCES_FILE = path.join(REPO_ROOT, 'data', 'sources.json');
const OFFICIAL_SEGMENTS_FILE = path.join(REPO_ROOT, 'data', 'segments.json');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const LOCAL_CANDIDATES_FILE = path.join(LOCAL_ROOT, 'segments', 'segment-candidates.json');
const PREVIEW_FILE = path.join(LOCAL_ROOT, 'segments', 'segment-promotions.preview.json');

function isFiniteNumber(val) {
  return typeof val === 'number' && isFinite(val);
}

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim() !== '';
}

function main() {
  console.log('FM-Stock segment promotion preview generator');
  console.log('============================================');

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

  // --- Load local candidates ---
  if (!fs.existsSync(LOCAL_CANDIDATES_FILE)) {
    console.log('Local segment candidates file not found:', LOCAL_CANDIDATES_FILE);
    console.log('No local segment candidates. Preview not generated.');
    process.exit(0);
  }

  let candidates;
  try {
    candidates = JSON.parse(fs.readFileSync(LOCAL_CANDIDATES_FILE, 'utf8'));
  } catch (err) {
    console.error('Error: Failed to parse local segment candidates file:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(candidates)) {
    console.error('Error: Local segment candidates file root is not an array.');
    process.exit(1);
  }

  const officialSourceIds = new Set(officialSources.map((s) => s.id));
  const officialSegmentIds = new Set(officialSegments.map((s) => s.id));

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

    // sourceId
    if (!isNonEmptyString(candidate.sourceId)) {
      skip('missing or empty sourceId');
      return;
    }

    // sourceId must exist in official sources
    if (!officialSourceIds.has(candidate.sourceId)) {
      skip('sourceId not found in official sources');
      return;
    }

    // id must not already exist in official segments
    if (officialSegmentIds.has(candidate.id)) {
      skip('id already exists in official segments');
      return;
    }

    // status
    if (candidate.status !== 'candidate') {
      skip(`status is ${JSON.stringify(candidate.status)} (expected: candidate)`);
      return;
    }

    // official
    if (candidate.official !== false) {
      skip('official is not false');
      return;
    }

    // reviewStatus
    if (candidate.reviewStatus !== 'approved') {
      skip(`reviewStatus is ${JSON.stringify(candidate.reviewStatus || 'pending')}`);
      return;
    }

    // title
    if (!isNonEmptyString(candidate.title)) {
      skip('missing or empty title');
      return;
    }

    // summary
    if (!isNonEmptyString(candidate.summary)) {
      skip('missing or empty summary');
      return;
    }

    // startTime: null/undefined or finite number
    const hasStartTime = candidate.startTime !== null && candidate.startTime !== undefined;
    if (hasStartTime && !isFiniteNumber(candidate.startTime)) {
      skip('startTime is not a finite number');
      return;
    }

    // endTime: null/undefined or finite number
    const hasEndTime = candidate.endTime !== null && candidate.endTime !== undefined;
    if (hasEndTime && !isFiniteNumber(candidate.endTime)) {
      skip('endTime is not a finite number');
      return;
    }

    // endTime >= startTime when both present
    if (hasStartTime && hasEndTime && isFiniteNumber(candidate.startTime) && isFiniteNumber(candidate.endTime)) {
      if (candidate.endTime < candidate.startTime) {
        skip('endTime is less than startTime');
        return;
      }
    }

    // page: null/undefined or finite number
    if (candidate.page !== null && candidate.page !== undefined && !isFiniteNumber(candidate.page)) {
      skip('page is not null or a finite number');
      return;
    }

    // Eligible - build preview record
    previewRecords.push({
      id: candidate.id,
      sourceId: candidate.sourceId,
      startTime: candidate.startTime ?? null,
      endTime: candidate.endTime ?? null,
      page: candidate.page ?? null,
      title: candidate.title,
      summary: candidate.summary
    });
  });

  // --- Output ---
  console.log('');
  console.log('Official sources count:', officialSources.length);
  console.log('Official segments count:', officialSegments.length);
  console.log('Local candidate count:', candidates.length);
  console.log('Preview records generated:', previewRecords.length);
  console.log('Skipped count:', skipped.length);

  if (skipped.length > 0) {
    console.log('');
    console.log('Skipped reasons by id:');
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
