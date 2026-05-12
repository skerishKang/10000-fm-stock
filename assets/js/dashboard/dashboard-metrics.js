/**
 * dashboard-metrics.js — Dashboard data transformation and aggregation
 * Pure functions — no DOM side-effects.
 */

/**
 * getSummaryStats(data) — Aggregate summary statistics from raw data.
 * @param {Object} data - Full dashboard dataset
 * @returns {{ sources, segments, claims, verified, pending, knowledge, avgReturn, avgAlpha, avgHitRate }}
 */
export function getSummaryStats(data) {
    const claims = data.claims ?? [];
    const evaluations = data.evaluations ?? [];
    const verified = evaluations.filter(e => e.verdict && e.verdict !== 'Pending');
    const hitCount = verified.filter(e => e.verdict === 'Hit' || e.verdict === 'Correct').length;

    return {
        sources: (data.sources ?? []).length,
        segments: (data.segments ?? []).length,
        claims: claims.length,
        verified: verified.length,
        pending: evaluations.length - verified.length,
        knowledge: (data.knowledge ?? []).length,
        avgReturn: calcAvg(verified, 'return'),
        avgAlpha: calcAvg(verified, 'alpha'),
        avgHitRate: verified.length ? hitCount / verified.length : 0,
    };
}

/**
 * getRecentEvaluations(data, N = 10) — Latest N verified evaluations sorted by date desc.
 */
export function getRecentEvaluations(data, N = 10) {
    const evals = (data.evaluations ?? [])
        .filter(e => e.verdict && e.verdict !== 'Pending')
        .sort((a, b) => new Date(b.evaluatedAt || b.date) - new Date(a.evaluatedAt || a.date));
    return evals.slice(0, N);
}

/**
 * getTopReturnClaims(data, N = 10) — Top N claims by return.
 */
export function getTopReturnClaims(data, N = 10) {
    return (data.claims ?? [])
        .filter(c => c.return != null)
        .sort((a, b) => (b.return ?? 0) - (a.return ?? 0))
        .slice(0, N)
        .map(c => ({
            ...c,
            excessReturn: (c.return ?? 0) - (c.benchmarkReturn ?? 0),
        }));
}

/**
 * getTrendingStocks(data, N = 10) — Most frequently mentioned stocks.
 */
export function getTrendingStocks(data, N = 10) {
    const counts = {};
    for (const c of data.claims ?? []) {
        const stock = c.stock || c.ticker;
        if (stock) counts[stock] = (counts[stock] || 0) + 1;
    }
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, N)
        .map(([name, count]) => ({ name, count }));
}

/**
 * getTrendingIndustries(data, N = 10) — Most frequently mentioned industries.
 */
export function getTrendingIndustries(data, N = 10) {
    const counts = {};
    for (const c of data.claims ?? []) {
        const ind = c.industry || c.sector;
        if (ind) counts[ind] = (counts[ind] || 0) + 1;
    }
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, N)
        .map(([name, count]) => ({ name, count }));
}

/**
 * getRecentKnowledge(data, N = 10) — Most recent knowledge notes.
 */
export function getRecentKnowledge(data, N = 10) {
    return (data.knowledge ?? [])
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        .slice(0, N);
}

/* ── Helpers ── */
function calcAvg(arr, key) {
    if (!arr.length) return 0;
    const sum = arr.reduce((acc, item) => acc + (item[key] ?? 0), 0);
    return sum / arr.length;
}
