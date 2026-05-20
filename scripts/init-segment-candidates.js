#!/usr/bin/env node
/*
 * init-segment-candidates.js
 *
 * Initialize local segment candidate placeholders for official sources
 * that don't have segments yet.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const OFFICIAL_SOURCES_FILE = path.join(REPO_ROOT, 'data', 'sources.json');
const OFFICIAL_SEGMENTS_FILE = path.join(REPO_ROOT, 'data', 'segments.json');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const LOCAL_SEGMENTS_DIR = path.join(LOCAL_ROOT, 'segments');
const LOCAL_CANDIDATES_FILE = path.join(LOCAL_SEGMENTS_DIR, 'segment-candidates.json');

function safeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function main() {
  const args = process.argv.slice(2);
  const sourceIdIdx = args.indexOf('--source-id');
  const targetSourceId = sourceIdIdx >= 0 ? args[sourceIdIdx + 1] : null;

  console.log('FM-Stock segment candidate initializer');
  console.log('======================================');

  // Load official sources
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

  // Load official segments
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

  // Load local candidates
  let localCandidates = [];
  if (fs.existsSync(LOCAL_CANDIDATES_FILE)) {
    try {
      localCandidates = JSON.parse(fs.readFileSync(LOCAL_CANDIDATES_FILE, 'utf8'));
    } catch (err) {
      console.error('Error: Failed to parse local segment candidates file:', err.message);
      process.exit(1);
    }

    if (!Array.isArray(localCandidates)) {
      console.error('Error: Local segment candidates file root is not an array.');
      process.exit(1);
    }
  }

  // Build sets
  const officialSegmentSourceIds = new Set(officialSegments.map((s) => s.sourceId));
  const localCandidateSourceIds = new Set(localCandidates.map((c) => c.sourceId));

  console.log('Official sources count:', officialSources.length);
  console.log('Official segments count:', officialSegments.length);
  console.log('Existing local candidates count:', localCandidates.length);

  // Filter sources
  let targetSources = officialSources;
  if (targetSourceId) {
    const found = officialSources.find((s) => s.id === targetSourceId);
    if (!found) {
      console.error(`Error: Source not found: ${targetSourceId}`);
      process.exit(1);
    }
    targetSources = [found];
  }

  const added = [];
  let skippedOfficial = 0;
  let skippedLocal = 0;
  const now = new Date().toISOString();

  targetSources.forEach((source) => {
    if (officialSegmentSourceIds.has(source.id)) {
      skippedOfficial++;
      return;
    }

    if (localCandidateSourceIds.has(source.id)) {
      skippedLocal++;
      return;
    }

    const slug = safeSlug(source.id);
    localCandidates.push({
      id: `segment_candidate_${slug}_001`,
      sourceId: source.id,
      startTime: null,
      endTime: null,
      page: null,
      title: '',
      summary: '',
      status: 'candidate',
      official: false,
      reviewStatus: 'pending',
      reviewerNotes: '',
      createdAt: now,
      updatedAt: now
    });

    localCandidateSourceIds.add(source.id);
    added.push(source.id);
  });

  console.log('Added candidates count:', added.length);
  console.log('Skipped existing official segment count:', skippedOfficial);
  console.log('Skipped existing local candidate count:', skippedLocal);

  // Write candidates file
  fs.mkdirSync(LOCAL_SEGMENTS_DIR, { recursive: true });
  fs.writeFileSync(LOCAL_CANDIDATES_FILE, JSON.stringify(localCandidates, null, 2) + '\n', 'utf8');

  console.log('');
  console.log('Output file:', LOCAL_CANDIDATES_FILE);

  if (added.length > 0) {
    console.log('');
    console.log('Added:');
    added.forEach((id) => console.log(`- ${id}`));
  }

  process.exit(0);
}

main();
