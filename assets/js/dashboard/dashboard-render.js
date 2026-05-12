/**
 * dashboard-render.js — Dashboard DOM rendering
 * Renders summary cards, recent evaluations, top returns,
 * expert ranking, trending topics, and knowledge feed.
 */

/**
 * renderDashboard(data) — Entry point: renders the entire dashboard.
 * @param {Object} data - Dashboard data from backend
 */
export function renderDashboard(data) {
    renderSummaryCards(data);
    renderRecentEvaluations(data);
    renderTopReturns(data);
    renderTopExperts(data);
    renderTrendingTopics(data);
    renderKnowledgeFeed(data);
}

/**
 * renderSummaryCards(data) — Renders the top 9 summary stat cards.
 */
export function renderSummaryCards(data) {
    const container = document.getElementById('summary-cards');
    if (!container) return;
    const stats = [
        { label: 'Sources', value: data.sources?.length ?? 0, icon: '📡' },
        { label: 'Segments', value: data.segments?.length ?? 0, icon: '📂' },
        { label: 'Claims', value: data.claims?.length ?? 0, icon: '💬' },
        { label: 'Verified', value: data.verifiedCount ?? 0, icon: '✅' },
        { label: 'Pending', value: data.pendingCount ?? 0, icon: '⏳' },
        { label: 'Knowledge', value: data.knowledge?.length ?? 0, icon: '📖' },
        { label: 'Avg Return', value: data.avgReturn != null ? `${data.avgReturn.toFixed(2)}%` : 'N/A', icon: '📈' },
        { label: 'Avg Alpha', value: data.avgAlpha != null ? `${data.avgAlpha.toFixed(2)}%` : 'N/A', icon: '⚡' },
        { label: 'Hit Rate', value: data.hitRate != null ? `${(data.hitRate * 100).toFixed(1)}%` : 'N/A', icon: '🎯' },
    ];
    container.innerHTML = stats.map(s => `
        <div class="summary-card">
            <span class="summary-icon">${s.icon}</span>
            <div class="summary-body">
                <span class="summary-value">${s.value}</span>
                <span class="summary-label">${s.label}</span>
            </div>
        </div>
    `).join('');
}

/**
 * renderRecentEvaluations(data) — Renders the most recently verified claims.
 */
export function renderRecentEvaluations(data) {
    const container = document.getElementById('recent-evaluations');
    if (!container) return;
    const items = data.recentEvaluations ?? [];
    if (!items.length) {
        container.innerHTML = '<p class="empty">No recent evaluations.</p>';
        return;
    }
    container.innerHTML = `
        <table class="data-table">
            <thead><tr>
                <th>Speaker</th><th>Stock</th><th>Sector</th>
                <th>Return</th><th>Alpha</th><th>Verdict</th>
            </tr></thead>
            <tbody>${items.map(e => `
                <tr>
                    <td>${escapeHtml(e.speaker)}</td>
                    <td>${escapeHtml(e.stock)}</td>
                    <td>${escapeHtml(e.sector)}</td>
                    <td class="${e.return >= 0 ? 'positive' : 'negative'}">${e.return?.toFixed(2)}%</td>
                    <td class="${e.alpha >= 0 ? 'positive' : 'negative'}">${e.alpha?.toFixed(2)}%</td>
                    <td><span class="verdict verdict-${(e.verdict || '').toLowerCase()}">${escapeHtml(e.verdict)}</span></td>
                </tr>
            `).join('')}</tbody>
        </table>`;
}

/**
 * renderTopReturns(data) — Renders top 10 claims by return (with excess return).
 */
export function renderTopReturns(data) {
    const container = document.getElementById('top-returns');
    if (!container) return;
    const items = data.topReturns ?? [];
    if (!items.length) {
        container.innerHTML = '<p class="empty">No top return data.</p>';
        return;
    }
    container.innerHTML = `
        <table class="data-table">
            <thead><tr><th>#</th><th>Speaker</th><th>Stock</th><th>Return</th><th>Excess Return</th></tr></thead>
            <tbody>${items.map((c, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${escapeHtml(c.speaker)}</td>
                    <td>${escapeHtml(c.stock)}</td>
                    <td class="positive">${c.return?.toFixed(2)}%</td>
                    <td class="${c.excessReturn >= 0 ? 'positive' : 'negative'}">${c.excessReturn?.toFixed(2)}%</td>
                </tr>
            `).join('')}</tbody>
        </table>`;
}

/**
 * renderTopExperts(data) — Renders expert ranking summary.
 */
export function renderTopExperts(data) {
    const container = document.getElementById('top-experts');
    if (!container) return;
    const items = data.topExperts ?? [];
    if (!items.length) {
        container.innerHTML = '<p class="empty">No expert data.</p>';
        return;
    }
    container.innerHTML = items.map((ex, i) => `
        <div class="expert-row">
            <span class="rank">#${i + 1}</span>
            <span class="name">${escapeHtml(ex.name)}</span>
            <span class="stat">Hit: ${(ex.hitRate * 100).toFixed(1)}%</span>
            <span class="stat">α: ${ex.avgAlpha?.toFixed(2)}%</span>
            <span class="stat">Claims: ${ex.claimCount}</span>
        </div>
    `).join('');
}

/**
 * renderTrendingTopics(data) — Renders most-mentioned stocks / sectors.
 */
export function renderTrendingTopics(data) {
    const stocksEl = document.getElementById('trending-stocks');
    const sectorsEl = document.getElementById('trending-sectors');
    const stocks = data.trendingStocks ?? [];
    const sectors = data.trendingSectors ?? [];
    if (stocksEl) {
        stocksEl.innerHTML = stocks.length
            ? stocks.map(s => `<span class="topic-badge">${escapeHtml(s.name)} (${s.count})</span>`).join('')
            : '<p class="empty">No trending stocks.</p>';
    }
    if (sectorsEl) {
        sectorsEl.innerHTML = sectors.length
            ? sectors.map(s => `<span class="topic-badge">${escapeHtml(s.name)} (${s.count})</span>`).join('')
            : '<p class="empty">No trending sectors.</p>';
    }
}

/**
 * renderKnowledgeFeed(data) — Renders recent knowledge notes.
 */
export function renderKnowledgeFeed(data) {
    const container = document.getElementById('knowledge-feed');
    if (!container) return;
    const notes = data.recentKnowledge ?? [];
    if (!notes.length) {
        container.innerHTML = '<p class="empty">No recent knowledge notes.</p>';
        return;
    }
    container.innerHTML = notes.map(n => `
        <div class="knowledge-item">
            <div class="knowledge-header">
                <strong>${escapeHtml(n.title)}</strong>
                <span class="knowledge-date">${n.date ? new Date(n.date).toLocaleDateString() : ''}</span>
            </div>
            <p class="knowledge-preview">${escapeHtml(n.summary || n.content?.slice(0, 120) || '')}</p>
            <span class="knowledge-source">Source: ${escapeHtml(n.source)}</span>
        </div>
    `).join('');
}

/* ── Helpers ── */
function escapeHtml(text) {
    if (typeof text !== 'string') return text ?? '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, ch => map[ch]);
}
