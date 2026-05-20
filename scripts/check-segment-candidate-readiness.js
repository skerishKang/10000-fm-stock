#!/usr/bin/env node
/*
 * check-segment-candidate-readiness.js
 *
 * Read-only readiness check for local segment candidates before promotion
 * to official data/segments.json.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const OFFICIAL_SOURCES_FILE = path.join(REPO_ROOT, 'data', 'sources.json');
const OFFICIAL_SEGMENTS_FILE = path.join(REPO_ROOT, 'data', 'segments.json');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const LOCAL_CANDIDATES_FILE = path.join(LOCAL_ROOT, 'segments', 'segment-candidates.json');

function isFiniteNumber(val) {
  return typeof val === 'number' && isFinite(val);
}

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim() !== '';
}

function checkCandidate(candidate, officialSourceIds, officialSegmentIds) {
  const blockingIssues = [];
  const reviewIssues = [];

  // Type check
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { status: 'blocked', reason: 'candidate is not an object' };
  }

  // id
  if (!isNonEmptyString(candidate.id)) {
    blockingIssues.push('missing id');
  } else if (officialSegmentIds.has(candidate.id)) {
    blockingIssues.push('id already exists in official segments');
  }

  // sourceId
  if (!isNonEmptyString(candidate.sourceId)) {
    blockingIssues.push('missing sourceId');
  } else if (!officialSourceIds.has(candidate.sourceId)) {
    blockingIssues.push('unknown sourceId');
  }

  // status
  if (candidate.status !== 'candidate') {
    blockingIssues.push('status is not candidate');
  }

  // official
  if (candidate.official !== false) {
    blockingIssues.push('official is not false');
  }

  // reviewStatus
  const reviewStatus = candidate.reviewStatus || 'pending';
  if (reviewStatus === 'blocked') {
    blockingIssues.push('reviewStatus is blocked');
  }

  // title
  if (!isNonEmptyString(candidate.title)) {
    reviewIssues.push('missing title');
  }

  // summary
  if (!isNonEmptyString(candidate.summary)) {
    reviewIssues.push('missing summary');
  }

  // timing
  const hasStartTime = candidate.startTime !== null && candidate.startTime !== undefined;
  const hasEndTime = candidate.endTime !== null && candidate.endTime !== undefined;

  if (hasStartTime && !isFiniteNumber(candidate.startTime)) {
    reviewIssues.push('startTime is not a finite number');
  }
  if (hasEndTime && !isFiniteNumber(candidate.endTime)) {
    reviewIssues.push('endTime is not a finite number');
  }
  if (hasStartTime && hasEndTime && isFiniteNumber(candidate.startTime) && isFiniteNumber(candidate.endTime)) {
    if (candidate.endTime < candidate.startTime) {
      reviewIssues.push('endTime is less than startTime');
    }
  }

  // page
  if (candidate.page !== null && candidate.page !== undefined && !isFiniteNumber(candidate.page)) {
    reviewIssues.push('page is not null or finite number');
  }

  // Classification
  if (blockingIssues.length > 0) {
    return { status: 'blocked', reason: blockingIssues.join('; ') };
  }

  if (reviewStatus === 'approved') {
    if (reviewIssues.length > 0) {
      return { status: 'needsManualReview', reason: reviewIssues.join('; ') };
    }
    return { status: 'ready', reason: '' };
  }

  // pending, missing reviewStatus, or unrecognized status
  if (reviewIssues.length > 0) {
    return { status: 'needsManualReview', reason: reviewIssues.join('; ') };
  }
  return { status: 'needsManualReview', reason: `reviewStatus is ${reviewStatus}` };
}

function main() {
  console.log('FM-Stock segment candidate readiness');
  console.log('====================================');

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
  if (!fs.existsSync(LOCAL_CANDIDATES_FILE)) {
    console.log('Local segment candidates file not found:', LOCAL_CANDIDATES_FILE);
    console.log('');
    console.log('No local segment candidates found.');
    process.exit(0);
  }

  let localCandidates;
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

  console.log('Official sources count:', officialSources.length);
  console.log('Official segments count:', officialSegments.length);
  console.log('Local segment candidates count:', localCandidates.length);

  const officialSourceIds = new Set(officialSources.map((s) => s.id));
  const officialSegmentIds = new Set(officialSegments.map((s) => s.id));

  const ready = [];
  const needsManualReview = [];
  const blocked = [];

  localCandidates.forEach((candidate) => {
    const result = checkCandidate(candidate, officialSourceIds, officialSegmentIds);
    const isObj = candidate && typeof candidate === 'object' && !Array.isArray(candidate);
    const entry = {
      id: (isObj && candidate.id) || '(no id)',
      sourceId: (isObj && candidate.sourceId) || '(no sourceId)',
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
    ready.forEach((e) => console.log(`- ${e.id} | ${e.sourceId}`));
  }

  if (needsManualReview.length > 0) {
    console.log('');
    console.log('Needs manual review:');
    needsManualReview.forEach((e) => console.log(`- ${e.id} | ${e.sourceId} | ${e.reason}`));
  }

  if (blocked.length > 0) {
    console.log('');
    console.log('Blocked:');
    blocked.forEach((e) => console.log(`- ${e.id} | ${e.sourceId} | ${e.reason}`));
  }

  process.exit(0);
}

main();
