/**
 * experts-main.js — Page initialization entry points
 * Initializes experts list page and expert detail page.
 */

import { renderExpertsList, filterExperts, sortExperts } from './experts-list.js';
import { getExpertCardStats, getExpertDetailStats } from './experts-metrics.js';
import { renderExpertDetail } from './experts-render.js';

/**
 * initExpertsList() — Initializes the experts list page (experts.html).
 * Reads data from a global __DATA__ variable and renders the grid.
 * Attaches filter/sort event listeners.
 */
export function initExpertsList() {
    const data = window.__DATA__;
    if (!data) {
        console.error('[ExpertsList] window.__DATA__ not found');
        return;
    }
    const { experts, claims, evaluations } = data;

    // Attach stats to each expert for filtering/sorting
    const enriched = experts.map(ex => ({
        ...ex,
        ...getExpertCardStats(ex.id, claims, evaluations),
    }));

    renderExpertsList(enriched, claims, evaluations);
    bindFilterListeners(enriched, claims, evaluations);
    bindSortListener(enriched, claims, evaluations);
}

/**
 * initExpertDetail() — Initializes the expert detail page (experts-detail.html).
 * Reads expert ID from URL query param ?id=, fetches or loads data from __DATA__.
 */
export function initExpertDetail() {
    const expertId = getQueryParam('id');
    if (!expertId) {
        console.error('[ExpertDetail] Missing "id" query parameter');
        document.getElementById('expert-header')?.insertAdjacentHTML(
            'afterbegin',
            '<div class="error-banner">Error: No expert ID specified in URL.</div>'
        );
        return;
    }

    const data = window.__DATA__;
    if (!data) {
        console.error('[ExpertDetail] window.__DATA__ not found');
        return;
    }

    const expert = (data.experts ?? []).find(ex => ex.id === expertId);
    if (!expert) {
        console.error(`[ExpertDetail] Expert "${expertId}" not found`);
        document.getElementById('expert-header')?.insertAdjacentHTML(
            'afterbegin',
            '<div class="error-banner">Error: Expert not found.</div>'
        );
        return;
    }

    const stats = getExpertDetailStats(expertId, data.claims, data.evaluations);
    renderExpertDetail(expertId, {
        expert,
        claims: (data.claims ?? []).filter(c => c.expertId === expertId),
        evaluations: (data.evaluations ?? []).filter(e => e.expertId === expertId),
        knowledge: (data.knowledge ?? []).filter(k => k.expertId === expertId),
        stats,
    });
}

/* ── Internal Helpers ── */

function bindFilterListeners(enriched, claims, evaluations) {
    const typeFilter = document.getElementById('filter-type');
    const industryFilter = document.getElementById('filter-industry');
    const applyBtn = document.getElementById('apply-filters');

    const apply = () => {
        const filters = {};
        if (typeFilter?.value) filters.type = typeFilter.value;
        if (industryFilter?.value) filters.industry = industryFilter.value;
        const filtered = filterExperts(enriched, filters);
        renderExpertsList(filtered, claims, evaluations);
    };

    applyBtn?.addEventListener('click', apply);
    typeFilter?.addEventListener('change', apply);
    industryFilter?.addEventListener('change', apply);
}

function bindSortListener(enriched, claims, evaluations) {
    const sortSelect = document.getElementById('sort-experts');
    sortSelect?.addEventListener('change', () => {
        const sorted = sortExperts(enriched, sortSelect.value);
        renderExpertsList(sorted, claims, evaluations);
    });
}

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}
