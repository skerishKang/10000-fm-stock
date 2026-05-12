/**
 * experts-metrics.js — Expert data aggregation layer
 * Thin wrapper for card and detail stats computation.
 */

/**
 * getExpertCardStats(expertId, claims, evaluations) — Summary stats for a card.
 * @returns {{ claimCount, verifiedCount, hitRate, avgAlpha, topSector }}
 */
export function getExpertCardStats(expertId, claims, evaluations) {
    const exClaims = (claims ?? []).filter(c => c.expertId === expertId);
    const exEvals = (evaluations ?? []).filter(e => e.expertId === expertId);
    const verified = exEvals.filter(e => e.verdict && e.verdict !== 'Pending');
    const hits = verified.filter(e => e.verdict === 'Hit' || e.verdict === 'Correct');
    return {
        claimCount: exClaims.length,
        verifiedCount: verified.length,
        hitRate: verified.length ? hits.length / verified.length : 0,
        avgAlpha: calcAvg(verified, 'alpha'),
        topSector: getTopSector(exClaims),
    };
}

/**
 * getExpertDetailStats(expertId, claims, evaluations) — Full stats for detail page.
 * @returns {{
 *   claimCount, verifiedCount, pendingCount,
 *   hitRate, avgReturn, avgAlpha,
 *   bestReturn, worstReturn,
 *   sectorBreakdown: { sector, total, hits, misses, hitRate }[],
 *   recentClaims, topClaims, bottomClaims
 * }}
 */
export function getExpertDetailStats(expertId, claims, evaluations) {
    const exClaims = (claims ?? []).filter(c => c.expertId === expertId);
    const exEvals = (evaluations ?? []).filter(e => e.expertId === expertId);
    const verified = exEvals.filter(e => e.verdict && e.verdict !== 'Pending');
    const hits = verified.filter(e => e.verdict === 'Hit' || e.verdict === 'Correct');
    const returns = exClaims.filter(c => c.return != null).map(c => c.return);

    return {
        claimCount: exClaims.length,
        verifiedCount: verified.length,
        pendingCount: exEvals.length - verified.length,
        hitRate: verified.length ? hits.length / verified.length : 0,
        avgReturn: calcAvg(verified, 'return'),
        avgAlpha: calcAvg(verified, 'alpha'),
        bestReturn: returns.length ? Math.max(...returns) : null,
        worstReturn: returns.length ? Math.min(...returns) : null,
        sectorBreakdown: buildSectorBreakdown(exClaims, verified),
        recentClaims: [...exClaims].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20),
        topClaims: [...exClaims].sort((a, b) => (b.return ?? 0) - (a.return ?? 0)).slice(0, 5),
        bottomClaims: [...exClaims].sort((a, b) => (a.return ?? 0) - (b.return ?? 0)).slice(0, 5),
    };
}

/* ── Helpers ── */
function calcAvg(arr, key) {
    if (!arr.length) return 0;
    const sum = arr.reduce((acc, item) => acc + (item[key] ?? 0), 0);
    return sum / arr.length;
}

function getTopSector(claims) {
    const counts = {};
    for (const c of claims) {
        const s = c.industry || c.sector;
        if (s) counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function buildSectorBreakdown(claims, evaluations) {
    const map = {};
    for (const c of claims) {
        const sector = c.industry || c.sector || 'Other';
        if (!map[sector]) map[sector] = { sector, total: 0, hits: 0, misses: 0 };
        map[sector].total++;
    }
    for (const e of evaluations) {
        const sector = e.industry || e.sector || 'Other';
        if (map[sector]) {
            if (e.verdict === 'Hit' || e.verdict === 'Correct') map[sector].hits++;
            if (e.verdict === 'Miss' || e.verdict === 'Incorrect') map[sector].misses++;
        }
    }
    return Object.values(map).map(s => ({
        ...s,
        hitRate: s.total ? s.hits / (s.hits + s.misses) : 0,
    }));
}
