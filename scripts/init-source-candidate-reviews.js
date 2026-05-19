#!/usr/bin/env node
/*
 * init-source-candidate-reviews.js
 *
 * Initialize review metadata for local source candidates.
 * Creates pending review records for candidates that don't have one yet.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const CANDIDATES_FILE = path.join(LOCAL_ROOT, 'candidates', 'sources.candidate.json');
const REVIEWS_DIR = path.join(LOCAL_ROOT, 'reviews');
const REVIEWS_FILE = path.join(REVIEWS_DIR, 'source-candidate-reviews.json');

function main() {
  console.log('FM-Stock source candidate review initializer');
  console.log('============================================');

  if (!fs.existsSync(CANDIDATES_FILE)) {
    console.log('Candidates file:', CANDIDATES_FILE);
    console.log('');
    console.log('No local source candidates found.');
    process.exit(0);
  }

  console.log('Candidates file:', CANDIDATES_FILE);

  let candidates;
  try {
    candidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf8'));
  } catch (err) {
    console.error('Error: Failed to parse candidates file:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(candidates)) {
    console.error('Error: Candidates file root is not an array.');
    process.exit(1);
  }

  console.log('Candidates total:', candidates.length);

  // Load existing reviews
  let existingReviews = [];
  if (fs.existsSync(REVIEWS_FILE)) {
    try {
      existingReviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
      if (!Array.isArray(existingReviews)) existingReviews = [];
    } catch (err) {
      existingReviews = [];
    }
  }

  console.log('Existing reviews:', existingReviews.length);

  // Build set of existing review candidateIds
  const existingIds = new Set(existingReviews.map((r) => r.candidateId));

  // Add new pending reviews for candidates without one
  const added = [];
  const now = new Date().toISOString();

  candidates.forEach((candidate) => {
    if (!candidate.id) return;
    if (existingIds.has(candidate.id)) return;

    existingReviews.push({
      candidateId: candidate.id,
      reviewStatus: 'pending',
      officialType: '',
      publisher: '',
      publishedAt: '',
      titleOverride: '',
      visibility: candidate.visibility || 'private',
      reviewerNotes: '',
      promotionBlockedReason: '',
      updatedAt: now
    });

    existingIds.add(candidate.id);
    added.push(candidate.id);
  });

  console.log('Added reviews:', added.length);
  console.log('Final reviews:', existingReviews.length);

  // Write reviews file
  fs.mkdirSync(REVIEWS_DIR, { recursive: true });
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(existingReviews, null, 2) + '\n', 'utf8');

  console.log('');
  console.log('Reviews file:', REVIEWS_FILE);

  if (added.length > 0) {
    console.log('');
    console.log('Added:');
    added.forEach((id) => console.log(`- ${id} | pending`));
  }

  process.exit(0);
}

main();
