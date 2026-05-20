/**
 * sources-list.js --- MVP: Sources List
 * Namespace: FMStock.ui.sources.list
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.sources = window.FMStock.ui.sources || {};

function renderSourcesList(sources, segments, claims) {
  var c = document.getElementById("sources-list-container") || document.getElementById("sources-list");
  if (!c) return;
  var m = {};
  (sources || []).forEach(function(s) {
    m[s.id] = { segmentCount: (segments || []).filter(function(x) { return x.sourceId === s.id; }).length, claimCount: (claims || []).filter(function(x) { return x.sourceId === s.id; }).length };
  });
  c.replaceChildren();
  var wrapper = document.createElement("div");
  wrapper.className = "sources-list";
  var count = document.createElement("div");
  count.className = "sources-count";
  count.textContent = (sources ? sources.length : 0) + " sources";
  wrapper.appendChild(count);
  var table = document.createElement("table");
  table.className = "sources-table";
  var thead = document.createElement("thead");
  thead.innerHTML = "<tr><th>Title</th><th>Type</th><th>Date</th><th>Segments</th><th>Claims</th><th>Status</th></tr>";
  table.appendChild(thead);
  var tbody = document.createElement("tbody");
  (sources || []).forEach(function(s) { tbody.appendChild(createSourceRowElement(s, m[s.id])); });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  c.appendChild(wrapper);
}

function safeClassSuffix(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createSourceRowElement(source, stats) {
  var tr = document.createElement("tr");
  tr.className = "source-row";
  tr.dataset.sourceId = source.id;

  var td1 = document.createElement("td");
  var a = document.createElement("a");
  a.href = "/sources/detail.html?id=" + encodeURIComponent(source.id);
  a.textContent = source.title || source.name || "Untitled";
  td1.appendChild(a);
  tr.appendChild(td1);

  var td2 = document.createElement("td");
  td2.textContent = source.type || "-";
  tr.appendChild(td2);

  var td3 = document.createElement("td");
  td3.textContent = source.date || "-";
  tr.appendChild(td3);

  var td4 = document.createElement("td");
  td4.textContent = (stats && stats.segmentCount) || 0;
  tr.appendChild(td4);

  var td5 = document.createElement("td");
  td5.textContent = (stats && stats.claimCount) || 0;
  tr.appendChild(td5);

  var td6 = document.createElement("td");
  var statusSpan = document.createElement("span");
  var statusSuffix = safeClassSuffix(source.processingStatus || "pending");
  statusSpan.className = "status-badge status-" + statusSuffix;
  statusSpan.textContent = source.processingStatus || "pending";
  td6.appendChild(statusSpan);
  tr.appendChild(td6);

  return tr;
}

function renderSourceFilters(data) {
  var c = document.getElementById("source-filters");
  if (!c) return;
  c.replaceChildren();
  var types = [...new Set((data.sources || []).map(function(s) { return s.type; }).filter(Boolean))];
  var statuses = [...new Set((data.sources || []).map(function(s) { return s.processingStatus; }).filter(Boolean))];

  var bar = document.createElement("div");
  bar.className = "filter-bar";

  var typeSelect = document.createElement("select");
  typeSelect.id = "filter-source-type";
  var typeAll = document.createElement("option"); typeAll.value = ""; typeAll.textContent = "All Types"; typeSelect.appendChild(typeAll);
  types.forEach(function(t) { var opt = document.createElement("option"); opt.value = t; opt.textContent = t; typeSelect.appendChild(opt); });
  bar.appendChild(typeSelect);

  var statusSelect = document.createElement("select");
  statusSelect.id = "filter-source-status";
  var statusAll = document.createElement("option"); statusAll.value = ""; statusAll.textContent = "All Status"; statusSelect.appendChild(statusAll);
  statuses.forEach(function(s) { var opt = document.createElement("option"); opt.value = s; opt.textContent = s; statusSelect.appendChild(opt); });
  bar.appendChild(statusSelect);

  c.appendChild(bar);
}

function filterSources(sources, filters) {
  if (!sources) return [];
  return sources.filter(function(s) {
    if (filters.type && s.type !== filters.type) return false;
    if (filters.status && s.processingStatus !== filters.status) return false;
    return true;
  });
}

window.FMStock.ui.sources.list = {
  renderSourcesList: renderSourcesList,
  createSourceRow: createSourceRowElement,
  renderSourceFilters: renderSourceFilters,
  filterSources: filterSources
};
