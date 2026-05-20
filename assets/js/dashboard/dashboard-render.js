/**
 * dashboard-render.js --- Dashboard DOM rendering
 * Renders summary cards, recent evaluations, top returns,
 * expert ranking, trending topics, and knowledge feed.
 * Namespace: FMStock.ui.dashboard.render
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.dashboard = window.FMStock.ui.dashboard || {};

function renderDashboard(data) {
    renderSummaryCards(data);
    renderRecentEvaluations(data);
    renderTopReturns(data);
    renderTopExperts(data);
    renderTrendingTopics(data);
    renderKnowledgeFeed(data);
}

function clear(container) {
    if (container) container.replaceChildren();
}

function renderEmpty(container, text) {
    clear(container);
    var p = document.createElement("p");
    p.className = "empty";
    p.textContent = text;
    container.appendChild(p);
}

function safeClassSuffix(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function signedClass(value) {
    return (value || 0) >= 0 ? "positive" : "negative";
}

function createCell(text, className) {
    var td = document.createElement("td");
    if (className) td.className = className;
    td.textContent = text != null ? text : "";
    return td;
}

function createTable(headers) {
    var table = document.createElement("table");
    table.className = "data-table";
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    headers.forEach(function(header) {
        var th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    table.appendChild(tbody);
    return { table: table, tbody: tbody };
}

function renderSummaryCards(data) {
    var container = document.getElementById("summary-cards");
    if (!container) return;
    var stats = [
        { label: "Sources", value: data.sources ? data.sources.length : 0, icon: "📡" },
        { label: "Segments", value: data.segments ? data.segments.length : 0, icon: "📂" },
        { label: "Claims", value: data.claims ? data.claims.length : 0, icon: "💬" },
        { label: "Verified", value: data.verifiedCount || 0, icon: "✅" },
        { label: "Pending", value: data.pendingCount || 0, icon: "⏳" },
        { label: "Knowledge", value: data.knowledge ? data.knowledge.length : 0, icon: "📖" },
        { label: "Avg Return", value: data.avgReturn != null ? data.avgReturn.toFixed(2) + "%" : "N/A", icon: "📈" },
        { label: "Avg Alpha", value: data.avgAlpha != null ? data.avgAlpha.toFixed(2) + "%" : "N/A", icon: "⚡" },
        { label: "Hit Rate", value: data.hitRate != null ? (data.hitRate * 100).toFixed(1) + "%" : "N/A", icon: "🎯" }
    ];
    clear(container);
    stats.forEach(function(s) {
        var card = document.createElement("div");
        card.className = "summary-card";

        var icon = document.createElement("span");
        icon.className = "summary-icon";
        icon.textContent = s.icon;
        card.appendChild(icon);

        var body = document.createElement("div");
        body.className = "summary-body";

        var value = document.createElement("span");
        value.className = "summary-value";
        value.textContent = s.value;
        body.appendChild(value);

        var label = document.createElement("span");
        label.className = "summary-label";
        label.textContent = s.label;
        body.appendChild(label);

        card.appendChild(body);
        container.appendChild(card);
    });
}

function renderRecentEvaluations(data) {
    var container = document.getElementById("recent-evaluations");
    if (!container) return;
    var items = data.recentEvaluations || [];
    if (!items.length) { renderEmpty(container, "No recent evaluations."); return; }

    clear(container);
    var tableParts = createTable(["Speaker", "Stock", "Sector", "Return", "Alpha", "Verdict"]);
    items.forEach(function(e) {
        var tr = document.createElement("tr");
        tr.appendChild(createCell(e.speaker));
        tr.appendChild(createCell(e.stock));
        tr.appendChild(createCell(e.sector));
        tr.appendChild(createCell(e.return != null ? e.return.toFixed(2) + "%" : "", signedClass(e.return)));
        tr.appendChild(createCell(e.alpha != null ? e.alpha.toFixed(2) + "%" : "", signedClass(e.alpha)));

        var verdictTd = document.createElement("td");
        var verdict = document.createElement("span");
        verdict.className = "verdict" + (e.verdict ? " verdict-" + safeClassSuffix(e.verdict) : "");
        verdict.textContent = e.verdict || "";
        verdictTd.appendChild(verdict);
        tr.appendChild(verdictTd);

        tableParts.tbody.appendChild(tr);
    });
    container.appendChild(tableParts.table);
}

function renderTopReturns(data) {
    var container = document.getElementById("top-returns");
    if (!container) return;
    var items = data.topReturns || [];
    if (!items.length) { renderEmpty(container, "No top return data."); return; }

    clear(container);
    var tableParts = createTable(["#", "Speaker", "Stock", "Return", "Excess Return"]);
    items.forEach(function(c, i) {
        var tr = document.createElement("tr");
        tr.appendChild(createCell(i + 1));
        tr.appendChild(createCell(c.speaker));
        tr.appendChild(createCell(c.stock));
        tr.appendChild(createCell(c.return != null ? c.return.toFixed(2) + "%" : "", "positive"));
        tr.appendChild(createCell(c.excessReturn != null ? c.excessReturn.toFixed(2) + "%" : "", signedClass(c.excessReturn)));
        tableParts.tbody.appendChild(tr);
    });
    container.appendChild(tableParts.table);
}

function renderTopExperts(data) {
    var container = document.getElementById("top-experts");
    if (!container) return;
    var items = data.topExperts || [];
    if (!items.length) { renderEmpty(container, "No expert data."); return; }

    clear(container);
    items.forEach(function(ex, i) {
        var row = document.createElement("div");
        row.className = "expert-row";

        var rank = document.createElement("span");
        rank.className = "rank";
        rank.textContent = "#" + (i + 1);
        row.appendChild(rank);

        var name = document.createElement("span");
        name.className = "name";
        name.textContent = ex.name || "";
        row.appendChild(name);

        var hit = document.createElement("span");
        hit.className = "stat";
        hit.textContent = "Hit: " + ((ex.hitRate || 0) * 100).toFixed(1) + "%";
        row.appendChild(hit);

        var alpha = document.createElement("span");
        alpha.className = "stat";
        alpha.textContent = "α: " + (ex.avgAlpha != null ? ex.avgAlpha.toFixed(2) + "%" : "N/A");
        row.appendChild(alpha);

        var claims = document.createElement("span");
        claims.className = "stat";
        claims.textContent = "Claims: " + (ex.claimCount || 0);
        row.appendChild(claims);

        container.appendChild(row);
    });
}

function renderTrendingTopics(data) {
    var stocksEl = document.getElementById("trending-stocks");
    var sectorsEl = document.getElementById("trending-sectors");
    var stocks = data.trendingStocks || [];
    var sectors = data.trendingSectors || [];

    renderTopicBadges(stocksEl, stocks, "No trending stocks.");
    renderTopicBadges(sectorsEl, sectors, "No trending sectors.");
}

function renderTopicBadges(container, items, emptyText) {
    if (!container) return;
    clear(container);
    if (!items.length) {
        var empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = emptyText;
        container.appendChild(empty);
        return;
    }
    items.forEach(function(item) {
        var badge = document.createElement("span");
        badge.className = "topic-badge";
        badge.textContent = (item.name || "") + " (" + (item.count || 0) + ")";
        container.appendChild(badge);
    });
}

function renderKnowledgeFeed(data) {
    var container = document.getElementById("knowledge-feed");
    if (!container) return;
    var notes = data.recentKnowledge || [];
    if (!notes.length) { renderEmpty(container, "No recent knowledge notes."); return; }

    clear(container);
    notes.forEach(function(n) {
        var item = document.createElement("div");
        item.className = "knowledge-item";

        var header = document.createElement("div");
        header.className = "knowledge-header";

        var title = document.createElement("strong");
        title.textContent = n.title || "";
        header.appendChild(title);

        var date = document.createElement("span");
        date.className = "knowledge-date";
        date.textContent = n.date ? new Date(n.date).toLocaleDateString() : "";
        header.appendChild(date);
        item.appendChild(header);

        var preview = document.createElement("p");
        preview.className = "knowledge-preview";
        preview.textContent = n.summary || (n.content ? n.content.slice(0, 120) : "") || "";
        item.appendChild(preview);

        var source = document.createElement("span");
        source.className = "knowledge-source";
        source.textContent = "Source: " + (n.source || "");
        item.appendChild(source);

        container.appendChild(item);
    });
}


window.FMStock.ui.dashboard.render = {
    renderDashboard: renderDashboard,
    renderSummaryCards: renderSummaryCards,
    renderRecentEvaluations: renderRecentEvaluations,
    renderTopReturns: renderTopReturns,
    renderTopExperts: renderTopExperts,
    renderTrendingTopics: renderTrendingTopics,
    renderKnowledgeFeed: renderKnowledgeFeed
};
