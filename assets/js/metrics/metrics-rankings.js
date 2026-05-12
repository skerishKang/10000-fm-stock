/**
 * metrics-rankings.js — 랭킹 계산 함수들
 * Ranking calculation modules for experts and claims
 */

const { getDefaultReturn, calculateAlpha, normalizeReturnsByDirection } = require('./metrics-returns.js');
const { getExpertStats, getExpertsList, getExpertsWithMinSample, getIndustryBreakdown } = require('./metrics-experts.js');

// ============================================================
// 1. getReturnTopRanking — 수익률 TOP N
// ============================================================
function getReturnTopRanking(claims, evaluations, N) {
    if (!claims || claims.length === 0) return [];

    const scored = [];

    for (const claim of claims) {
        const evals = evaluations ? evaluations.filter(e => String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id)) : [];
        const returnRate = getDefaultReturn(claim, evals);
        const normalizedReturn = normalizeReturnsByDirection(returnRate, claim.direction);

        if (normalizedReturn == null) continue;

        scored.push({
            claimId: claim.id || claim._id,
            title: claim.title || claim.content || '',
            expertId: claim.expertId || claim.expert_id,
            expertName: claim.expertName || claim.expert_name || claim.expert || '',
            direction: claim.direction,
            returnRate,
            normalizedReturn
        });
    }

    scored.sort((a, b) => b.normalizedReturn - a.normalizedReturn);
    const topN = scored.slice(0, N || 10);

    return topN.map((item, index) => ({
        rank: index + 1,
        ...item
    }));
}

// ============================================================
// 2. getAlphaTopRanking — 초과수익률 TOP N
// ============================================================
function getAlphaTopRanking(claims, evaluations, N) {
    if (!claims || claims.length === 0) return [];

    const scored = [];

    for (const claim of claims) {
        const evals = evaluations ? evaluations.filter(e => String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id)) : [];
        const returnRate = getDefaultReturn(claim, evals);
        if (returnRate == null) continue;

        const alpha = calculateAlpha(returnRate, claim.benchmarkReturn || 0);
        if (alpha == null) continue;

        scored.push({
            claimId: claim.id || claim._id,
            title: claim.title || claim.content || '',
            expertId: claim.expertId || claim.expert_id,
            expertName: claim.expertName || claim.expert_name || claim.expert || '',
            direction: claim.direction,
            returnRate,
            benchmarkReturn: claim.benchmarkReturn || 0,
            alpha
        });
    }

    scored.sort((a, b) => b.alpha - a.alpha);
    const topN = scored.slice(0, N || 10);

    return topN.map((item, index) => ({
        rank: index + 1,
        ...item
    }));
}

// ============================================================
// 3. getExpertAlphaRanking — 전문가 평균 알파 랭킹
// ============================================================
function getExpertAlphaRanking(experts, claims, evaluations, minSample) {
    if (!experts || experts.length === 0 || !claims) return [];

    const min = minSample || 3;
    const validExperts = experts.filter(expert => {
        const stats = getExpertStats(expert.id || expert.expertId, claims, evaluations);
        return stats.verified >= min && stats.avgAlpha != null;
    });

    const ranking = validExperts.map(expert => {
        const stats = getExpertStats(expert.id || expert.expertId, claims, evaluations);
        return {
            expertId: expert.id || expert.expertId,
            expertName: expert.name || expert.expertName || '',
            avgAlpha: stats.avgAlpha,
            medianAlpha: stats.medianAlpha,
            verified: stats.verified,
            total: stats.total,
            hitRate: stats.hitRate,
            avgReturn: stats.avgReturn
        };
    });

    ranking.sort((a, b) => b.avgAlpha - a.avgAlpha);

    return ranking.map((item, index) => ({
        rank: index + 1,
        ...item
    }));
}

// ============================================================
// 4. getExpertHitRateRanking — 적중률 랭킹
// ============================================================
function getExpertHitRateRanking(experts, claims, evaluations, minSample) {
    if (!experts || experts.length === 0 || !claims) return [];

    const min = minSample || 3;
    const validExperts = experts.filter(expert => {
        const stats = getExpertStats(expert.id || expert.expertId, claims, evaluations);
        return stats.verified >= min && stats.hitRate != null;
    });

    const ranking = validExperts.map(expert => {
        const stats = getExpertStats(expert.id || expert.expertId, claims, evaluations);
        return {
            expertId: expert.id || expert.expertId,
            expertName: expert.name || expert.expertName || '',
            hitRate: stats.hitRate,
            verified: stats.verified,
            total: stats.total,
            avgReturn: stats.avgReturn,
            avgAlpha: stats.avgAlpha,
            targetAchievementRate: stats.targetAchievementRate
        };
    });

    ranking.sort((a, b) => b.hitRate - a.hitRate);

    return ranking.map((item, index) => ({
        rank: index + 1,
        ...item
    }));
}

// ============================================================
// 5. getIndustryRanking — 산업별 랭킹
// ============================================================
function getIndustryRanking(experts, claims, evaluations, industry) {
    if (!experts || experts.length === 0 || !claims || !industry) return [];

    const expertScores = [];

    for (const expert of experts) {
        const eid = expert.id || expert.expertId;
        const breakdown = getIndustryBreakdown(eid, claims, evaluations);
        const indData = breakdown[industry];

        if (!indData || indData.verified < 1) continue;

        expertScores.push({
            expertId: eid,
            expertName: expert.name || expert.expertName || '',
            industry,
            total: indData.total,
            verified: indData.verified,
            hits: indData.hits,
            partialHits: indData.partialHits,
            hitRate: indData.hitRate,
            avgReturn: indData.avgReturn,
            avgAlpha: indData.avgAlpha
        });
    }

    expertScores.sort((a, b) => {
        // 1순위: 적중률, 2순위: 평균 수익률
        if ((b.hitRate || 0) !== (a.hitRate || 0)) return (b.hitRate || 0) - (a.hitRate || 0);
        return (b.avgReturn || 0) - (a.avgReturn || 0);
    });

    return expertScores.map((item, index) => ({
        rank: index + 1,
        ...item
    }));
}

// ============================================================
// 6. getKnowledgeContributionRanking — 지식 기여 랭킹
// ============================================================
function getKnowledgeContributionRanking(experts, knowledgeNotes, N) {
    if (!experts || experts.length === 0) return [];

    const expertScores = [];

    for (const expert of experts) {
        const eid = expert.id || expert.expertId;
        const ename = expert.name || expert.expertName || '';

        // 해당 전문가의 지식 노트 찾기
        const notes = knowledgeNotes ? knowledgeNotes.filter(n =>
            String(n.expertId) === String(eid) || String(n.authorId) === String(eid)
        ) : [];

        const totalNotes = notes.length;
        if (totalNotes === 0) continue;

        const totalViews = notes.reduce((sum, n) => sum + (n.views || n.viewCount || 0), 0);
        const totalLikes = notes.reduce((sum, n) => sum + (n.likes || n.likeCount || 0), 0);
        const totalShares = notes.reduce((sum, n) => sum + (n.shares || n.shareCount || 0), 0);
        const avgRating = notes.length > 0
            ? notes.reduce((sum, n) => sum + (n.rating || n.score || 0), 0) / notes.length
            : 0;

        // 기여 점수 = 노트수 * 2 + 조회수 * 0.01 + 좋아요 * 0.5 + 공유 * 1 + 평점 * 3
        const contributionScore =
            totalNotes * 2 +
            totalViews * 0.01 +
            totalLikes * 0.5 +
            totalShares * 1 +
            avgRating * 3;

        expertScores.push({
            expertId: eid,
            expertName: ename,
            totalNotes,
            totalViews,
            totalLikes,
            totalShares,
            avgRating,
            contributionScore
        });
    }

    expertScores.sort((a, b) => b.contributionScore - a.contributionScore);
    const topN = expertScores.slice(0, N || 10);

    return topN.map((item, index) => ({
        rank: index + 1,
        ...item
    }));
}

// ============================================================
// 7. getExpertMultiMetricRanking — 복합 지표 랭킹
// ============================================================
function getExpertMultiMetricRanking(experts, claims, evaluations, weights, minSample) {
    if (!experts || !claims) return [];

    const w = weights || { alpha: 0.4, hitRate: 0.3, return: 0.2, volume: 0.1 };
    const min = minSample || 3;
    const validExperts = getExpertsWithMinSample(experts, claims, evaluations, min);

    const ranking = validExperts.map(expert => {
        const stats = getExpertStats(expert.id || expert.expertId, claims, evaluations);
        const normAlpha = stats.avgAlpha != null ? stats.avgAlpha : 0;
        const normHitRate = stats.hitRate != null ? stats.hitRate * 100 : 0;
        const normReturn = stats.avgReturn != null ? Math.max(0, stats.avgReturn) : 0;
        const normVolume = Math.min(stats.verified / 20, 1) * 100;

        const compositeScore =
            (w.alpha || 0) * normAlpha +
            (w.hitRate || 0) * normHitRate +
            (w.return || 0) * normReturn +
            (w.volume || 0) * normVolume;

        return {
            expertId: expert.id || expert.expertId,
            expertName: expert.name || expert.expertName || '',
            compositeScore,
            avgAlpha: stats.avgAlpha,
            hitRate: stats.hitRate,
            avgReturn: stats.avgReturn,
            verified: stats.verified,
            total: stats.total
        };
    });

    ranking.sort((a, b) => b.compositeScore - a.compositeScore);

    return ranking.map((item, index) => ({
        rank: index + 1,
        ...item
    }));
}

// ============================================================
// 8. getClaimDirectionRanking — 방향별 수익률 랭킹
// ============================================================
function getClaimDirectionRanking(claims, evaluations, direction, N) {
    if (!claims || claims.length === 0) return [];

    const filtered = claims.filter(c => c.direction === direction);
    return getReturnTopRanking(filtered, evaluations, N);
}

// ============================================================
// 9. getExpertTrendRanking — 최근 트렌드 랭킹 (최근 N일)
// ============================================================
function getExpertTrendRanking(experts, claims, evaluations, days, minSample) {
    if (!experts || !claims) return [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days || 30));

    const recentClaims = claims.filter(c => {
        const d = new Date(c.date || c.createdAt);
        return !isNaN(d.getTime()) && d >= cutoff;
    });

    return getExpertAlphaRanking(experts, recentClaims, evaluations, minSample);
}

module.exports = {
    getReturnTopRanking,
    getAlphaTopRanking,
    getExpertAlphaRanking,
    getExpertHitRateRanking,
    getIndustryRanking,
    getKnowledgeContributionRanking,
    getExpertMultiMetricRanking,
    getClaimDirectionRanking,
    getExpertTrendRanking
};
