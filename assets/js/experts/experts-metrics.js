/**
 * experts-metrics.js --- Expert data aggregation layer
 * Namespace: FMStock.ui.experts.metrics
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.experts = window.FMStock.ui.experts || {};

function getExpertCardStats(expertId, claims, evaluations) {
    var exClaims = (claims || []).filter(function(c) { return c.expertId === expertId; });
    var exEvals = (evaluations || []).filter(function(e) { return e.expertId === expertId; });
    var verified = exEvals.filter(function(e) { return e.verdict && e.verdict !== "Pending"; });
    var hits = verified.filter(function(e) { return e.verdict === "Hit" || e.verdict === "Correct"; });
    return {
        claimCount: exClaims.length,
        verifiedCount: verified.length,
        hitRate: verified.length ? hits.length / verified.length : 0,
        avgAlpha: calcAvg(verified, "alpha"),
        topSector: getTopSector(exClaims)
    };
}

function getExpertDetailStats(expertId, claims, evaluations) {
    var exClaims = (claims || []).filter(function(c) { return c.expertId === expertId; });
    var exEvals = (evaluations || []).filter(function(e) { return e.expertId === expertId; });
    var verified = exEvals.filter(function(e) { return e.verdict && e.verdict !== "Pending"; });
    var hits = verified.filter(function(e) { return e.verdict === "Hit" || e.verdict === "Correct"; });
    var returns = exClaims.filter(function(c) { return c.return != null; }).map(function(c) { return c.return; });
    return {
        claimCount: exClaims.length,
        verifiedCount: verified.length,
        pendingCount: exEvals.length - verified.length,
        hitRate: verified.length ? hits.length / verified.length : 0,
        avgReturn: calcAvg(verified, "return"),
        avgAlpha: calcAvg(verified, "alpha"),
        bestReturn: returns.length ? Math.max.apply(null, returns) : null,
        worstReturn: returns.length ? Math.min.apply(null, returns) : null,
        sectorBreakdown: buildSectorBreakdown(exClaims, verified),
        recentClaims: exClaims.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 20),
        topClaims: exClaims.slice().sort(function(a, b) { return (b.return || 0) - (a.return || 0); }).slice(0, 5),
        bottomClaims: exClaims.slice().sort(function(a, b) { return (a.return || 0) - (b.return || 0); }).slice(0, 5)
    };
}

function calcAvg(arr, key) {
    if (!arr.length) return 0;
    var sum = arr.reduce(function(acc, item) { return acc + (item[key] || 0); }, 0);
    return sum / arr.length;
}

function getTopSector(claims) {
    var counts = {};
    for (var ci = 0; ci < claims.length; ci++) {
        var s = claims[ci].industry || claims[ci].sector;
        if (s) counts[s] = (counts[s] || 0) + 1;
    }
    var entries = Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; });
    return entries[0] ? entries[0][0] : null;
}

function buildSectorBreakdown(claims, evaluations) {
    var map = {};
    for (var ci = 0; ci < claims.length; ci++) {
        var sector = claims[ci].industry || claims[ci].sector || "Other";
        if (!map[sector]) map[sector] = { sector: sector, total: 0, hits: 0, misses: 0 };
        map[sector].total++;
    }
    for (var ei = 0; ei < evaluations.length; ei++) {
        var e = evaluations[ei];
        var sector = e.industry || e.sector || "Other";
        if (map[sector]) {
            if (e.verdict === "Hit" || e.verdict === "Correct") map[sector].hits++;
            if (e.verdict === "Miss" || e.verdict === "Incorrect") map[sector].misses++;
        }
    }
    var result = [];
    var keys = Object.keys(map);
    for (var ki = 0; ki < keys.length; ki++) {
        var s = map[keys[ki]];
        result.push({ sector: s.sector, total: s.total, hits: s.hits, misses: s.misses, hitRate: s.total ? s.hits / (s.hits + s.misses) : 0 });
    }
    return result;
}

window.FMStock.ui.experts.metrics = {
    getExpertCardStats: getExpertCardStats,
    getExpertDetailStats: getExpertDetailStats
};
