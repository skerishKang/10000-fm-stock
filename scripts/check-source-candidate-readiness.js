#!/usr/bin/env node
/*
 * check-source-candidate-readiness.js
 *
 * Read-only readiness check for local source candidates before promotion
 * to official data/sources.json.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const CANDIDATES_FILE = path.join(LOCAL_ROOT, 'candidates', 'sources.candidate.json');

const OFFICIAL_TYPE_MAP = {
  youtube: 'youtube',
  report: 'report',
  ir: 'ir',
  document: 'report',
  web: null,
  image: null,
  file: null,
  other: null
};

function isIsoDate(value) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}(T|$)/.test(String(value));
}

function checkCandidate(candidate) {
  const issues = [];

  if (!candidate.id) issues.push('missing id');
  if (candidate.status !== 'candidate') issues.push('status is not candidate');
  if (candidate.official !== false) issues.push('official is not false');
  if (!candidate.title) issues.push('missing title');

  const hasUrl = !!(candidate.url && candidate.url.trim());
  const hasPath = !!(candidate.privatePath && candidate.privatePath.trim());
  if (!hasUrl && !hasPath) issues.push('missing url and privatePath');

  const type = candidate.type || '';
  const mappedType = OFFICIAL_TYPE_MAP[type];

  if (mappedType === undefined) {
    return { status: 'blocked', reason: `unknown type: ${type}`, issues };
  }

  if (mappedType === null) {
    if (type === 'document') {
      const hasPublisher = !!(candidate.publisher && candidate.publisher.trim());
      const hasDate = isIsoDate(candidate.publishedAt);
      if (!hasPublisher || !hasDate) {
        return { status: 'needsManualReview', reason: 'map to report after reviewer confirms publisher/publishedAt', issues };
      }
      return { status: 'ready', reason: 'document mapped to report', issues };
    }
    return { status: 'blocked', reason: 'manual source type selection required', issues };
  }

  const hasPublisher = !!(candidate.publisher && candidate.publisher.trim());
  const hasDate = isIsoDate(candidate.publishedAt);
  if (!hasPublisher || !hasDate) {
    return { status: 'needsManualReview', reason: 'missing publisher or publishedAt', issues };
  }

  return { status: 'ready', reason: '', issues };
}

function main() {
  console.log('FM-Stock source candidate readiness');
  console.log('===================================');

  if (!fs.existsSync(CANDIDATES_FILE)) {
    console.log('Candidate file:', CANDIDATES_FILE);
    console.log('');
    console.log('No local source candidates found.');
    process.exit(0);
  }

  console.log('Candidate file:', CANDIDATES_FILE);

  let candidates;
  try {
    candidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf8'));
  } catch (err) {
    console.error('Error: Failed to parse candidate file:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(candidates)) {
    console.error('Error: Candidate file root is not an array.');
    process.exit(1);
  }

  console.log('Total:', candidates.length);

  const ready = [];
  const blocked = [];
  const needsManualReview = [];

  candidates.forEach((candidate) => {
    const result = checkCandidate(candidate);
    const entry = {
      id: candidate.id || '(no id)',
      type: candidate.type || '(no type)',
      title: candidate.title || '(no title)',
      reason: result.reason
    };

    if (result.status === 'ready') ready.push(entry);
    else if (result.status === 'blocked') blocked.push(entry);
    else needsManualReview.push(entry);
  });

  console.log('Ready:', ready.length);
  console.log('Needs manual review:', needsManualReview.length);
  console.log('Blocked:', blocked.length);

  if (ready.length > 0) {
    console.log('');
    console.log('Ready:');
    ready.forEach((e) => console.log(`- ${e.id} | ${e.type} | ${e.title}`));
  }

  if (needsManualReview.length > 0) {
    console.log('');
    console.log('Needs manual review:');
    needsManualReview.forEach((e) => console.log(`- ${e.id} | ${e.type} | ${e.reason}`));
  }

  if (blocked.length > 0) {
    console.log('');
    console.log('Blocked:');
    blocked.forEach((e) => console.log(`- ${e.id} | ${e.type} | ${e.reason}`));
  }

  process.exit(0);
}

main();
