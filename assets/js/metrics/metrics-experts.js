/**
 * metrics-experts.js — 전문가별 통계 함수들
 * Expert statistics calculation modules
 */

const { calculateReturn, calculateAlpha, getDefaultReturn, determineResult, calculateReturnsForPeriods, normalizeReturnsByDirection } = require('./metrics-returns.js');

// ============================================================
// 1. median — 중앙값 계산
// ============================================================
function median(values) {
    if (!values || values.length === 0) return null;
    const sorted = [...values].filter(v => v != null).sort((a, b) => a - b);
    if (sorted.length === 0) return null;
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}

// ============================================================
// 2. getExpertClaims — 전문가의 모든 claim 반환
// ============================================================
function getExpertClaims(expertId, claims) {
    if (!expertId || !claims || claims.length === 0) return [];
    return claims.filter(c => String(c.expertId) === String(expertId) || String(c.expert_id) === String(expertId));
}

// ============================================================
// 3. getExpertStats — 전문가별 종합 통계
// ============================================================
function getExpertStats(expertId, claims, evaluations) {
    const expertClaims = getExpertClaims(expertId, claims);
    const total = expertClaims.length;

    if (total === 0) {
        return {
            expertId,
            total: 0,
            verified: 0,
            hitRate: null,
            avgReturn: null,
            medianReturn: null,
            avgAlpha: null,
            medianAlpha: null,
            targetAchievementRate: null,
            industryBreakdown: {}
        };
    }

    let verified = 0;
    const returns = [];
    const alphas = [];
    let hits = 0;
    let partialHits = 0;

    for (const claim of expertClaims) {
        const evals = evaluations ? evaluations.filter(e => String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id)) : [];
        const result = determineResult(claim, evals);
        const returnRate = getDefaultReturn(claim, evals);
        const normalizedReturn = normalizeReturnsByDirection(returnRate, claim.direction);

        if (returnRate != null) {
            verified++;
            returns.push(normalizedReturn != null ? normalizedReturn : returnRate);
            const alpha = calculateAlpha(returnRate, claim.benchmarkReturn || 0);
            if (alpha != null) alphas.push(alpha);
        }

        if (result.result === 'hit') hits++;
        if (result.result === 'partial_hit') partialHits++;
    }

    const hitRate = verified > 0 ? (hits + partialHits) / verified : null;
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : null;
    const medReturn = median(returns);
    const avgAlpha = alphas.length > 0 ? alphas.reduce((a, b) => a + b, 0) / alphas.length : null;
    const medAlpha = median(alphas);
    const targetAchievementRate = total > 0 ? (hits / total) : null;
    const industryBreakdown = getIndustryBreakdown(expertId, claims, evaluations);

    return {
        expertId,
        total,
        verified,
        hitRate,
        avgReturn,
        medianReturn: medReturn,
        avgAlpha,
        medianAlpha: medAlpha,
        targetAchievementRate,
        industryBreakdown
    };
}

// ============================================================
// 4. getIndustryBreakdown — 산업별 성과
// ============================================================
function getIndustryBreakdown(expertId, claims, evaluations) {
    const expertClaims = getExpertClaims(expertId, claims);
    if (expertClaims.length === 0) return {};

    const industries = {};

    for (const claim of expertClaims) {
        const industry = claim.industry || claim.sector || 'Unknown';
        if (!industries[industry]) {
            industries[industry] = {
                total: 0,
                verified: 0,
                hits: 0,
                partialHits: 0,
                returns: [],
                alphas: []
            };
        }

        const ind = industries[industry];
        ind.total++;

        const evals = evaluations ? evaluations.filter(e => String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id)) : [];
        const returnRate = getDefaultReturn(claim, evals);
        const result = determineResult(claim, evals);
        const normalizedReturn = normalizeReturnsByDirection(returnRate, claim.direction);

        if (returnRate != null) {
            ind.verified++;
            ind.returns.push(normalizedReturn != null ? normalizedReturn : returnRate);
            const alpha = calculateAlpha(returnRate, claim.benchmarkReturn || 0);
            if (alpha != null) ind.alphas.push(alpha);
        }

        if (result.result === 'hit') ind.hits++;
        if (result.result === 'partial_hit') ind.partialHits++;
    }

    const breakdown = {};
    for (const [industry, data] of Object.entries(industries)) {
        const avgReturn = data.returns.length > 0 ? data.returns.reduce((a, b) => a + b, 0) / data.returns.length : null;
        const avgAlpha = data.alphas.length > 0 ? data.alphas.reduce((a, b) => a + b, 0) / data.alphas.length : null;
        const hitRate = data.verified > 0 ? (data.hits + data.partialHits) / data.verified : null;

        breakdown[industry] = {
            total: data.total,
            verified: data.verified,
            hits: data.hits,
            partialHits: data.partialHits,
            hitRate,
            avgReturn,
            avgAlpha
        };
    }

    return breakdown;
}

// ============================================================
// 5. getTopClaims — 잘 맞춘 발언 TOP N
// ============================================================
function getTopClaims(expertId, claims, evaluations, N) {
    const expertClaims = getExpertClaims(expertId, claims);
    if (expertClaims.length === 0) return [];

    const scored = [];

    for (const claim of expertClaims) {
        const evals = evaluations ? evaluations.filter(e => String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id)) : [];
        const returnRate = getDefaultReturn(claim, evals);
        const normalizedReturn = normalizeReturnsByDirection(returnRate, claim.direction);
        const result = determineResult(claim, evals);
        const alpha = calculateAlpha(returnRate, claim.benchmarkReturn || 0);
        const accuracy = result.result === 'hit' ? 1 : result.result === 'partial_hit' ? 0.5 : 0;

        // 점수: hit 여부 + 정규화 수익률 + 알파
        const score = accuracy * 100 + (normalizedReturn != null ? Math.max(0, normalizedReturn) : 0) + (alpha != null ? Math.max(0, alpha) : 0);

        scored.push({
            claim,
            returnRate,
            normalizedReturn,
            alpha,
            result: result.result,
            score
        });
    }

    scored.sort((a, b) => b.score - a.score);
    const topN = scored.slice(0, N || 10);

    return topN.map((item, index) => ({
        rank: index + 1,
        claimId: item.claim.id || item.claim._id,
        title: item.claim.title || item.claim.content || '',
        returnRate: item.returnRate,
        normalizedReturn: item.normalizedReturn,
        alpha: item.alpha,
        result: item.result,
        score: item.score
    }));
}

// ============================================================
// 6. getBottomClaims — 부진 발언 TOP N
// ============================================================
function getBottomClaims(expertId, claims, evaluations, N) {
    const expertClaims = getExpertClaims(expertId, claims);
    if (expertClaims.length === 0) return [];

    const scored = [];

    for (const claim of expertClaims) {
        const evals = evaluations ? evaluations.filter(e => String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id)) : [];
        const returnRate = getDefaultReturn(claim, evals);
        const normalizedReturn = normalizeReturnsByDirection(returnRate, claim.direction);
        const result = determineResult(claim, evals);
        const alpha = calculateAlpha(returnRate, claim.benchmarkReturn || 0);
        const accuracy = result.result === 'hit' ? 1 : result.result === 'partial_hit' ? 0.5 : 0;

        // 점수: miss 가중 + 손실 크기
        const penalty = accuracy === 0 ? 50 : 0;
        const lossPenalty = (normalizedReturn != null && normalizedReturn < 0) ? Math.abs(normalizedReturn) : 0;
        const negativeAlpha = (alpha != null && alpha < 0) ? Math.abs(alpha) : 0;
        const score = penalty + lossPenalty + negativeAlpha;

        scored.push({
            claim,
            returnRate,
            normalizedReturn,
            alpha,
            result: result.result,
            score
        });
    }

    scored.sort((a, b) => b.score - a.score);
    const bottomN = scored.slice(0, N || 10);

    return bottomN.map((item, index) => ({
        rank: index + 1,
        claimId: item.claim.id || item.claim._id,
        title: item.claim.title || item.claim.content || '',
        returnRate: item.returnRate,
        normalizedReturn: item.normalizedReturn,
        alpha: item.alpha,
        result: item.result,
        score: item.score
    }));
}

// ============================================================
// 7. getExpertsList — 전문가 목록 추출 (중복 제거)
// ============================================================
function getExpertsList(claims) {
    if (!claims || claims.length === 0) return [];
    const expertMap = new Map();
    for (const claim of claims) {
        const eid = claim.expertId || claim.expert_id;
        const ename = claim.expertName || claim.expert_name || claim.expert || '';
        if (eid != null && !expertMap.has(String(eid))) {
            expertMap.set(String(eid), {
                id: eid,
                name: ename,
                claimCount: 0
            });
        }
        if (eid != null) {
            const entry = expertMap.get(String(eid));
            if (entry) entry.claimCount++;
        }
    }
    return Array.from(expertMap.values());
}

// ============================================================
// 8. getExpertsWithMinSample — 최소 표본 조건 필터
// ============================================================
function getExpertsWithMinSample(experts, claims, evaluations, minSample) {
    const min = minSample || 3;
    return experts.filter(expert => {
        const stats = getExpertStats(expert.id, claims, evaluations);
        return stats.verified >= min;
    });
}

module.exports = {
    median,
    getExpertClaims,
    getExpertStats,
    getIndustryBreakdown,
    getTopClaims,
    getBottomClaims,
    getExpertsList,
    getExpertsWithMinSample
};
