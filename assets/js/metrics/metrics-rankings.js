/**
 * metrics-rankings.js — Ranking calculation modules for experts and claims
 * Namespace: FMStock.metrics.rankings
 */

window.FMStock = window.FMStock || {};
window.FMStock.metrics = window.FMStock.metrics || {};

function getReturnTopRanking(claims, evaluations, N) {
    var R = window.FMStock.metrics.returns;
    if (!claims || claims.length === 0) return [];
    var scored = [];
    for (var ci = 0; ci < claims.length; ci++) {
        var claim = claims[ci];
        var evals = evaluations ? evaluations.filter(function(e) {
            return String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id);
        }) : [];
        var returnRate = R.getDefaultReturn(claim, evals);
        var normalizedReturn = R.normalizeReturnsByDirection(returnRate, claim.direction);
        if (normalizedReturn == null) continue;
        scored.push({ claimId: claim.id || claim._id, title: claim.title || claim.content || '', expertId: claim.expertId || claim.expert_id, expertName: claim.expertName || claim.expert_name || claim.expert || '', direction: claim.direction, returnRate: returnRate, normalizedReturn: normalizedReturn });
    }
    scored.sort(function(a, b) { return b.normalizedReturn - a.normalizedReturn; });
    var topN = scored.slice(0, N || 10);
    return topN.map(function(item, index) { return { rank: index + 1, claimId: item.claimId, title: item.title, expertId: item.expertId, expertName: item.expertName, direction: item.direction, returnRate: item.returnRate, normalizedReturn: item.normalizedReturn }; });
}

function getAlphaTopRanking(claims, evaluations, N) {
    var R = window.FMStock.metrics.returns;
    if (!claims || claims.length === 0) return [];
    var scored = [];
    for (var ci = 0; ci < claims.length; ci++) {
        var claim = claims[ci];
        var evals = evaluations ? evaluations.filter(function(e) {
            return String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id);
        }) : [];
        var returnRate = R.getDefaultReturn(claim, evals);
        if (returnRate == null) continue;
        var alpha = R.calculateAlpha(returnRate, claim.benchmarkReturn || 0);
        if (alpha == null) continue;
        scored.push({ claimId: claim.id || claim._id, title: claim.title || claim.content || '', expertId: claim.expertId || claim.expert_id, expertName: claim.expertName || claim.expert_name || claim.expert || '', direction: claim.direction, returnRate: returnRate, benchmarkReturn: claim.benchmarkReturn || 0, alpha: alpha });
    }
    scored.sort(function(a, b) { return b.alpha - a.alpha; });
    var topN = scored.slice(0, N || 10);
    return topN.map(function(item, index) { return { rank: index + 1, claimId: item.claimId, title: item.title, expertId: item.expertId, expertName: item.expertName, direction: item.direction, returnRate: item.returnRate, benchmarkReturn: item.benchmarkReturn, alpha: item.alpha }; });
}

function getExpertAlphaRanking(experts, claims, evaluations, minSample) {
    var E = window.FMStock.metrics.experts;
    if (!experts || experts.length === 0 || !claims) return [];
    var min = minSample || 3;
    var validExperts = experts.filter(function(expert) {
        var stats = E.getExpertStats(expert.id || expert.expertId, claims, evaluations);
        return stats.verified >= min && stats.avgAlpha != null;
    });
    var ranking = validExperts.map(function(expert) {
        var stats = E.getExpertStats(expert.id || expert.expertId, claims, evaluations);
        return { expertId: expert.id || expert.expertId, expertName: expert.name || expert.expertName || '', avgAlpha: stats.avgAlpha, medianAlpha: stats.medianAlpha, verified: stats.verified, total: stats.total, hitRate: stats.hitRate, avgReturn: stats.avgReturn };
    });
    ranking.sort(function(a, b) { return b.avgAlpha - a.avgAlpha; });
    return ranking.map(function(item, index) { return { rank: index + 1, expertId: item.expertId, expertName: item.expertName, avgAlpha: item.avgAlpha, medianAlpha: item.medianAlpha, verified: item.verified, total: item.total, hitRate: item.hitRate, avgReturn: item.avgReturn }; });
}

function getExpertHitRateRanking(experts, claims, evaluations, minSample) {
    var E = window.FMStock.metrics.experts;
    if (!experts || experts.length === 0 || !claims) return [];
    var min = minSample || 3;
    var validExperts = experts.filter(function(expert) {
        var stats = E.getExpertStats(expert.id || expert.expertId, claims, evaluations);
        return stats.verified >= min && stats.hitRate != null;
    });
    var ranking = validExperts.map(function(expert) {
        var stats = E.getExpertStats(expert.id || expert.expertId, claims, evaluations);
        return { expertId: expert.id || expert.expertId, expertName: expert.name || expert.expertName || '', hitRate: stats.hitRate, verified: stats.verified, total: stats.total, avgReturn: stats.avgReturn, avgAlpha: stats.avgAlpha, targetAchievementRate: stats.targetAchievementRate };
    });
    ranking.sort(function(a, b) { return b.hitRate - a.hitRate; });
    return ranking.map(function(item, index) { return { rank: index + 1, expertId: item.expertId, expertName: item.expertName, hitRate: item.hitRate, verified: item.verified, total: item.total, avgReturn: item.avgReturn, avgAlpha: item.avgAlpha, targetAchievementRate: item.targetAchievementRate }; });
}

function getIndustryRanking(experts, claims, evaluations, industry) {
    var E = window.FMStock.metrics.experts;
    if (!experts || experts.length === 0 || !claims || !industry) return [];
    var expertScores = [];
    for (var ei = 0; ei < experts.length; ei++) {
        var expert = experts[ei];
        var eid = expert.id || expert.expertId;
        var breakdown = E.getIndustryBreakdown(eid, claims, evaluations);
        var indData = breakdown[industry];
        if (!indData || indData.verified < 1) continue;
        expertScores.push({ expertId: eid, expertName: expert.name || expert.expertName || '', industry: industry, total: indData.total, verified: indData.verified, hits: indData.hits, partialHits: indData.partialHits, hitRate: indData.hitRate, avgReturn: indData.avgReturn, avgAlpha: indData.avgAlpha });
    }
    expertScores.sort(function(a, b) {
        if ((b.hitRate || 0) !== (a.hitRate || 0)) return (b.hitRate || 0) - (a.hitRate || 0);
        return (b.avgReturn || 0) - (a.avgReturn || 0);
    });
    return expertScores.map(function(item, index) { return { rank: index + 1, expertId: item.expertId, expertName: item.expertName, industry: item.industry, total: item.total, verified: item.verified, hits: item.hits, partialHits: item.partialHits, hitRate: item.hitRate, avgReturn: item.avgReturn, avgAlpha: item.avgAlpha }; });
}

function getKnowledgeContributionRanking(experts, knowledgeNotes, N) {
    if (!experts || experts.length === 0) return [];
    var expertScores = [];
    for (var ei = 0; ei < experts.length; ei++) {
        var expert = experts[ei];
        var eid = expert.id || expert.expertId;
        var ename = expert.name || expert.expertName || '';
        var notes = knowledgeNotes ? knowledgeNotes.filter(function(n) {
            return String(n.expertId) === String(eid) || String(n.authorId) === String(eid);
        }) : [];
        var totalNotes = notes.length;
        if (totalNotes === 0) continue;
        var totalViews = 0, totalLikes = 0, totalShares = 0, totalRating = 0;
        for (var ni = 0; ni < notes.length; ni++) {
            var n = notes[ni];
            totalViews += n.views || n.viewCount || 0;
            totalLikes += n.likes || n.likeCount || 0;
            totalShares += n.shares || n.shareCount || 0;
            totalRating += n.rating || n.score || 0;
        }
        var avgRating = notes.length > 0 ? totalRating / notes.length : 0;
        var contributionScore = totalNotes * 2 + totalViews * 0.01 + totalLikes * 0.5 + totalShares * 1 + avgRating * 3;
        expertScores.push({ expertId: eid, expertName: ename, totalNotes: totalNotes, totalViews: totalViews, totalLikes: totalLikes, totalShares: totalShares, avgRating: avgRating, contributionScore: contributionScore });
    }
    expertScores.sort(function(a, b) { return b.contributionScore - a.contributionScore; });
    var topN = expertScores.slice(0, N || 10);
    return topN.map(function(item, index) { return { rank: index + 1, expertId: item.expertId, expertName: item.expertName, totalNotes: item.totalNotes, totalViews: item.totalViews, totalLikes: item.totalLikes, totalShares: item.totalShares, avgRating: item.avgRating, contributionScore: item.contributionScore }; });
}

function getExpertMultiMetricRanking(experts, claims, evaluations, weights, minSample) {
    var E = window.FMStock.metrics.experts;
    if (!experts || !claims) return [];
    var w = weights || { alpha: 0.4, hitRate: 0.3, return: 0.2, volume: 0.1 };
    var min = minSample || 3;
    var validExperts = E.getExpertsWithMinSample(experts, claims, evaluations, min);
    var ranking = validExperts.map(function(expert) {
        var stats = E.getExpertStats(expert.id || expert.expertId, claims, evaluations);
        var normAlpha = stats.avgAlpha != null ? stats.avgAlpha : 0;
        var normHitRate = stats.hitRate != null ? stats.hitRate * 100 : 0;
        var normReturn = stats.avgReturn != null ? Math.max(0, stats.avgReturn) : 0;
        var normVolume = Math.min(stats.verified / 20, 1) * 100;
        var compositeScore = (w.alpha || 0) * normAlpha + (w.hitRate || 0) * normHitRate + (w.return || 0) * normReturn + (w.volume || 0) * normVolume;
        return { expertId: expert.id || expert.expertId, expertName: expert.name || expert.expertName || '', compositeScore: compositeScore, avgAlpha: stats.avgAlpha, hitRate: stats.hitRate, avgReturn: stats.avgReturn, verified: stats.verified, total: stats.total };
    });
    ranking.sort(function(a, b) { return b.compositeScore - a.compositeScore; });
    return ranking.map(function(item, index) { return { rank: index + 1, expertId: item.expertId, expertName: item.expertName, compositeScore: item.compositeScore, avgAlpha: item.avgAlpha, hitRate: item.hitRate, avgReturn: item.avgReturn, verified: item.verified, total: item.total }; });
}

function getClaimDirectionRanking(claims, evaluations, direction, N) {
    if (!claims || claims.length === 0) return [];
    var filtered = claims.filter(function(c) { return c.direction === direction; });
    return getReturnTopRanking(filtered, evaluations, N);
}

function getExpertTrendRanking(experts, claims, evaluations, days, minSample) {
    if (!experts || !claims) return [];
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days || 30));
    var recentClaims = claims.filter(function(c) {
        var d = new Date(c.date || c.createdAt);
        return !isNaN(d.getTime()) && d >= cutoff;
    });
    return getExpertAlphaRanking(experts, recentClaims, evaluations, minSample);
}

window.FMStock.metrics.rankings = {
    getReturnTopRanking: getReturnTopRanking,
    getAlphaTopRanking: getAlphaTopRanking,
    getExpertAlphaRanking: getExpertAlphaRanking,
    getExpertHitRateRanking: getExpertHitRateRanking,
    getIndustryRanking: getIndustryRanking,
    getKnowledgeContributionRanking: getKnowledgeContributionRanking,
    getExpertMultiMetricRanking: getExpertMultiMetricRanking,
    getClaimDirectionRanking: getClaimDirectionRanking,
    getExpertTrendRanking: getExpertTrendRanking
};
