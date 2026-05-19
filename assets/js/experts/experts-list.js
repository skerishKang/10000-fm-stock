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
    container.replaceChildren();
    experts.forEach(function(ex) {
        var stats = window.FMStock.ui.experts.metrics.getExpertCardStats(ex.id, claims, evaluations);
        container.appendChild(createExpertCard(ex, stats));
    });
}

function createExpertCard(expert, stats) {
    var card = document.createElement("div");
    card.className = "expert-card";
    card.dataset.expertId = expert.id;

    var header = document.createElement("div");
    header.className = "card-header";
    var img = document.createElement("img");
    img.className = "expert-avatar";
    img.src = expert.avatar || "/assets/img/default-avatar.png";
    img.alt = expert.name || "";
    img.loading = "lazy";
    header.appendChild(img);
    var h3 = document.createElement("h3");
    h3.className = "expert-name";
    h3.textContent = expert.name || "";
    header.appendChild(h3);
    var badge = document.createElement("span");
    badge.className = "expert-type badge badge-" + (expert.type || "").toLowerCase();
    badge.textContent = expert.type || "";
    header.appendChild(badge);
    card.appendChild(header);

    var statsDiv = document.createElement("div");
    statsDiv.className = "card-stats";
    var statItems = [
        { label: "Verified", value: stats.verifiedCount || 0 },
        { label: "Hit Rate", value: stats.hitRate != null ? (stats.hitRate * 100).toFixed(1) + "%" : "N/A" },
        { label: "Avg Alpha", value: stats.avgAlpha != null ? stats.avgAlpha.toFixed(2) + "%" : "N/A" },
        { label: "Claims", value: stats.claimCount || 0 }
    ];
    statItems.forEach(function(item) {
        var stat = document.createElement("div");
        stat.className = "stat";
        var label = document.createElement("span");
        label.className = "stat-label";
        label.textContent = item.label;
        stat.appendChild(label);
        var value = document.createElement("span");
        value.className = "stat-value";
        value.textContent = item.value;
        stat.appendChild(value);
        statsDiv.appendChild(stat);
    });
    card.appendChild(statsDiv);

    var sectorsDiv = document.createElement("div");
    sectorsDiv.className = "card-sectors";
    (expert.sectors || expert.industries || []).slice(0, 3).forEach(function(s) {
        var span = document.createElement("span");
        span.className = "sector-tag";
        span.textContent = s;
        sectorsDiv.appendChild(span);
    });
    card.appendChild(sectorsDiv);

    var link = document.createElement("a");
    link.href = "experts-detail.html?id=" + encodeURIComponent(expert.id);
    link.className = "card-link";
    link.textContent = "View Profile \u2192";
    card.appendChild(link);

    return card;
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
