/**
 * experts-list.js — Expert list page rendering
 * Renders expert cards with filtering and sorting.
 */

import { getExpertCardStats } from './experts-metrics.js';
import { escapeHtml } from './experts-render.js';

/**
 * renderExpertsList(experts, claims, evaluations) — Renders the full expert card grid.
 */
export function renderExpertsList(experts, claims, evaluations) {
    const container = document.getElementById('experts-grid');
    if (!container) return;
    container.innerHTML = experts.map(ex => {
        const stats = getExpertCardStats(ex.id, claims, evaluations);
        return createExpertCard(ex, stats);
    }).join('');
}

/**
 * createExpertCard(expert, stats) — Builds a single expert card HTML string.
 */
export function createExpertCard(expert, stats) {
    return `
        <div class="expert-card" data-expert-id="${escapeHtml(expert.id)}">
            <div class="card-header">
                <img class="expert-avatar" src="${escapeHtml(expert.avatar || '/assets/img/default-avatar.png')}" alt="${escapeHtml(expert.name)}" loading="lazy" />
                <h3 class="expert-name">${escapeHtml(expert.name)}</h3>
                <span class="expert-type badge badge-${(expert.type || '').toLowerCase()}">${escapeHtml(expert.type)}</span>
            </div>
            <div class="card-stats">
                <div class="stat"><span class="stat-label">Verified</span><span class="stat-value">${stats.verifiedCount ?? 0}</span></div>
                <div class="stat"><span class="stat-label">Hit Rate</span><span class="stat-value">${stats.hitRate != null ? (stats.hitRate * 100).toFixed(1) + '%' : 'N/A'}</span></div>
                <div class="stat"><span class="stat-label">Avg Alpha</span><span class="stat-value">${stats.avgAlpha != null ? stats.avgAlpha.toFixed(2) + '%' : 'N/A'}</span></div>
                <div class="stat"><span class="stat-label">Claims</span><span class="stat-value">${stats.claimCount ?? 0}</span></div>
            </div>
            <div class="card-sectors">
                ${(expert.sectors || expert.industries || []).slice(0, 3).map(s => `<span class="sector-tag">${escapeHtml(s)}</span>`).join('')}
            </div>
            <a href="/experts-detail.html?id=${encodeURIComponent(expert.id)}" class="card-link">View Profile →</a>
        </div>
    `;
}

/**
 * filterExperts(experts, filters) — Filters experts by type, industry, and min verification count.
 * @param {Object[]} experts
 * @param {{ type?: string, industry?: string, minVerified?: number }} filters
 * @returns {Object[]} Filtered experts
 */
export function filterExperts(experts, filters) {
    return experts.filter(ex => {
        if (filters.type && ex.type !== filters.type) return false;
        if (filters.industry && !(ex.industries || ex.sectors || []).includes(filters.industry)) return false;
        if (filters.minVerified != null && (ex.verifiedCount ?? 0) < filters.minVerified) return false;
        return true;
    });
}

/**
 * sortExperts(experts, sortBy) — Sorts experts by the given criterion.
 * @param {Object[]} experts
 * @param {'hitRate'|'avgAlpha'|'verifiedCount'} sortBy
 * @returns {Object[]} Sorted (descending)
 */
export function sortExperts(experts, sortBy = 'hitRate') {
    const copy = [...experts];
    copy.sort((a, b) => {
        const va = a[sortBy] ?? 0;
        const vb = b[sortBy] ?? 0;
        return vb - va;
    });
    return copy;
}
