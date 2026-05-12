/**
 * experts-render.js — Expert detail page DOM rendering
 * Renders header, performance summary, industry breakdown,
 * claim history, top/bottom claims, and knowledge notes.
 */

/**
 * renderExpertDetail(expert, data) — Entry point for the detail page.
 * @param {string} expertId
 * @param {{ expert, claims, evaluations, knowledge }} data
 */
export function renderExpertDetail(expertId, data) {
    renderExpertHeader(data.expert);
    renderPerformanceSummary(data.stats);
    renderIndustryBreakdown(data.stats?.sectorBreakdown);
    renderClaimHistory(data.claims, data.evaluations);
    renderTopClaims(data.stats?.topClaims);
    renderBottomClaims(data.stats?.bottomClaims);
    renderKnowledgeNotes(data.knowledge);
}

/**
 * renderExpertHeader(expert) — Renders the expert's profile header.
 */
export function renderExpertHeader(expert) {
    const container = document.getElementById('expert-header');
    if (!container || !expert) return;
    container.innerHTML = `
        <div class="expert-header-inner">
            <img class="expert-avatar-lg" src="${escapeHtml(expert.avatar || '/assets/img/default-avatar.png')}" alt="${escapeHtml(expert.name)}" />
            <div class="expert-header-info">
                <h1>${escapeHtml(expert.name)}</h1>
                <span class="expert-title">${escapeHtml(expert.title || expert.affiliation || '')}</span>
                <p class="expert-bio">${escapeHtml(expert.bio || '')}</p>
                <div class="expert-tags">
                    <span class="badge badge-${(expert.type || '').toLowerCase()}">${escapeHtml(expert.type)}</span>
                    ${(expert.industries || expert.sectors || []).map(s => `<span class="sector-tag">${escapeHtml(s)}</span>`).join('')}
                </div>
            </div>
        </div>`;
}

/**
 * renderPerformanceSummary(stats) — Renders the 9-metric performance summary.
 */
export function renderPerformanceSummary(stats) {
    const container = document.getElementById('performance-summary');
    if (!container) return;
    if (!stats) { container.innerHTML = '<p class="empty">No stats available.</p>'; return; }
    const metrics = [
        { label: 'Total Claims', value: stats.claimCount ?? 0 },
        { label: 'Verified', value: stats.verifiedCount ?? 0 },
        { label: 'Pending', value: stats.pendingCount ?? 0 },
        { label: 'Hit Rate', value: stats.hitRate != null ? (stats.hitRate * 100).toFixed(1) + '%' : 'N/A' },
        { label: 'Avg Return', value: stats.avgReturn != null ? stats.avgReturn.toFixed(2) + '%' : 'N/A' },
        { label: 'Best Return', value: stats.bestReturn != null ? stats.bestReturn.toFixed(2) + '%' : 'N/A' },
        { label: 'Worst Return', value: stats.worstReturn != null ? stats.worstReturn.toFixed(2) + '%' : 'N/A' },
        { label: 'Avg Alpha', value: stats.avgAlpha != null ? stats.avgAlpha.toFixed(2) + '%' : 'N/A' },
    ];
    container.innerHTML = metrics.map(m => `
        <div class="metric-card">
            <span class="metric-value">${m.value}</span>
            <span class="metric-label">${m.label}</span>
        </div>
    `).join('');
}

/**
 * renderIndustryBreakdown(breakdown) — Renders the sector strength/weakness table.
 */
export function renderIndustryBreakdown(breakdown) {
    const container = document.getElementById('industry-breakdown');
    if (!container) return;
    if (!breakdown?.length) {
        container.innerHTML = '<p class="empty">No industry data.</p>';
        return;
    }
    container.innerHTML = `
        <table class="data-table">
            <thead><tr><th>Sector</th><th>Claims</th><th>Hits</th><th>Misses</th><th>Hit Rate</th></tr></thead>
            <tbody>${breakdown.map(s => `
                <tr>
                    <td>${escapeHtml(s.sector)}</td>
                    <td>${s.total}</td>
                    <td class="positive">${s.hits}</td>
                    <td class="negative">${s.misses}</td>
                    <td>${(s.hitRate * 100).toFixed(1)}%</td>
                </tr>
            `).join('')}</tbody>
        </table>`;
}

/**
 * renderClaimHistory(claims, evaluations) — Renders the full claim history table.
 */
export function renderClaimHistory(claims, evaluations) {
    const container = document.getElementById('claim-history');
    if (!container) return;
    const evalMap = {};
    for (const e of evaluations ?? []) evalMap[e.claimId] = e;

    if (!claims?.length) {
        container.innerHTML = '<p class="empty">No claims yet.</p>';
        return;
    }
    container.innerHTML = `
        <table class="data-table">
            <thead><tr>
                <th>Date</th><th>Stock</th><th>Direction</th><th>Return</th><th>Alpha</th><th>Verdict</th>
            </tr></thead>
            <tbody>${claims.map(c => {
                const ev = evalMap[c.id];
                return `<tr>
                    <td>${c.date ? new Date(c.date).toLocaleDateString() : '—'}</td>
                    <td>${escapeHtml(c.stock || c.ticker || '—')}</td>
                    <td>${escapeHtml(c.direction || '—')}</td>
                    <td class="${(c.return ?? 0) >= 0 ? 'positive' : 'negative'}">${c.return != null ? c.return.toFixed(2) + '%' : '—'}</td>
                    <td class="${(ev?.alpha ?? 0) >= 0 ? 'positive' : 'negative'}">${ev?.alpha != null ? ev.alpha.toFixed(2) + '%' : '—'}</td>
                    <td>${ev?.verdict ? `<span class="verdict verdict-${ev.verdict.toLowerCase()}">${escapeHtml(ev.verdict)}</span>` : '—'}</td>
                </tr>`;
            }).join('')}</tbody>
        </table>`;
}

/**
 * renderTopClaims(claims) — Renders the expert's best calls.
 */
export function renderTopClaims(claims) {
    const container = document.getElementById('top-claims');
    if (!container) return;
    if (!claims?.length) {
        container.innerHTML = '<p class="empty">No top claims.</p>';
        return;
    }
    container.innerHTML = claims.map((c, i) => `
        <div class="claim-card claim-top">
            <span class="claim-rank">#${i + 1}</span>
            <span class="claim-stock">${escapeHtml(c.stock || c.ticker)}</span>
            <span class="claim-return positive">+${c.return?.toFixed(2)}%</span>
        </div>
    `).join('');
}

/**
 * renderBottomClaims(claims) — Renders the expert's worst calls.
 */
export function renderBottomClaims(claims) {
    const container = document.getElementById('bottom-claims');
    if (!container) return;
    if (!claims?.length) {
        container.innerHTML = '<p class="empty">No bottom claims.</p>';
        return;
    }
    container.innerHTML = claims.map((c, i) => `
        <div class="claim-card claim-bottom">
            <span class="claim-rank">#${i + 1}</span>
            <span class="claim-stock">${escapeHtml(c.stock || c.ticker)}</span>
            <span class="claim-return negative">${c.return?.toFixed(2)}%</span>
        </div>
    `).join('');
}

/**
 * renderKnowledgeNotes(notes) — Renders related knowledge notes.
 */
export function renderKnowledgeNotes(notes) {
    const container = document.getElementById('knowledge-notes');
    if (!container) return;
    if (!notes?.length) {
        container.innerHTML = '<p class="empty">No knowledge notes.</p>';
        return;
    }
    container.innerHTML = notes.map(n => `
        <div class="knowledge-item">
            <h4>${escapeHtml(n.title)}</h4>
            <p>${escapeHtml(n.summary || n.content?.slice(0, 200) || '')}</p>
            <span class="knowledge-meta">${n.date ? new Date(n.date).toLocaleDateString() : ''} · ${escapeHtml(n.source || '')}</span>
        </div>
    `).join('');
}

/* ── Helpers ── */
export function escapeHtml(text) {
    if (typeof text !== 'string') return text ?? '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, ch => map[ch]);
}
