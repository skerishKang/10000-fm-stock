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
    if (!stats) { container.replaceChildren(); var p = document.createElement("p"); p.className = "empty"; p.textContent = "No stats available."; container.appendChild(p); return; }
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
    container.replaceChildren();
    metrics.forEach(function(m) {
        var card = document.createElement("div");
        card.className = "metric-card";
        var value = document.createElement("span");
        value.className = "metric-value";
        value.textContent = m.value;
        card.appendChild(value);
        var label = document.createElement("span");
        label.className = "metric-label";
        label.textContent = m.label;
        card.appendChild(label);
        container.appendChild(card);
    });
}

function renderIndustryBreakdown(breakdown) {
    var container = document.getElementById("industry-breakdown");
    if (!container) return;
    if (!breakdown || !breakdown.length) { container.replaceChildren(); var p = document.createElement("p"); p.className = "empty"; p.textContent = "No industry data."; container.appendChild(p); return; }
    container.replaceChildren();
    var table = document.createElement("table");
    table.className = "data-table";
    var thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Sector</th><th>Claims</th><th>Hits</th><th>Misses</th><th>Hit Rate</th></tr>";
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    breakdown.forEach(function(s) {
        var tr = document.createElement("tr");
        var td1 = document.createElement("td"); td1.textContent = s.sector || ""; tr.appendChild(td1);
        var td2 = document.createElement("td"); td2.textContent = s.total; tr.appendChild(td2);
        var td3 = document.createElement("td"); td3.className = "positive"; td3.textContent = s.hits; tr.appendChild(td3);
        var td4 = document.createElement("td"); td4.className = "negative"; td4.textContent = s.misses; tr.appendChild(td4);
        var td5 = document.createElement("td"); td5.textContent = (s.hitRate * 100).toFixed(1) + "%"; tr.appendChild(td5);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}

function renderClaimHistory(claims, evaluations) {
    var container = document.getElementById("claim-history");
    if (!container) return;
    var evalMap = {};
    for (var ei = 0; ei < (evaluations || []).length; ei++) { evalMap[evaluations[ei].claimId] = evaluations[ei]; }
    if (!claims || !claims.length) { container.replaceChildren(); var p = document.createElement("p"); p.className = "empty"; p.textContent = "No claims yet."; container.appendChild(p); return; }
    container.replaceChildren();
    var table = document.createElement("table");
    table.className = "data-table";
    var thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Date</th><th>Stock</th><th>Direction</th><th>Return</th><th>Alpha</th><th>Verdict</th></tr>";
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    claims.forEach(function(c) {
        var ev = evalMap[c.id];
        var tr = document.createElement("tr");
        var td1 = document.createElement("td"); td1.textContent = c.date ? new Date(c.date).toLocaleDateString() : "\u2014"; tr.appendChild(td1);
        var td2 = document.createElement("td"); td2.textContent = c.stock || c.ticker || "\u2014"; tr.appendChild(td2);
        var td3 = document.createElement("td"); td3.textContent = c.direction || "\u2014"; tr.appendChild(td3);
        var td4 = document.createElement("td"); td4.className = (c.return || 0) >= 0 ? "positive" : "negative"; td4.textContent = c.return != null ? c.return.toFixed(2) + "%" : "\u2014"; tr.appendChild(td4);
        var td5 = document.createElement("td"); td5.className = (ev && ev.alpha || 0) >= 0 ? "positive" : "negative"; td5.textContent = ev && ev.alpha != null ? ev.alpha.toFixed(2) + "%" : "\u2014"; tr.appendChild(td5);
        var td6 = document.createElement("td");
        if (ev && ev.verdict) { var span = document.createElement("span"); span.className = "verdict verdict-" + ev.verdict.toLowerCase(); span.textContent = ev.verdict; td6.appendChild(span); } else { td6.textContent = "\u2014"; }
        tr.appendChild(td6);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}

function renderTopClaims(claims) {
    var container = document.getElementById("top-claims");
    if (!container) return;
    if (!claims || !claims.length) { container.replaceChildren(); var p = document.createElement("p"); p.className = "empty"; p.textContent = "No top claims."; container.appendChild(p); return; }
    container.replaceChildren();
    claims.forEach(function(c, i) {
        var div = document.createElement("div");
        div.className = "claim-card claim-top";
        var rank = document.createElement("span"); rank.className = "claim-rank"; rank.textContent = "#" + (i + 1); div.appendChild(rank);
        var stock = document.createElement("span"); stock.className = "claim-stock"; stock.textContent = c.stock || c.ticker || ""; div.appendChild(stock);
        var ret = document.createElement("span"); ret.className = "claim-return positive"; ret.textContent = "+" + (c.return != null ? c.return.toFixed(2) : "0") + "%"; div.appendChild(ret);
        container.appendChild(div);
    });
}

function renderBottomClaims(claims) {
    var container = document.getElementById("bottom-claims");
    if (!container) return;
    if (!claims || !claims.length) { container.replaceChildren(); var p = document.createElement("p"); p.className = "empty"; p.textContent = "No bottom claims."; container.appendChild(p); return; }
    container.replaceChildren();
    claims.forEach(function(c, i) {
        var div = document.createElement("div");
        div.className = "claim-card claim-bottom";
        var rank = document.createElement("span"); rank.className = "claim-rank"; rank.textContent = "#" + (i + 1); div.appendChild(rank);
        var stock = document.createElement("span"); stock.className = "claim-stock"; stock.textContent = c.stock || c.ticker || ""; div.appendChild(stock);
        var ret = document.createElement("span"); ret.className = "claim-return negative"; ret.textContent = (c.return != null ? c.return.toFixed(2) : "0") + "%"; div.appendChild(ret);
        container.appendChild(div);
    });
}

function renderKnowledgeNotes(notes) {
    var container = document.getElementById("knowledge-notes");
    if (!container) return;
    if (!notes || !notes.length) { container.replaceChildren(); var p = document.createElement("p"); p.className = "empty"; p.textContent = "No knowledge notes."; container.appendChild(p); return; }
    container.replaceChildren();
    notes.forEach(function(n) {
        var div = document.createElement("div");
        div.className = "knowledge-item";
        var h4 = document.createElement("h4"); h4.textContent = n.title || ""; div.appendChild(h4);
        var p = document.createElement("p"); p.textContent = n.summary || (n.content ? n.content.slice(0, 200) : "") || ""; div.appendChild(p);
        var meta = document.createElement("span"); meta.className = "knowledge-meta"; meta.textContent = (n.date ? new Date(n.date).toLocaleDateString() : "") + " \u00b7 " + (n.source || ""); div.appendChild(meta);
        container.appendChild(div);
    });
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
