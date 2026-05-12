/**
 * experts-render.js --- Expert detail page DOM rendering
 * Namespace: FMStock.ui.experts.render
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.experts = window.FMStock.ui.experts || {};

function renderExpertDetail(expertId, data) {
    renderExpertHeader(data.expert);
    renderPerformanceSummary(data.stats);
    renderIndustryBreakdown(data.stats ? data.stats.sectorBreakdown : null);
    renderClaimHistory(data.claims, data.evaluations);
    renderTopClaims(data.stats ? data.stats.topClaims : null);
    renderBottomClaims(data.stats ? data.stats.bottomClaims : null);
    renderKnowledgeNotes(data.knowledge);
}

function renderExpertHeader(expert) {
    var container = document.getElementById("expert-header");
    if (!container || !expert) return;
    container.innerHTML = "<div class=\"expert-header-inner\">" +
        "<img class=\"expert-avatar-lg\" src=\"" + escapeHtml(expert.avatar || "/assets/img/default-avatar.png") + "\" alt=\"" + escapeHtml(expert.name) + "\" />" +
        "<div class=\"expert-header-info\">" +
        "<h1>" + escapeHtml(expert.name) + "</h1>" +
        "<span class=\"expert-title\">" + escapeHtml(expert.title || expert.affiliation || "") + "</span>" +
        "<p class=\"expert-bio\">" + escapeHtml(expert.bio || "") + "</p>" +
        "<div class=\"expert-tags\">" +
        "<span class=\"badge badge-" + (expert.type || "").toLowerCase() + "\">" + escapeHtml(expert.type) + "</span>" +
        (expert.industries || expert.sectors || []).map(function(s) { return "<span class=\"sector-tag\">" + escapeHtml(s) + "</span>"; }).join("") +
        "</div></div></div>";
}

function renderPerformanceSummary(stats) {
    var container = document.getElementById("performance-summary");
    if (!container) return;
    if (!stats) { container.innerHTML = "<p class=\"empty\">No stats available.</p>"; return; }
    var metrics = [
        { label: "Total Claims", value: stats.claimCount || 0 },
        { label: "Verified", value: stats.verifiedCount || 0 },
        { label: "Pending", value: stats.pendingCount || 0 },
        { label: "Hit Rate", value: stats.hitRate != null ? (stats.hitRate * 100).toFixed(1) + "%" : "N/A" },
        { label: "Avg Return", value: stats.avgReturn != null ? stats.avgReturn.toFixed(2) + "%" : "N/A" },
        { label: "Best Return", value: stats.bestReturn != null ? stats.bestReturn.toFixed(2) + "%" : "N/A" },
        { label: "Worst Return", value: stats.worstReturn != null ? stats.worstReturn.toFixed(2) + "%" : "N/A" },
        { label: "Avg Alpha", value: stats.avgAlpha != null ? stats.avgAlpha.toFixed(2) + "%" : "N/A" }
    ];
    container.innerHTML = metrics.map(function(m) {
        return "<div class=\"metric-card\"><span class=\"metric-value\">" + m.value + "</span><span class=\"metric-label\">" + m.label + "</span></div>";
    }).join("");
}

function renderIndustryBreakdown(breakdown) {
    var container = document.getElementById("industry-breakdown");
    if (!container) return;
    if (!breakdown || !breakdown.length) { container.innerHTML = "<p class=\"empty\">No industry data.</p>"; return; }
    container.innerHTML = "<table class=\"data-table\"><thead><tr><th>Sector</th><th>Claims</th><th>Hits</th><th>Misses</th><th>Hit Rate</th></tr></thead><tbody>" +
        breakdown.map(function(s) {
            return "<tr><td>" + escapeHtml(s.sector) + "</td><td>" + s.total + "</td><td class=\"positive\">" + s.hits + "</td><td class=\"negative\">" + s.misses + "</td><td>" + (s.hitRate * 100).toFixed(1) + "%</td></tr>";
        }).join("") + "</tbody></table>";
}

function renderClaimHistory(claims, evaluations) {
    var container = document.getElementById("claim-history");
    if (!container) return;
    var evalMap = {};
    for (var ei = 0; ei < (evaluations || []).length; ei++) { evalMap[evaluations[ei].claimId] = evaluations[ei]; }
    if (!claims || !claims.length) { container.innerHTML = "<p class=\"empty\">No claims yet.</p>"; return; }
    container.innerHTML = "<table class=\"data-table\"><thead><tr><th>Date</th><th>Stock</th><th>Direction</th><th>Return</th><th>Alpha</th><th>Verdict</th></tr></thead><tbody>" +
        claims.map(function(c) {
            var ev = evalMap[c.id];
            return "<tr><td>" + (c.date ? new Date(c.date).toLocaleDateString() : "\u2014") + "</td>" +
                "<td>" + escapeHtml(c.stock || c.ticker || "\u2014") + "</td>" +
                "<td>" + escapeHtml(c.direction || "\u2014") + "</td>" +
                "<td class=\"" + ((c.return || 0) >= 0 ? "positive" : "negative") + "\">" + (c.return != null ? c.return.toFixed(2) + "%" : "\u2014") + "</td>" +
                "<td class=\"" + ((ev && ev.alpha || 0) >= 0 ? "positive" : "negative") + "\">" + (ev && ev.alpha != null ? ev.alpha.toFixed(2) + "%" : "\u2014") + "</td>" +
                "<td>" + (ev && ev.verdict ? "<span class=\"verdict verdict-" + ev.verdict.toLowerCase() + "\">" + escapeHtml(ev.verdict) + "</span>" : "\u2014") + "</td></tr>";
        }).join("") + "</tbody></table>";
}

function renderTopClaims(claims) {
    var container = document.getElementById("top-claims");
    if (!container) return;
    if (!claims || !claims.length) { container.innerHTML = "<p class=\"empty\">No top claims.</p>"; return; }
    container.innerHTML = claims.map(function(c, i) {
        return "<div class=\"claim-card claim-top\"><span class=\"claim-rank\">#" + (i + 1) + "</span>" +
            "<span class=\"claim-stock\">" + escapeHtml(c.stock || c.ticker) + "</span>" +
            "<span class=\"claim-return positive\">+" + (c.return != null ? c.return.toFixed(2) : "0") + "%</span></div>";
    }).join("");
}

function renderBottomClaims(claims) {
    var container = document.getElementById("bottom-claims");
    if (!container) return;
    if (!claims || !claims.length) { container.innerHTML = "<p class=\"empty\">No bottom claims.</p>"; return; }
    container.innerHTML = claims.map(function(c, i) {
        return "<div class=\"claim-card claim-bottom\"><span class=\"claim-rank\">#" + (i + 1) + "</span>" +
            "<span class=\"claim-stock\">" + escapeHtml(c.stock || c.ticker) + "</span>" +
            "<span class=\"claim-return negative\">" + (c.return != null ? c.return.toFixed(2) : "0") + "%</span></div>";
    }).join("");
}

function renderKnowledgeNotes(notes) {
    var container = document.getElementById("knowledge-notes");
    if (!container) return;
    if (!notes || !notes.length) { container.innerHTML = "<p class=\"empty\">No knowledge notes.</p>"; return; }
    container.innerHTML = notes.map(function(n) {
        return "<div class=\"knowledge-item\"><h4>" + escapeHtml(n.title) + "</h4>" +
            "<p>" + escapeHtml(n.summary || (n.content ? n.content.slice(0, 200) : "") || "") + "</p>" +
            "<span class=\"knowledge-meta\">" + (n.date ? new Date(n.date).toLocaleDateString() : "") + " \u00b7 " + escapeHtml(n.source || "") + "</span></div>";
    }).join("");
}

function escapeHtml(text) {
    if (typeof text !== "string") return text != null ? text : "";
    var map = { "\u0026": "\u0026amp;", "<": "\u0026lt;", ">": "\u0026gt;", "\"": "\u0026quot;", "'": "\u0026#039;" };
    return text.replace(/[\u0026<>"']/g, function(ch) { return map[ch]; });
}

window.FMStock.ui.experts.render = {
    renderExpertDetail: renderExpertDetail,
    renderExpertHeader: renderExpertHeader,
    renderPerformanceSummary: renderPerformanceSummary,
    renderIndustryBreakdown: renderIndustryBreakdown,
    renderClaimHistory: renderClaimHistory,
    renderTopClaims: renderTopClaims,
    renderBottomClaims: renderBottomClaims,
    renderKnowledgeNotes: renderKnowledgeNotes,
    escapeHtml: escapeHtml
};
