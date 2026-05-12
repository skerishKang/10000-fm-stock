/**
 * experts-list.js --- Expert list page rendering
 * Namespace: FMStock.ui.experts.list
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.experts = window.FMStock.ui.experts || {};

function renderExpertsList(experts, claims, evaluations) {
    var container = document.getElementById("experts-grid");
    if (!container) return;
    container.innerHTML = experts.map(function(ex) {
        var stats = window.FMStock.ui.experts.metrics.getExpertCardStats(ex.id, claims, evaluations);
        return createExpertCard(ex, stats);
    }).join("");
}

function createExpertCard(expert, stats) {
    var sectors = (expert.sectors || expert.industries || []).slice(0, 3).map(function(s) {
        return "<span class=\"sector-tag\">" + escapeHtml(s) + "</span>";
    }).join("");
    return "<div class=\"expert-card\" data-expert-id=\"" + escapeHtml(expert.id) + "\">" +
        "<div class=\"card-header\">" +
        "<img class=\"expert-avatar\" src=\"" + escapeHtml(expert.avatar || "/assets/img/default-avatar.png") + "\" alt=\"" + escapeHtml(expert.name) + "\" loading=\"lazy\" />" +
        "<h3 class=\"expert-name\">" + escapeHtml(expert.name) + "</h3>" +
        "<span class=\"expert-type badge badge-" + (expert.type || "").toLowerCase() + "\">" + escapeHtml(expert.type) + "</span></div>" +
        "<div class=\"card-stats\">" +
        "<div class=\"stat\"><span class=\"stat-label\">Verified</span><span class=\"stat-value\">" + (stats.verifiedCount || 0) + "</span></div>" +
        "<div class=\"stat\"><span class=\"stat-label\">Hit Rate</span><span class=\"stat-value\">" + (stats.hitRate != null ? (stats.hitRate * 100).toFixed(1) + "%" : "N/A") + "</span></div>" +
        "<div class=\"stat\"><span class=\"stat-label\">Avg Alpha</span><span class=\"stat-value\">" + (stats.avgAlpha != null ? stats.avgAlpha.toFixed(2) + "%" : "N/A") + "</span></div>" +
        "<div class=\"stat\"><span class=\"stat-label\">Claims</span><span class=\"stat-value\">" + (stats.claimCount || 0) + "</span></div></div>" +
        "<div class=\"card-sectors\">" + sectors + "</div>" +
        "<a href=\"/pages/experts-detail.html?id=" + encodeURIComponent(expert.id) + "\" class=\"card-link\">View Profile \u2192</a></div>";
}

function filterExperts(experts, filters) {
    return experts.filter(function(ex) {
        if (filters.type && ex.type !== filters.type) return false;
        if (filters.industry && !(ex.industries || ex.sectors || []).includes(filters.industry)) return false;
        if (filters.minVerified != null && (ex.verifiedCount || 0) < filters.minVerified) return false;
        return true;
    });
}

function sortExperts(experts, sortBy) {
    sortBy = sortBy || "hitRate";
    var copy = experts.slice();
    copy.sort(function(a, b) {
        var va = a[sortBy] || 0;
        var vb = b[sortBy] || 0;
        return vb - va;
    });
    return copy;
}

function escapeHtml(text) {
    if (typeof text !== "string") return text != null ? text : "";
    var map = { "\u0026": "\u0026amp;", "<": "\u0026lt;", ">": "\u0026gt;", "\"": "\u0026quot;", "'": "\u0026#039;" };
    return text.replace(/[\u0026<>"']/g, function(ch) { return map[ch]; });
}

window.FMStock.ui.experts.list = {
    renderExpertsList: renderExpertsList,
    createExpertCard: createExpertCard,
    filterExperts: filterExperts,
    sortExperts: sortExperts,
    escapeHtml: escapeHtml
};
