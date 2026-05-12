/**
 * experts-main.js --- Page initialization entry points
 * Namespace: FMStock.ui.experts.main
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.experts = window.FMStock.ui.experts || {};

function initExpertsList() {
    var data = FMStock.app.state.get('data');
    if (!data) {
        console.error("[ExpertsList] FMStock.app.state.get('data') not found");
        return;
    }
    var EL = window.FMStock.ui.experts.list;
    var EM = window.FMStock.ui.experts.metrics;
    var experts = data.experts, claims = data.claims, evaluations = data.evaluations;
    var enriched = experts.map(function(ex) {
        var stats = EM.getExpertCardStats(ex.id, claims, evaluations);
        return Object.assign({}, ex, stats);
    });
    EL.renderExpertsList(enriched, claims, evaluations);
    bindFilterListeners(enriched, claims, evaluations);
    bindSortListener(enriched, claims, evaluations);
}

function initExpertDetail() {
    var expertId = getQueryParam("id");
    if (!expertId) {
        console.error("[ExpertDetail] Missing id query parameter");
        var el = document.getElementById("expert-header");
        if (el) el.insertAdjacentHTML("afterbegin", "<div class=\"error-banner\">Error: No expert ID specified in URL.</div>");
        return;
    }
    var data = FMStock.app.state.get('data');
    if (!data) {
        console.error("[ExpertDetail] FMStock.app.state.get('data') not found");
        return;
    }
    var expert = (data.experts || []).find(function(ex) { return ex.id === expertId; });
    if (!expert) {
        console.error("[ExpertDetail] Expert " + expertId + " not found");
        var el = document.getElementById("expert-header");
        if (el) el.insertAdjacentHTML("afterbegin", "<div class=\"error-banner\">Error: Expert not found.</div>");
        return;
    }
    var EM = window.FMStock.ui.experts.metrics;
    var ER = window.FMStock.ui.experts.render;
    var stats = EM.getExpertDetailStats(expertId, data.claims, data.evaluations);
    ER.renderExpertDetail(expertId, {
        expert: expert,
        claims: (data.claims || []).filter(function(c) { return c.expertId === expertId; }),
        evaluations: (data.evaluations || []).filter(function(e) { return e.expertId === expertId; }),
        knowledge: (data.knowledge || []).filter(function(k) { return k.expertId === expertId; }),
        stats: stats
    });
}

function bindFilterListeners(enriched, claims, evaluations) {
    var EL = window.FMStock.ui.experts.list;
    var typeFilter = document.getElementById("filter-type");
    var industryFilter = document.getElementById("filter-industry");
    var applyBtn = document.getElementById("apply-filters");
    var apply = function() {
        var filters = {};
        if (typeFilter && typeFilter.value) filters.type = typeFilter.value;
        if (industryFilter && industryFilter.value) filters.industry = industryFilter.value;
        var filtered = EL.filterExperts(enriched, filters);
        EL.renderExpertsList(filtered, claims, evaluations);
    };
    if (applyBtn) applyBtn.addEventListener("click", apply);
    if (typeFilter) typeFilter.addEventListener("change", apply);
    if (industryFilter) industryFilter.addEventListener("change", apply);
}

function bindSortListener(enriched, claims, evaluations) {
    var EL = window.FMStock.ui.experts.list;
    var sortSelect = document.getElementById("sort-experts");
    if (sortSelect) {
        sortSelect.addEventListener("change", function() {
            var sorted = EL.sortExperts(enriched, sortSelect.value);
            EL.renderExpertsList(sorted, claims, evaluations);
        });
    }
}

function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
}

window.FMStock.ui.experts.main = {
    initExpertsList: initExpertsList,
    initExpertDetail: initExpertDetail
};
