#!/usr/bin/env node
/*
 * check-source-candidate-readiness.js
 *
 * Read-only readiness check for local source candidates before promotion
 * to official data/sources.json.
 * Includes review metadata from source-candidate-reviews.json.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const CANDIDATES_FILE = path.join(LOCAL_ROOT, 'candidates', 'sources.candidate.json');
const REVIEWS_FILE = path.join(LOCAL_ROOT, 'reviews', 'source-candidate-reviews.json');

const OFFICIAL_TYPE_MAP = {
  youtube: 'youtube',
  report: 'report',
  ir: 'ir',
  document: null,
  web: null,
  image: null,
  file: null,
  other: null
};

function isIsoDate(value) {
  if (!value) return false;
  // Support YYYY-MM-DD or ISO UTC
  return /^\d{4}-\d{2}-\d{2}(T|$)/.test(String(value));
}

function checkCandidate(candidate, review) {
  const blockingIssues = [];
  const reviewIssues = [];

  const sourceIndicator = review ? (candidate ? 'raw+review' : 'review') : 'raw';

  // Use overrides from review if available
  const finalId = candidate.id;
  const finalType = (review && review.officialType) || candidate.type || '';
  const finalTitle = (review && review.titleOverride) || candidate.title || '';
  const finalPublisher = (review && review.publisher) || candidate.publisher || '';
  const finalPublishedAt = (review && review.publishedAt) || candidate.publishedAt || '';
  const finalStatus = (review && review.reviewStatus) || 'pending';

  if (!finalId) blockingIssues.push('missing id');
  if (candidate.status !== 'candidate') blockingIssues.push('status is not candidate');
  if (candidate.official !== false) blockingIssues.push('official is not false');

  const hasUrl = !!(candidate.url && candidate.url.trim());
  const hasPath = !!(candidate.privatePath && candidate.privatePath.trim());
  if (!hasUrl && !hasPath) blockingIssues.push('missing url and privatePath');

  if (!finalTitle) reviewIssues.push('missing title');
  if (!finalPublisher) reviewIssues.push('missing publisher');
  if (!isIsoDate(finalPublishedAt)) reviewIssues.push('missing or invalid publishedAt');

  // Review status overrides
  if (review && finalStatus === 'blocked') {
    return {
      status: 'blocked',
      reason: review.promotionBlockedReason || 'blocked by reviewer',
      source: sourceIndicator,
      title: finalTitle,
      type: finalType
    };
  }

  const mappedType = OFFICIAL_TYPE_MAP[finalType];

  if (mappedType === undefined) {
    blockingIssues.push(`unknown type: ${finalType}`);
  } else if (mappedType === null) {
    if (finalType === 'document') {
      reviewIssues.push('document requires reviewer mapping to report/youtube/ir');
    } else {
      reviewIssues.push('manual source type selection required');
    }
  }

  if (blockingIssues.length > 0) {
    return {
      status: 'blocked',
      reason: blockingIssues.join('; '),
      source: sourceIndicator,
      title: finalTitle,
      type: finalType
    };
  }

  // If review exists, it must be approved to be ready
  if (review && finalStatus !== 'approved') {
    return {
      status: 'needsManualReview',
      reason: `review status is ${finalStatus}`,
      source: sourceIndicator,
      title: finalTitle,
      type: finalType
    };
  }

  // If no review, use existing logic: documents are never ready
  if (!review && finalType === 'document') {
    return {
      status: 'needsManualReview',
      reason: 'document requires reviewer confirmation before mapping to report',
      source: sourceIndicator,
      title: finalTitle,
      type: finalType
    };
  }

  if (reviewIssues.length > 0) {
    return {
      status: 'needsManualReview',
      reason: reviewIssues.join('; '),
      source: sourceIndicator,
      title: finalTitle,
      type: finalType
    };
  }

  return {
    status: 'ready',
    reason: '',
    source: sourceIndicator,
    title: finalTitle,
    type: finalType
  };
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

  // Load reviews if available
  let reviews = [];
  if (fs.existsSync(REVIEWS_FILE)) {
    console.log('Review file:', REVIEWS_FILE);
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
  } else {
    console.log('No review file found. Proceeding with raw candidates.');
  }

  console.log('Total candidates:', candidates.length);
  console.log('Review records loaded:', reviews.length);

  const reviewsMap = new Map();
  reviews.forEach((r) => {
    if (r.candidateId) reviewsMap.set(r.candidateId, r);
  });

  const ready = [];
  const blocked = [];
  const needsManualReview = [];

  candidates.forEach((candidate) => {
    const review = reviewsMap.get(candidate.id);
    const result = checkCandidate(candidate, review);
    const entry = {
      id: candidate.id || '(no id)',
      type: result.type || '(no type)',
      title: result.title || '(no title)',
      reason: result.reason,
      source: result.source
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
    ready.forEach((e) => console.log(`- ${e.id} | ${e.type} | [source: ${e.source}] | ${e.title}`));
  }

  if (needsManualReview.length > 0) {
    console.log('');
    console.log('Needs manual review:');
    needsManualReview.forEach((e) => console.log(`- ${e.id} | ${e.type} | [source: ${e.source}] | ${e.reason}`));
  }

  if (blocked.length > 0) {
    console.log('');
    console.log('Blocked:');
    blocked.forEach((e) => console.log(`- ${e.id} | ${e.type} | [source: ${e.source}] | ${e.reason}`));
  }

  process.exit(0);
}

main();
