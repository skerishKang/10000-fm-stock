#!/usr/bin/env node
/*
 * smoke-return-metrics.js — Smoke tests for return metrics contracts
 *
 * Validates:
 * - bullish/bearish direction support
 * - claim.baseDate usage
 * - claim.targetDate evaluation
 * - raw percent convention (16.67 = 16.67%)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function loadJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Load metrics-returns.js source for static analysis
const returnsSource = fs.readFileSync(
  path.join(ROOT, 'assets', 'js', 'metrics', 'metrics-returns.js'),
  'utf8'
);

// Load utils-dom.js source for formatPercent analysis
const domSource = fs.readFileSync(
  path.join(ROOT, 'assets', 'js', 'utils', 'utils-dom.js'),
  'utf8'
);

console.log('=== Return Metrics Smoke Tests ===\n');

// ---- Test 1: bullish/bearish support in isHit ----
console.log('[1] isHit() supports bullish/bearish direction');
assert(
  returnsSource.includes("direction === 'long' || direction === 'bullish'"),
  'isHit handles bullish as long'
);
assert(
  returnsSource.includes("direction === 'short' || direction === 'bearish'"),
  'isHit handles bearish as short'
);

// ---- Test 2: bullish/bearish support in isPartialHit ----
console.log('\n[2] isPartialHit() supports bullish/bearish direction');
assert(
  returnsSource.includes("direction === 'long' || direction === 'bullish'") &&
  returnsSource.includes("direction === 'short' || direction === 'bearish'"),
  'isPartialHit handles bullish/bearish'
);

// ---- Test 3: normalizeReturnsByDirection supports bullish/bearish ----
console.log('\n[3] normalizeReturnsByDirection() supports bullish/bearish');
assert(
  returnsSource.includes("direction === 'short' || direction === 'bearish'"),
  'normalizeReturnsByDirection handles bearish'
);

// ---- Test 4: claim.baseDate usage ----
console.log('\n[4] calculateReturnsForPeriods uses claim.baseDate');
assert(
  returnsSource.includes('claim.baseDate || claim.date || claim.createdAt'),
  'calculateReturnsForPeriods uses baseDate first'
);

// ---- Test 5: claim.targetDate usage ----
console.log('\n[5] getEvaluatedPrice uses claim.targetDate');
assert(
  returnsSource.includes('claim.targetDate ? new Date(claim.targetDate) : new Date()'),
  'getEvaluatedPrice uses targetDate'
);

// ---- Test 6: raw percent convention ----
console.log('\n[6] formatPercent uses raw percent (16.67 → "+16.67%")');
assert(
  !domSource.includes('n * 100'),
  'formatPercent does not multiply by 100'
);
assert(
  domSource.includes('Number(n).toFixed(2)'),
  'formatPercent uses toFixed(2) directly'
);

// ---- Test 7: Data files use raw percent ----
console.log('\n[7] Data files use raw percent convention');
const evaluations = loadJson('evaluations.json');
const firstEval = evaluations[0];
assert(
  typeof firstEval.returnRate === 'number' && firstEval.returnRate < 100,
  `evaluations[0].returnRate is ${firstEval.returnRate} (raw percent, not decimal)`
);
assert(
  typeof firstEval.alpha === 'number' && firstEval.alpha < 100,
  `evaluations[0].alpha is ${firstEval.alpha} (raw percent, not decimal)`
);

// ---- Test 8: Claims have baseDate and targetDate ----
console.log('\n[8] Claims use baseDate and targetDate fields');
const claims = loadJson('claims.json');
const firstClaim = claims[0];
assert(
  'baseDate' in firstClaim,
  `claims[0] has baseDate: ${firstClaim.baseDate}`
);
assert(
  'targetDate' in firstClaim,
  `claims[0] has targetDate: ${firstClaim.targetDate}`
);

// ---- Test 9: Claims use bullish/bearish direction ----
console.log('\n[9] Claims use bullish/bearish direction');
const hasBullish = claims.some(c => c.direction === 'bullish');
const hasBearish = claims.some(c => c.direction === 'bearish');
assert(hasBullish, 'claims contain bullish direction');
assert(hasBearish, 'claims contain bearish direction');

// ---- Test 10: calculateReturn returns raw percent ----
console.log('\n[10] calculateReturn returns raw percent');
assert(
  returnsSource.includes('/ basePrice) * 100'),
  'calculateReturn multiplies by 100 (returns raw percent)'
);

// ---- Summary ----
console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.error('\nSmoke tests FAILED');
  process.exitCode = 1;
} else {
  console.log('\nSmoke tests PASSED');
}
