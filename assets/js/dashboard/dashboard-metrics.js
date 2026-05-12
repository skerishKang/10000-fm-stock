/**
 * dashboard-metrics.js --- Dashboard data transformation and aggregation
 * Pure functions - no DOM side-effects.
 * Namespace: FMStock.ui.dashboard.metrics
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.dashboard = window.FMStock.ui.dashboard || {};

function getSummaryStats(data) {
    var claims = data.claims || [];
    var evaluations = data.evaluations || [];
    var verified = evaluations.filter(function(e) { return e.verdict && e.verdict !== "Pending"; });
    var hitCount = verified.filter(function(e) { return e.verdict === "Hit" || e.verdict === "Correct"; }).length;
    return {
        sources: (data.sources || []).length,
        segments: (data.segments || []).length,
        claims: claims.length,
        verified: verified.length,
        pending: evaluations.length - verified.length,
        knowledge: (data.knowledge || []).length,
        avgReturn: calcAvg(verified, "return"),
        avgAlpha: calcAvg(verified, "alpha"),
        avgHitRate: verified.length ? hitCount / verified.length : 0
    };
}

function getRecentEvaluations(data, N) {
    N = N || 10;
    return (data.evaluations || [])
        .filter(function(e) { return e.verdict && e.verdict !== "Pending"; })
        .sort(function(a, b) { return new Date(b.evaluatedAt || b.date) - new Date(a.evaluatedAt || a.date); })
        .slice(0, N);
}

function getTopReturnClaims(data, N) {
    N = N || 10;
    return (data.claims || [])
        .filter(function(c) { return c.return != null; })
        .sort(function(a, b) { return (b.return || 0) - (a.return || 0); })
        .slice(0, N)
        .map(function(c) {
            return { claimId: c.id, speaker: c.speaker, stock: c.stock, "return": c.return, benchmarkReturn: c.benchmarkReturn || 0, excessReturn: (c.return || 0) - (c.benchmarkReturn || 0) };
        });
}

function getTrendingStocks(data, N) {
    N = N || 10;
    var counts = {};
    for (var ci = 0; ci < (data.claims || []).length; ci++) {
        var stock = data.claims[ci].stock || data.claims[ci].ticker;
        if (stock) counts[stock] = (counts[stock] || 0) + 1;
    }
    return Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, N).map(function(item) { return { name: item[0], count: item[1] }; });
}

function getTrendingIndustries(data, N) {
    N = N || 10;
    var counts = {};
    for (var ci = 0; ci < (data.claims || []).length; ci++) {
        var ind = data.claims[ci].industry || data.claims[ci].sector;
        if (ind) counts[ind] = (counts[ind] || 0) + 1;
    }
    return Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, N).map(function(item) { return { name: item[0], count: item[1] }; });
}

function getRecentKnowledge(data, N) {
    N = N || 10;
    return (data.knowledge || []).sort(function(a, b) { return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date); }).slice(0, N);
}

function calcAvg(arr, key) {
    if (!arr.length) return 0;
    var sum = arr.reduce(function(acc, item) { return acc + (item[key] || 0); }, 0);
    return sum / arr.length;
}

window.FMStock.ui.dashboard.metrics = {
    getSummaryStats: getSummaryStats,
    getRecentEvaluations: getRecentEvaluations,
    getTopReturnClaims: getTopReturnClaims,
    getTrendingStocks: getTrendingStocks,
    getTrendingIndustries: getTrendingIndustries,
    getRecentKnowledge: getRecentKnowledge
};
