#!/usr/bin/env node
/*
 * generate-source-promotion-preview.js
 *
 * Generate a preview JSON of sources ready for promotion from local candidates.
 * Uses approved reviews from source-candidate-reviews.json.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const CANDIDATES_FILE = path.join(LOCAL_ROOT, 'candidates', 'sources.candidate.json');
const REVIEWS_FILE = path.join(LOCAL_ROOT, 'reviews', 'source-candidate-reviews.json');
const PROMOTIONS_DIR = path.join(LOCAL_ROOT, 'promotions');
const PREVIEW_FILE = path.join(PROMOTIONS_DIR, 'source-promotions.preview.json');

const VALID_OFFICIAL_TYPES = ['youtube', 'report', 'ir'];

function isIsoDate(value) {
  if (!value) return false;
  // Support YYYY-MM-DD or ISO UTC
  return /^\d{4}-\d{2}-\d{2}(T|$)/.test(String(value));
}

function main() {
  console.log('FM-Stock source promotion preview generator');
  console.log('==========================================');

  if (!fs.existsSync(CANDIDATES_FILE)) {
    console.log('Candidate file not found:', CANDIDATES_FILE);
    process.exit(0);
  }

  if (!fs.existsSync(REVIEWS_FILE)) {
    console.log('Review file not found:', REVIEWS_FILE);
    process.exit(0);
  }

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

  let reviews;
  try {
    reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
  } catch (err) {
    console.error('Error: Failed to parse review file:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(reviews)) {
    console.error('Error: Review file root is not an array.');
    process.exit(1);
  }

  const reviewsMap = new Map();
  reviews.forEach((r) => {
    if (r.candidateId) reviewsMap.set(r.candidateId, r);
  });

  const previewRecords = [];
  const skipped = [];
  const now = new Date().toISOString();

  candidates.forEach((candidate) => {
    const skip = (reason) => skipped.push({ id: candidate.id || '(no id)', reason });

    if (!candidate.id) {
      skip('missing candidate id');
      return;
    }

    const review = reviewsMap.get(candidate.id);

    if (!review) {
      skip('no matching review record');
      return;
    }

    if (review.reviewStatus !== 'approved') {
      skip(`review status is ${review.reviewStatus}`);
      return;
    }

    if (candidate.status !== 'candidate') {
      skip(`candidate status is ${candidate.status} (expected: candidate)`);
      return;
    }

    if (candidate.official !== false) {
      skip('candidate official field is not false');
      return;
    }

    const type = review.officialType;
    if (!VALID_OFFICIAL_TYPES.includes(type)) {
      skip(`invalid or missing officialType: ${type || '(empty)'}`);
      return;
    }

    const title = review.titleOverride || candidate.title;
    if (!title) {
      skip('missing title (neither override nor raw title present)');
      return;
    }

    const publisher = review.publisher || candidate.publisher;
    if (!publisher) {
      skip('missing publisher');
      return;
    }

    const publishedAt = review.publishedAt || candidate.publishedAt;
    if (!isIsoDate(publishedAt)) {
      skip(`missing or invalid publishedAt: ${publishedAt || '(empty)'}`);
      return;
    }

    const hasUrl = !!(candidate.url && candidate.url.trim());
    const hasPath = !!(candidate.privatePath && candidate.privatePath.trim());
    if (!hasUrl && !hasPath) {
      skip('missing both url and privatePath');
      return;
    }

    previewRecords.push({
      id: candidate.id,
      type: type,
      title: title,
      url: candidate.url || "",
      privatePath: candidate.privatePath || "",
      publisher: publisher,
      publishedAt: publishedAt,
      addedAt: candidate.addedAt || now,
      visibility: review.visibility || candidate.visibility || "private",
      memo: "Promotion preview from local candidate review"
    });
  });

  console.log('Candidates total:', candidates.length);
  console.log('Reviews total:', reviews.length);
  console.log('Preview records generated:', previewRecords.length);
  console.log('Skipped count:', skipped.length);

  if (skipped.length > 0) {
    console.log('');
    console.log('Skipped reasons by candidateId:');
    skipped.forEach((s) => console.log(`- ${s.id}: ${s.reason}`));
  }

  if (previewRecords.length > 0) {
    if (!fs.existsSync(PROMOTIONS_DIR)) {
      fs.mkdirSync(PROMOTIONS_DIR, { recursive: true });
    }
    fs.writeFileSync(PREVIEW_FILE, JSON.stringify(previewRecords, null, 2) + '\n', 'utf8');
    console.log('');
    console.log('Preview file generated:', PREVIEW_FILE);
  } else {
    console.log('');
    console.log('No records eligible for promotion. Preview file not created.');
  }

  process.exit(0);
}

main();
