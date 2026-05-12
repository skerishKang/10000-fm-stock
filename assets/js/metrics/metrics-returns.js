/**
 * metrics-returns.js — 수익률 계산 함수들
 * Return calculation functions for stock claims
 */

// ============================================================
// 1. calculateReturn — 기본 수익률 계산
// ============================================================
function calculateReturn(basePrice, evaluatedPrice) {
    if (basePrice == null || evaluatedPrice == null || basePrice === 0) return null;
    return ((evaluatedPrice - basePrice) / basePrice) * 100;
}

// ============================================================
// 2. calculateAlpha — 초과수익률 계산
// ============================================================
function calculateAlpha(returnRate, benchmarkReturn) {
    if (returnRate == null || benchmarkReturn == null) return null;
    return returnRate - benchmarkReturn;
}

// ============================================================
// 3. calculateReturnsForPeriods — 기간별 수익률 {1M,3M,6M,12M}
// ============================================================
function calculateReturnsForPeriods(claim, evaluations) {
    const result = { '1M': null, '3M': null, '6M': null, '12M': null };
    if (!claim || !evaluations || evaluations.length === 0) return result;

    const basePrice = claim.basePrice || claim.price || null;
    if (basePrice == null) return result;

    const claimDate = new Date(claim.date || claim.createdAt);
    if (isNaN(claimDate.getTime())) return result;

    const periods = [
        { key: '1M', days: 30 },
        { key: '3M', days: 90 },
        { key: '6M', days: 180 },
        { key: '12M', days: 365 }
    ];

    for (const period of periods) {
        const targetDate = new Date(claimDate.getTime() + period.days * 86400000);
        const evalAtTarget = findClosestEvaluation(evaluations, targetDate);
        if (evalAtTarget && evalAtTarget.price != null) {
            result[period.key] = calculateReturn(basePrice, evalAtTarget.price);
        }
    }

    return result;
}

// ============================================================
// 4. findClosestEvaluation — 가장 가까운 평가 데이터 찾기
// ============================================================'
function findClosestEvaluation(evaluations, targetDate) {
    if (!evaluations || evaluations.length === 0) return null;
    const targetTs = targetDate.getTime();
    let closest = null;
    let minDiff = Infinity;

    for (const evalItem of evaluations) {
        const evalDate = new Date(evalItem.date || evalItem.evaluatedAt);
        if (isNaN(evalDate.getTime())) continue;
        const diff = Math.abs(evalDate.getTime() - targetTs);
        if (diff < minDiff) {
            minDiff = diff;
            closest = evalItem;
        }
    }

    // 허용 오차: 7일 이내만 인정
    if (minDiff <= 7 * 86400000) return closest;
    return null;
}

// ============================================================
// 5. getDefaultReturn — 기본 대표 수익률 (6M 우선)
// ============================================================
function getDefaultReturn(claim, evaluations) {
    const returns = calculateReturnsForPeriods(claim, evaluations);
    if (returns['6M'] != null) return returns['6M'];
    if (returns['3M'] != null) return returns['3M'];
    if (returns['12M'] != null) return returns['12M'];
    if (returns['1M'] != null) return returns['1M'];
    return null;
}

// ============================================================
// 6. determineResult — hit/partial_hit/miss 판정
// ============================================================
function determineResult(claim, evaluations) {
    if (!claim || !evaluations) return { result: 'miss', returnRate: null, reason: 'no_data' };

    const basePrice = claim.basePrice || claim.price;
    const targetPrice = claim.targetPrice;
    const direction = claim.direction; // 'long' | 'short'
    const returnRate = getDefaultReturn(claim, evaluations);
    const evaluatedPrice = getEvaluatedPrice(claim, evaluations);

    if (basePrice == null || targetPrice == null || !direction || returnRate == null) {
        return { result: 'miss', returnRate: null, reason: 'insufficient_data' };
    }

    // hit 조건 검사
    if (isHit(direction, returnRate, targetPrice, evaluatedPrice, basePrice)) {
        return { result: 'hit', returnRate: returnRate, reason: 'target_reached' };
    }

    // partial_hit 조건 검사
    const alpha = calculateAlpha(returnRate, claim.benchmarkReturn || 0);
    if (isPartialHit(direction, returnRate, alpha)) {
        return { result: 'partial_hit', returnRate: returnRate, reason: 'positive_alpha' };
    }

    return { result: 'miss', returnRate: returnRate, reason: 'below_threshold' };
}

// ============================================================
// 7. isHit — hit 조건 검사
// ============================================================'
function isHit(direction, returnRate, targetPrice, evaluatedPrice, basePrice) {
    if (direction === 'long') {
        // 롱: 평가가격 >= 목표가격
        if (evaluatedPrice != null && targetPrice != null) {
            return evaluatedPrice >= targetPrice;
        }
        // 가격 정보 없으면 수익률로 판단
        if (returnRate != null && claim != null && claim.targetReturn != null) {
            return returnRate >= claim.targetReturn;
        }
        return returnRate != null && returnRate > 0;
    } else if (direction === 'short') {
        // 숏: 평가가격 <= 목표가격
        if (evaluatedPrice != null && targetPrice != null) {
            return evaluatedPrice <= targetPrice;
        }
        if (returnRate != null && claim != null && claim.targetReturn != null) {
            return returnRate <= claim.targetReturn;
        }
        return returnRate != null && returnRate < 0;
    }
    return false;
}

// ============================================================
// 8. isPartialHit — partial_hit 조건 검사
// ============================================================
function isPartialHit(direction, returnRate, alpha) {
    if (direction === 'long') {
        return returnRate > 0 && alpha > 0;
    } else if (direction === 'short') {
        return returnRate < 0 && alpha > 0;
    }
    return false;
}

// ============================================================
// 9. getEvaluatedPrice — 평가 시점 가격 추출
// ============================================================
function getEvaluatedPrice(claim, evaluations) {
    if (!claim || !evaluations || evaluations.length === 0) {
        // 직접 claim 평가가 확인
        if (claim && claim.evaluatedPrice != null) return claim.evaluatedPrice;
        return null;
    }

    const closest = findClosestEvaluation(evaluations, new Date());
    if (closest && closest.price != null) return closest.price;
    if (claim && claim.evaluatedPrice != null) return claim.evaluatedPrice;
    return null;
}

// ============================================================
// 10. getReturnForPeriod — 특정 기간 수익률
// ============================================================
function getReturnForPeriod(claim, evaluations, periodLabel) {
    const returns = calculateReturnsForPeriods(claim, evaluations);
    return returns[periodLabel] != null ? returns[periodLabel] : null;
}

// ============================================================
// 11. getCumulativeReturn — 누적 수익률 (여러 평가)
// ============================================================
function getCumulativeReturn(returns) {
    if (!returns || returns.length === 0) return null;
    let cumulative = 1;
    for (const r of returns) {
        if (r == null) return null;
        cumulative *= (1 + r / 100);
    }
    return (cumulative - 1) * 100;
}

// ============================================================
// 12. annualizeReturn — 연환산 수익률
// ============================================================
function annualizeReturn(totalReturn, holdingDays) {
    if (totalReturn == null || holdingDays == null || holdingDays <= 0) return null;
    const years = holdingDays / 365;
    if (years <= 0) return null;
    return Math.pow(1 + totalReturn / 100, 1 / years) - 1;
}

// ============================================================
// 13. normalizeReturnsByDirection — 방향별 수익률 정규화
// ============================================================
function normalizeReturnsByDirection(returnRate, direction) {
    if (returnRate == null || !direction) return null;
    if (direction === 'short') {
        return -returnRate; // 숏은 반전
    }
    return returnRate;
}

module.exports = {
    calculateReturn,
    calculateAlpha,
    calculateReturnsForPeriods,
    findClosestEvaluation,
    getDefaultReturn,
    determineResult,
    isHit,
    isPartialHit,
    getEvaluatedPrice,
    getReturnForPeriod,
    getCumulativeReturn,
    annualizeReturn,
    normalizeReturnsByDirection
};
