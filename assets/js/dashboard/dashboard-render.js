/**
 * dashboard-render.js --- Dashboard DOM rendering
 * Renders summary cards and the three dashboard panels:
 *   #recent-verified, #top-return, #recent-knowledge
 * Aligned with index.html DOM structure.
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
    // index.html uses individual stat-* elements, not a single summary-cards container.
    // This function updates those elements; the stat-* fallback in app-main.js
    // already handles them, so we only need to handle any additional stat elements here.
    // No-op if the legacy summary-cards container does not exist.
    var container = document.getElementById("summary-cards");
    if (!container) return;
    // Legacy container path (not present in current index.html — kept for safety)
    var stats = [
        { label: "Sources", value: data.sources ? data.sources.length : 0 },
        { label: "Claims", value: data.claims ? data.claims.length : 0 },
        { label: "Verified", value: (data.evaluations || []).filter(function(e) { return e.result && e.result !== 'invalid'; }).length },
        { label: "Knowledge", value: data.knowledgeNotes ? data.knowledgeNotes.length : 0 }
    ];
    clear(container);
    stats.forEach(function(s) {
        var card = document.createElement("div");
        card.className = "summary-card";
        var value = document.createElement("span");
        value.className = "summary-value";
        value.textContent = s.value;
        var label = document.createElement("span");
        label.className = "summary-label";
        label.textContent = s.label;
        card.appendChild(value);
        card.appendChild(label);
        container.appendChild(card);
    });
}

function renderRecentEvaluations(data) {
    // Target: #recent-verified (index.html)
    var container = document.getElementById("recent-verified");
    if (!container) return;

    // Build a lookup from claimId → claim for joining
    var claimsById = {};
    (data.claims || []).forEach(function(c) { claimsById[c.id] = c; });

    // Build a lookup from expertId → expert name
    var expertsById = {};
    (data.experts || []).forEach(function(ex) { expertsById[ex.id] = ex; });

    // Use evaluations sorted by evaluatedAt desc, exclude invalid
    var evals = (data.evaluations || []).filter(function(e) {
        return e.result && e.result !== 'invalid';
    }).slice().sort(function(a, b) {
        return new Date(b.evaluatedAt || 0) - new Date(a.evaluatedAt || 0);
    }).slice(0, 10);

    if (!evals.length) {
        renderEmpty(container, "검증 완료된 발언이 없습니다.");
        return;
    }

    clear(container);
    evals.forEach(function(e) {
        var claim = claimsById[e.claimId] || {};
        var expert = expertsById[claim.expertId] || {};
        var expertName = expert.displayName || expert.name || claim.expertId || '-';
        var stock = claim.companyName || claim.stock || '-';
        var returnRate = e.returnRate != null ? e.returnRate : null;
        var result = e.result || '-';

        var li = document.createElement("li");
        li.className = "item-row";

        var nameSpan = document.createElement("span");
        nameSpan.className = "item-name";
        nameSpan.textContent = expertName;
        li.appendChild(nameSpan);

        var stockSpan = document.createElement("span");
        stockSpan.className = "item-stock";
        stockSpan.textContent = stock;
        li.appendChild(stockSpan);

        var retSpan = document.createElement("span");
        retSpan.className = "item-return " + signedClass(returnRate);
        retSpan.textContent = returnRate != null ? returnRate.toFixed(2) + '%' : '-';
        li.appendChild(retSpan);

        var resultSpan = document.createElement("span");
        resultSpan.className = "item-result result-" + safeClassSuffix(result);
        resultSpan.textContent = result;
        li.appendChild(resultSpan);

        container.appendChild(li);
    });
}

function renderTopReturns(data) {
    // Target: #top-return (index.html — note: singular, not 'top-returns')
    var container = document.getElementById("top-return");
    if (!container) return;

    // Build expert name lookup
    var expertsById = {};
    (data.experts || []).forEach(function(ex) { expertsById[ex.id] = ex; });
    var claimsById = {};
    (data.claims || []).forEach(function(c) { claimsById[c.id] = c; });

    // Sort evaluations by returnRate desc, take top 10
    var topEvals = (data.evaluations || []).filter(function(e) {
        return e.returnRate != null;
    }).slice().sort(function(a, b) {
        return (b.returnRate || 0) - (a.returnRate || 0);
    }).slice(0, 10);

    if (!topEvals.length) {
        renderEmpty(container, "수익률 데이터가 없습니다.");
        return;
    }

    clear(container);
    topEvals.forEach(function(e, i) {
        var claim = claimsById[e.claimId] || {};
        var expert = expertsById[claim.expertId] || {};
        var expertName = expert.displayName || expert.name || '-';
        var stock = claim.companyName || claim.stock || '-';
        var alpha = e.alpha != null ? e.alpha : null;

        var li = document.createElement("li");
        li.className = "item-row";

        var rankSpan = document.createElement("span");
        rankSpan.className = "item-rank";
        rankSpan.textContent = (i + 1) + '.';
        li.appendChild(rankSpan);

        var nameSpan = document.createElement("span");
        nameSpan.className = "item-name";
        nameSpan.textContent = expertName;
        li.appendChild(nameSpan);

        var stockSpan = document.createElement("span");
        stockSpan.className = "item-stock";
        stockSpan.textContent = stock;
        li.appendChild(stockSpan);

        var retSpan = document.createElement("span");
        retSpan.className = "item-return positive";
        retSpan.textContent = e.returnRate.toFixed(2) + '%';
        li.appendChild(retSpan);

        if (alpha != null) {
            var alphaSpan = document.createElement("span");
            alphaSpan.className = "item-alpha " + signedClass(alpha);
            alphaSpan.textContent = 'α ' + alpha.toFixed(2) + '%';
            li.appendChild(alphaSpan);
        }

        container.appendChild(li);
    });
}

function renderTopExperts(data) {
    // #top-experts does not exist in index.html — graceful no-op.
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
    // Target: #recent-knowledge (index.html)
    var container = document.getElementById("recent-knowledge");
    if (!container) return;

    // knowledgeNotes is the canonical field from data-loader.js
    var notes = (data.knowledgeNotes || []).slice(0, 8);
    if (!notes.length) {
        renderEmpty(container, "지식노트가 없습니다.");
        return;
    }

    // Build expert lookup for display names
    var expertsById = {};
    (data.experts || []).forEach(function(ex) { expertsById[ex.id] = ex; });

    clear(container);
    notes.forEach(function(n) {
        var expert = expertsById[n.expertId] || {};
        var expertName = expert.displayName || expert.name || '';

        var li = document.createElement("li");
        li.className = "item-row";

        var titleSpan = document.createElement("span");
        titleSpan.className = "item-title";
        // knowledgeNotes uses topic + companyName as the display title
        titleSpan.textContent = (n.topic || n.title || n.summary || '').slice(0, 40);
        li.appendChild(titleSpan);

        if (n.industry || n.companyName) {
            var tagSpan = document.createElement("span");
            tagSpan.className = "item-tag";
            tagSpan.textContent = n.companyName || n.industry || '';
            li.appendChild(tagSpan);
        }

        if (expertName) {
            var authorSpan = document.createElement("span");
            authorSpan.className = "item-author";
            authorSpan.textContent = expertName;
            li.appendChild(authorSpan);
        }

        container.appendChild(li);
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
