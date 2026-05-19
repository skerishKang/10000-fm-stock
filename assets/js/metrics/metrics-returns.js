/**
 * metrics-returns.js — Return calculation functions for stock claims
 * Namespace: FMStock.metrics.returns
 */

window.FMStock = window.FMStock || {};
window.FMStock.metrics = window.FMStock.metrics || {};

// ============================================================
// 1. calculateReturn — Basic return calculation
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

function calculateAlpha(returnRate, benchmarkReturn) {
    if (returnRate == null || benchmarkReturn == null) return null;
    return returnRate - benchmarkReturn;
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

function getDefaultReturn(claim, evaluations) {
    var returns = calculateReturnsForPeriods(claim, evaluations);
    if (returns['6M'] != null) return returns['6M'];
    if (returns['3M'] != null) return returns['3M'];
    if (returns['12M'] != null) return returns['12M'];
    if (returns['1M'] != null) return returns['1M'];
    return null;
}

function determineResult(claim, evaluations) {
    if (!claim || !evaluations) return { result: 'miss', returnRate: null, reason: 'no_data' };
    var basePrice = claim.basePrice || claim.price;
    var targetPrice = claim.targetPrice;
    var direction = claim.direction;
    var returnRate = getDefaultReturn(claim, evaluations);
    var evaluatedPrice = getEvaluatedPrice(claim, evaluations);
    if (basePrice == null || targetPrice == null || !direction || returnRate == null) {
        return { result: 'miss', returnRate: null, reason: 'insufficient_data' };
    }
    if (isHit(direction, returnRate, targetPrice, evaluatedPrice, basePrice, claim)) {
        return { result: 'hit', returnRate: returnRate, reason: 'target_reached' };
    }
    var alpha = calculateAlpha(returnRate, claim.benchmarkReturn || 0);
    if (isPartialHit(direction, returnRate, alpha)) {
        return { result: 'partial_hit', returnRate: returnRate, reason: 'positive_alpha' };
    }
    return { result: 'miss', returnRate: returnRate, reason: 'below_threshold' };
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

function getReturnForPeriod(claim, evaluations, periodLabel) {
    var returns = calculateReturnsForPeriods(claim, evaluations);
    return returns[periodLabel] != null ? returns[periodLabel] : null;
}

function getCumulativeReturn(returns) {
    if (!returns || returns.length === 0) return null;
    var cumulative = 1;
    for (var ri = 0; ri < returns.length; ri++) {
        var r = returns[ri];
        if (r == null) return null;
        cumulative *= (1 + r / 100);
    }
    return (cumulative - 1) * 100;
}

function annualizeReturn(totalReturn, holdingDays) {
    if (totalReturn == null || holdingDays == null || holdingDays <= 0) return null;
    var years = holdingDays / 365;
    if (years <= 0) return null;
    return Math.pow(1 + totalReturn / 100, 1 / years) - 1;
}

function normalizeReturnsByDirection(returnRate, direction) {
    if (returnRate == null || !direction) return null;
    if (direction === 'short' || direction === 'bearish') return -returnRate;
    return returnRate;
}

window.FMStock.metrics.returns = {
    calculateReturn: calculateReturn,
    calculateAlpha: calculateAlpha,
    calculateReturnsForPeriods: calculateReturnsForPeriods,
    findClosestEvaluation: findClosestEvaluation,
    getDefaultReturn: getDefaultReturn,
    determineResult: determineResult,
    isHit: isHit,
    isPartialHit: isPartialHit,
    getEvaluatedPrice: getEvaluatedPrice,
    getEvaluationPrice: getEvaluationPrice,
    getReturnForPeriod: getReturnForPeriod,
    getCumulativeReturn: getCumulativeReturn,
    annualizeReturn: annualizeReturn,
    normalizeReturnsByDirection: normalizeReturnsByDirection
};
