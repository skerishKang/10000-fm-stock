/**
 * metrics-experts.js — Expert statistics calculation modules
 * Namespace: FMStock.metrics.experts
 */

window.FMStock = window.FMStock || {};
window.FMStock.metrics = window.FMStock.metrics || {};

function median(values) {
    if (!values || values.length === 0) return null;
    var sorted = values.filter(function(v) { return v != null; }).sort(function(a, b) { return a - b; });
    if (sorted.length === 0) return null;
    var mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
    return sorted[mid];
}

function getExpertClaims(expertId, claims) {
    if (!expertId || !claims || claims.length === 0) return [];
    return claims.filter(function(c) {
        return String(c.expertId) === String(expertId) || String(c.expert_id) === String(expertId);
    });
}

function getExpertStats(expertId, claims, evaluations) {
    var R = window.FMStock.metrics.returns;
    var expertClaims = getExpertClaims(expertId, claims);
    var total = expertClaims.length;
    if (total === 0) {
        return { expertId: expertId, total: 0, verified: 0, hitRate: null, avgReturn: null, medianReturn: null, avgAlpha: null, medianAlpha: null, targetAchievementRate: null, industryBreakdown: {} };
    }
    var verified = 0, hits = 0, partialHits = 0;
    var returns = [], alphas = [];
    for (var ci = 0; ci < expertClaims.length; ci++) {
        var claim = expertClaims[ci];
        var evals = evaluations ? evaluations.filter(function(e) {
            return String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id);
        }) : [];
        var result = R.determineResult(claim, evals);
        var returnRate = R.getDefaultReturn(claim, evals);
        var normalizedReturn = R.normalizeReturnsByDirection(returnRate, claim.direction);
        if (returnRate != null) {
            verified++;
            returns.push(normalizedReturn != null ? normalizedReturn : returnRate);
            var alpha = R.calculateAlpha(returnRate, claim.benchmarkReturn || 0);
            if (alpha != null) alphas.push(alpha);
        }
        if (result.result === 'hit') hits++;
        if (result.result === 'partial_hit') partialHits++;
    }
    var hitRate = verified > 0 ? (hits + partialHits) / verified : null;
    var avgReturn = returns.length > 0 ? returns.reduce(function(a, b) { return a + b; }, 0) / returns.length : null;
    var medReturn = median(returns);
    var avgAlpha = alphas.length > 0 ? alphas.reduce(function(a, b) { return a + b; }, 0) / alphas.length : null;
    var medAlpha = median(alphas);
    var targetAchievementRate = total > 0 ? hits / total : null;
    var industryBreakdown = getIndustryBreakdown(expertId, claims, evaluations);
    return { expertId: expertId, total: total, verified: verified, hitRate: hitRate, avgReturn: avgReturn, medianReturn: medReturn, avgAlpha: avgAlpha, medianAlpha: medAlpha, targetAchievementRate: targetAchievementRate, industryBreakdown: industryBreakdown };
}

function getIndustryBreakdown(expertId, claims, evaluations) {
    var R = window.FMStock.metrics.returns;
    var expertClaims = getExpertClaims(expertId, claims);
    if (expertClaims.length === 0) return {};
    var industries = {};
    for (var ci = 0; ci < expertClaims.length; ci++) {
        var claim = expertClaims[ci];
        var industry = claim.industry || claim.sector || 'Unknown';
        if (!industries[industry]) {
            industries[industry] = { total: 0, verified: 0, hits: 0, partialHits: 0, returns: [], alphas: [] };
        }
        var ind = industries[industry];
        ind.total++;
        var evals = evaluations ? evaluations.filter(function(e) {
            return String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id);
        }) : [];
        var returnRate = R.getDefaultReturn(claim, evals);
        var result = R.determineResult(claim, evals);
        var normalizedReturn = R.normalizeReturnsByDirection(returnRate, claim.direction);
        if (returnRate != null) {
            ind.verified++;
            ind.returns.push(normalizedReturn != null ? normalizedReturn : returnRate);
            var alpha = R.calculateAlpha(returnRate, claim.benchmarkReturn || 0);
            if (alpha != null) ind.alphas.push(alpha);
        }
        if (result.result === 'hit') ind.hits++;
        if (result.result === 'partial_hit') ind.partialHits++;
    }
    var breakdown = {};
    var indKeys = Object.keys(industries);
    for (var ii = 0; ii < indKeys.length; ii++) {
        var indName = indKeys[ii];
        var data = industries[indName];
        var avgReturn = data.returns.length > 0 ? data.returns.reduce(function(a, b) { return a + b; }, 0) / data.returns.length : null;
        var avgAlpha = data.alphas.length > 0 ? data.alphas.reduce(function(a, b) { return a + b; }, 0) / data.alphas.length : null;
        var hitRate = data.verified > 0 ? (data.hits + data.partialHits) / data.verified : null;
        breakdown[indName] = { total: data.total, verified: data.verified, hits: data.hits, partialHits: data.partialHits, hitRate: hitRate, avgReturn: avgReturn, avgAlpha: avgAlpha };
    }
    return breakdown;
}

function getTopClaims(expertId, claims, evaluations, N) {
    var R = window.FMStock.metrics.returns;
    var expertClaims = getExpertClaims(expertId, claims);
    if (expertClaims.length === 0) return [];
    var scored = [];
    for (var ci = 0; ci < expertClaims.length; ci++) {
        var claim = expertClaims[ci];
        var evals = evaluations ? evaluations.filter(function(e) {
            return String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id);
        }) : [];
        var returnRate = R.getDefaultReturn(claim, evals);
        var normalizedReturn = R.normalizeReturnsByDirection(returnRate, claim.direction);
        var result = R.determineResult(claim, evals);
        var alpha = R.calculateAlpha(returnRate, claim.benchmarkReturn || 0);
        var accuracy = result.result === 'hit' ? 1 : result.result === 'partial_hit' ? 0.5 : 0;
        var score = accuracy * 100 + (normalizedReturn != null ? Math.max(0, normalizedReturn) : 0) + (alpha != null ? Math.max(0, alpha) : 0);
        scored.push({ claim: claim, returnRate: returnRate, normalizedReturn: normalizedReturn, alpha: alpha, result: result.result, score: score });
    }
    scored.sort(function(a, b) { return b.score - a.score; });
    var topN = scored.slice(0, N || 10);
    return topN.map(function(item, index) {
        return { rank: index + 1, claimId: item.claim.id || item.claim._id, title: item.claim.title || item.claim.content || '', returnRate: item.returnRate, normalizedReturn: item.normalizedReturn, alpha: item.alpha, result: item.result, score: item.score };
    });
}

function getBottomClaims(expertId, claims, evaluations, N) {
    var R = window.FMStock.metrics.returns;
    var expertClaims = getExpertClaims(expertId, claims);
    if (expertClaims.length === 0) return [];
    var scored = [];
    for (var ci = 0; ci < expertClaims.length; ci++) {
        var claim = expertClaims[ci];
        var evals = evaluations ? evaluations.filter(function(e) {
            return String(e.claimId) === String(claim.id) || String(e.claim_id) === String(claim.id);
        }) : [];
        var returnRate = R.getDefaultReturn(claim, evals);
        var normalizedReturn = R.normalizeReturnsByDirection(returnRate, claim.direction);
        var result = R.determineResult(claim, evals);
        var alpha = R.calculateAlpha(returnRate, claim.benchmarkReturn || 0);
        var accuracy = result.result === 'hit' ? 1 : result.result === 'partial_hit' ? 0.5 : 0;
        var penalty = accuracy === 0 ? 50 : 0;
        var lossPenalty = (normalizedReturn != null && normalizedReturn < 0) ? Math.abs(normalizedReturn) : 0;
        var negativeAlpha = (alpha != null && alpha < 0) ? Math.abs(alpha) : 0;
        var score = penalty + lossPenalty + negativeAlpha;
        scored.push({ claim: claim, returnRate: returnRate, normalizedReturn: normalizedReturn, alpha: alpha, result: result.result, score: score });
    }
    scored.sort(function(a, b) { return b.score - a.score; });
    var bottomN = scored.slice(0, N || 10);
    return bottomN.map(function(item, index) {
        return { rank: index + 1, claimId: item.claim.id || item.claim._id, title: item.claim.title || item.claim.content || '', returnRate: item.returnRate, normalizedReturn: item.normalizedReturn, alpha: item.alpha, result: item.result, score: item.score };
    });
}

function getExpertsList(claims) {
    if (!claims || claims.length === 0) return [];
    var expertMap = {};
    for (var ci = 0; ci < claims.length; ci++) {
        var claim = claims[ci];
        var eid = claim.expertId || claim.expert_id;
        var ename = claim.expertName || claim.expert_name || claim.expert || '';
        if (eid != null && !expertMap[String(eid)]) {
            expertMap[String(eid)] = { id: eid, name: ename, claimCount: 0 };
        }
        if (eid != null) {
            var entry = expertMap[String(eid)];
            if (entry) entry.claimCount++;
        }
    }
    var result = [];
    var keys = Object.keys(expertMap);
    for (var ki = 0; ki < keys.length; ki++) {
        result.push(expertMap[keys[ki]]);
    }
    return result;
}

function getExpertsWithMinSample(experts, claims, evaluations, minSample) {
    var min = minSample || 3;
    return experts.filter(function(expert) {
        var stats = getExpertStats(expert.id, claims, evaluations);
        return stats.verified >= min;
    });
}

window.FMStock.metrics.experts = {
    median: median,
    getExpertClaims: getExpertClaims,
    getExpertStats: getExpertStats,
    getIndustryBreakdown: getIndustryBreakdown,
    getTopClaims: getTopClaims,
    getBottomClaims: getBottomClaims,
    getExpertsList: getExpertsList,
    getExpertsWithMinSample: getExpertsWithMinSample
};
