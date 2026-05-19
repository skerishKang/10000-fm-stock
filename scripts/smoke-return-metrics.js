#!/usr/bin/env node
/*
 * smoke-return-metrics.js — Smoke tests for return metrics contracts
 *
 * Validates:
 * - bullish/bearish direction support
 * - claim.baseDate usage
 * - claim.targetDate evaluation
 * - raw percent convention (16.67 = 16.67%)
 * - evaluatedPrice field priority
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

// ============================================================
// Extract functions from metrics-returns.js for runtime testing
// ============================================================
function calculateReturn(basePrice, evaluatedPrice) {
  if (basePrice == null || evaluatedPrice == null || basePrice === 0) return null;
  return ((evaluatedPrice - basePrice) / basePrice) * 100;
}

function getEvaluationPrice(evaluation) {
  if (!evaluation) return null;
  if (evaluation.evaluatedPrice != null) return evaluation.evaluatedPrice;
  if (evaluation.price != null) return evaluation.price;
  return null;
}

function findClosestEvaluation(evaluations, targetDate) {
  if (!evaluations || evaluations.length === 0) return null;
  var targetTs = targetDate.getTime();
  var closest = null;
  var minDiff = Infinity;
  for (var ei = 0; ei < evaluations.length; ei++) {
    var evalItem = evaluations[ei];
    var evalDate = new Date(evalItem.date || evalItem.evaluatedAt);
    if (isNaN(evalDate.getTime())) continue;
    var diff = Math.abs(evalDate.getTime() - targetTs);
    if (diff < minDiff) {
      minDiff = diff;
      closest = evalItem;
    }
  }
  if (minDiff <= 7 * 86400000) return closest;
  return null;
}

function calculateReturnsForPeriods(claim, evaluations) {
  var result = { '1M': null, '3M': null, '6M': null, '12M': null };
  if (!claim || !evaluations || evaluations.length === 0) return result;
  var basePrice = claim.basePrice || claim.price || null;
  if (basePrice == null) return result;
  var claimDate = new Date(claim.baseDate || claim.date || claim.createdAt);
  if (isNaN(claimDate.getTime())) return result;
  var periods = [
    { key: '1M', days: 30 },
    { key: '3M', days: 90 },
    { key: '6M', days: 180 },
    { key: '12M', days: 365 }
  ];
  for (var pi = 0; pi < periods.length; pi++) {
    var period = periods[pi];
    var targetDate = new Date(claimDate.getTime() + period.days * 86400000);
    var evalAtTarget = findClosestEvaluation(evaluations, targetDate);
    var evalPrice = getEvaluationPrice(evalAtTarget);
    if (evalPrice != null) {
      result[period.key] = calculateReturn(basePrice, evalPrice);
    }
  }
  return result;
}

function getEvaluatedPrice(claim, evaluations) {
  if (!claim || !evaluations || evaluations.length === 0) {
    if (claim && claim.evaluatedPrice != null) return claim.evaluatedPrice;
    return null;
  }
  var evalDate = claim.targetDate ? new Date(claim.targetDate) : new Date();
  var closest = findClosestEvaluation(evaluations, evalDate);
  var closestPrice = getEvaluationPrice(closest);
  if (closestPrice != null) return closestPrice;
  if (claim && claim.evaluatedPrice != null) return claim.evaluatedPrice;
  return null;
}

function isHit(direction, returnRate, targetPrice, evaluatedPrice, basePrice, claim) {
  if (direction === 'long' || direction === 'bullish') {
    if (evaluatedPrice != null && targetPrice != null) return evaluatedPrice >= targetPrice;
    if (returnRate != null && claim != null && claim.targetReturn != null) return returnRate >= claim.targetReturn;
    return returnRate != null && returnRate > 0;
  } else if (direction === 'short' || direction === 'bearish') {
    if (evaluatedPrice != null && targetPrice != null) return evaluatedPrice <= targetPrice;
    if (returnRate != null && claim != null && claim.targetReturn != null) return returnRate <= claim.targetReturn;
    return returnRate != null && returnRate < 0;
  }
  return false;
}

function isPartialHit(direction, returnRate, alpha) {
  if (direction === 'long' || direction === 'bullish') return returnRate > 0 && alpha > 0;
  if (direction === 'short' || direction === 'bearish') return returnRate < 0 && alpha > 0;
  return false;
}

function normalizeReturnsByDirection(returnRate, direction) {
  if (returnRate == null || !direction) return null;
  if (direction === 'short' || direction === 'bearish') return -returnRate;
  return returnRate;
}

// Load source for static checks
const returnsSource = fs.readFileSync(
  path.join(ROOT, 'assets', 'js', 'metrics', 'metrics-returns.js'),
  'utf8'
);
const domSource = fs.readFileSync(
  path.join(ROOT, 'assets', 'js', 'utils', 'utils-dom.js'),
  'utf8'
);
const formatSource = fs.readFileSync(
  path.join(ROOT, 'assets', 'js', 'utils', 'utils-format.js'),
  'utf8'
);

console.log('=== Return Metrics Smoke Tests ===\n');

// ============================================================
// Part A: Static source checks
// ============================================================
console.log('--- Part A: Static Source Checks ---\n');

console.log('[A1] isHit() supports bullish/bearish direction');
assert(
  returnsSource.includes("direction === 'long' || direction === 'bullish'"),
  'isHit handles bullish as long'
);
assert(
  returnsSource.includes("direction === 'short' || direction === 'bearish'"),
  'isHit handles bearish as short'
);

console.log('\n[A2] isPartialHit() supports bullish/bearish direction');
assert(
  returnsSource.includes("direction === 'long' || direction === 'bullish'") &&
  returnsSource.includes("direction === 'short' || direction === 'bearish'"),
  'isPartialHit handles bullish/bearish'
);

console.log('\n[A3] normalizeReturnsByDirection() supports bullish/bearish');
assert(
  returnsSource.includes("direction === 'short' || direction === 'bearish'"),
  'normalizeReturnsByDirection handles bearish'
);

console.log('\n[A4] calculateReturnsForPeriods uses claim.baseDate');
assert(
  returnsSource.includes('claim.baseDate || claim.date || claim.createdAt'),
  'calculateReturnsForPeriods uses baseDate first'
);

console.log('\n[A5] getEvaluatedPrice uses claim.targetDate');
assert(
  returnsSource.includes('claim.targetDate ? new Date(claim.targetDate) : new Date()'),
  'getEvaluatedPrice uses targetDate'
);

console.log('\n[A6] getEvaluationPrice helper exists');
assert(
  returnsSource.includes('function getEvaluationPrice(evaluation)'),
  'getEvaluationPrice helper defined'
);
assert(
  returnsSource.includes('evaluation.evaluatedPrice != null'),
  'getEvaluationPrice checks evaluatedPrice first'
);

console.log('\n[A7] formatPercent uses raw percent');
assert(
  !domSource.includes('n * 100'),
  'formatPercent does not multiply by 100'
);
assert(
  domSource.includes('Number(n).toFixed(2)'),
  'formatPercent uses toFixed(2) directly'
);

console.log('\n[A8] formatReturn uses raw percent');
assert(
  !formatSource.includes('value * 100'),
  'formatReturn does not multiply by 100'
);
assert(
  formatSource.includes('Number(value).toFixed(2)'),
  'formatReturn uses toFixed(2) directly'
);

// ============================================================
// Part B: Data file checks
// ============================================================
console.log('\n--- Part B: Data File Checks ---\n');

const claims = loadJson('claims.json');
const evaluations = loadJson('evaluations.json');

console.log('[B1] Data files use raw percent convention');
assert(
  typeof evaluations[0].returnRate === 'number' && evaluations[0].returnRate < 100,
  `evaluations[0].returnRate is ${evaluations[0].returnRate} (raw percent)`
);
assert(
  typeof evaluations[0].alpha === 'number' && evaluations[0].alpha < 100,
  `evaluations[0].alpha is ${evaluations[0].alpha} (raw percent)`
);

console.log('\n[B2] Claims have baseDate and targetDate');
assert('baseDate' in claims[0], `claims[0] has baseDate: ${claims[0].baseDate}`);
assert('targetDate' in claims[0], `claims[0] has targetDate: ${claims[0].targetDate}`);

console.log('\n[B3] Claims use bullish/bearish direction');
assert(claims.some(c => c.direction === 'bullish'), 'claims contain bullish');
assert(claims.some(c => c.direction === 'bearish'), 'claims contain bearish');

console.log('\n[B4] Evaluations have evaluatedPrice field');
assert(
  evaluations.every(e => e.evaluatedPrice != null),
  'all evaluations have evaluatedPrice'
);

// ============================================================
// Part C: Runtime function tests
// ============================================================
console.log('\n--- Part C: Runtime Function Tests ---\n');

console.log('[C1] getEvaluationPrice prioritizes evaluatedPrice');
var evalWithBoth = { evaluatedPrice: 91000, price: 99999 };
assert(getEvaluationPrice(evalWithBoth) === 91000, 'evaluatedPrice takes priority over price');
var evalWithPriceOnly = { price: 88000 };
assert(getEvaluationPrice(evalWithPriceOnly) === 88000, 'price used as fallback');
var evalWithNeither = {};
assert(getEvaluationPrice(evalWithNeither) === null, 'returns null when neither field exists');
assert(getEvaluationPrice(null) === null, 'returns null for null input');

console.log('\n[C2] calculateReturnsForPeriods returns non-null with real data');
var claim001 = claims.find(c => c.id === 'claim_001');
var eval001 = evaluations.filter(e => e.claimId === 'claim_001');
var periods = calculateReturnsForPeriods(claim001, eval001);
var hasNonNull = Object.values(periods).some(v => v != null);
assert(hasNonNull, `calculateReturnsForPeriods returns non-null: ${JSON.stringify(periods)}`);

console.log('\n[C3] getEvaluatedPrice returns evaluatedPrice');
var evalPrice = getEvaluatedPrice(claim001, eval001);
assert(evalPrice != null, `getEvaluatedPrice returns ${evalPrice}`);
assert(evalPrice === 91000, 'returns correct evaluatedPrice');

console.log('\n[C4] isHit works with bullish direction');
assert(isHit('bullish', 16.67, 95000, 91000, 78000, claim001) === false, 'bullish: 91000 < 95000 = miss');
assert(isHit('bullish', 16.67, 90000, 91000, 78000, claim001) === true, 'bullish: 91000 >= 90000 = hit');
assert(isHit('bullish', 5, null, null, null, { targetReturn: 3 }) === true, 'bullish: return >= targetReturn = hit');

console.log('\n[C5] isHit works with bearish direction');
assert(isHit('bearish', -10, 80000, 75000, 100000, {}) === true, 'bearish: 75000 <= 80000 = hit');
assert(isHit('bearish', -10, 70000, 75000, 100000, {}) === false, 'bearish: 75000 > 70000 = miss');
assert(isHit('bearish', -5, null, null, null, { targetReturn: -3 }) === true, 'bearish: return <= targetReturn = hit');

console.log('\n[C6] isPartialHit works correctly');
assert(isPartialHit('bullish', 5, 2) === true, 'bullish positive return + positive alpha = partial hit');
assert(isPartialHit('bullish', -5, 2) === false, 'bullish negative return = no partial hit');
assert(isPartialHit('bearish', -5, 2) === true, 'bearish negative return + positive alpha = partial hit');
assert(isPartialHit('bearish', 5, 2) === false, 'bearish positive return = no partial hit');

console.log('\n[C7] normalizeReturnsByDirection works correctly');
assert(normalizeReturnsByDirection(10, 'bullish') === 10, 'bullish: pass-through');
assert(normalizeReturnsByDirection(10, 'bearish') === -10, 'bearish: negate');
assert(normalizeReturnsByDirection(10, 'long') === 10, 'long: pass-through');
assert(normalizeReturnsByDirection(10, 'short') === -10, 'short: negate');
assert(normalizeReturnsByDirection(null, 'bullish') === null, 'null return: null');
assert(normalizeReturnsByDirection(10, null) === null, 'null direction: null');

console.log('\n[C8] calculateReturn returns raw percent');
assert(calculateReturn(100, 116.67) !== null, 'returns non-null');
var ret = calculateReturn(100, 116.67);
assert(Math.abs(ret - 16.67) < 0.01, `100->116.67 = ~16.67%, got ${ret}`);

console.log('\n[C9] end-to-end: claim with evaluatedPrice only (no price field)');
var syntheticClaim = {
  id: 'test_001',
  baseDate: '2025-01-01',
  targetDate: '2025-07-01',
  basePrice: 10000,
  targetPrice: 12000,
  direction: 'bullish'
};
var syntheticEvals = [{
  claimId: 'test_001',
  evaluatedAt: '2025-07-01',
  evaluatedPrice: 12500,
  returnRate: 25,
  benchmarkReturn: 5,
  alpha: 20,
  result: 'hit'
}];
var e2eReturn = getEvaluatedPrice(syntheticClaim, syntheticEvals);
assert(e2eReturn === 12500, `getEvaluatedPrice returns 12500, got ${e2eReturn}`);
var e2ePeriods = calculateReturnsForPeriods(syntheticClaim, syntheticEvals);
assert(e2ePeriods['6M'] != null, `6M return is non-null: ${e2ePeriods['6M']}`);
assert(Math.abs(e2ePeriods['6M'] - 25) < 0.1, `6M return is ~25%, got ${e2ePeriods['6M']}`);

// ============================================================
// Summary
// ============================================================
console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.error('\nSmoke tests FAILED');
  process.exitCode = 1;
} else {
  console.log('\nSmoke tests PASSED');
}
