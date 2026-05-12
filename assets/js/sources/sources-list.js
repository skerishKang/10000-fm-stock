/**
 * sources-list.js --- MVP: Sources List
 * Namespace: FMStock.ui.sources.list
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.sources = window.FMStock.ui.sources || {};

function renderSourcesList(sources, segments, claims) {
  var c = document.getElementById("sources-list-container");
  if (!c) return;
  var m = {};
  (sources || []).forEach(function(s) {
    m[s.id] = { segmentCount: (segments || []).filter(function(x) { return x.sourceId === s.id; }).length, claimCount: (claims || []).filter(function(x) { return x.sourceId === s.id; }).length };
  });
  var h = "<div class=\"sources-list\"><div class=\"sources-count\">" + (sources ? sources.length : 0) + " sources</div>";
  h += "<table class=\"sources-table\"><thead><tr><th>Title</th><th>Type</th><th>Date</th><th>Segments</th><th>Claims</th><th>Status</th></tr></thead><tbody>";
  for (var i = 0; i < (sources || []).length; i++) { h += createSourceRow(sources[i], m[sources[i].id]); }
  h += "</tbody></table></div>";
  c.innerHTML = h;
}

function createSourceRow(source, stats) {
  if (!source) return "";
  var r = "<tr class=\"source-row\" data-source-id=\"" + source.id + "\">";
  r += "<td><a href=\"/sources/detail.html?id=" + source.id + "\">" + (source.title || source.name || "Untitled") + "</a></td>";
  r += "<td>" + (source.type || "-") + "</td>";
  r += "<td>" + (source.date || "-") + "</td>";
  r += "<td>" + ((stats && stats.segmentCount) || 0) + "</td>";
  r += "<td>" + ((stats && stats.claimCount) || 0) + "</td>";
  r += "<td><span class=\"status-badge status-" + (source.processingStatus || "pending").toLowerCase() + "\">" + (source.processingStatus || "pending") + "</span></td></tr>";
  return r;
}

function renderSourceFilters(data) {
  var c = document.getElementById("source-filters");
  if (!c) return;
  var types = [...new Set((data.sources || []).map(function(s) { return s.type; }).filter(Boolean))];
  var statuses = [...new Set((data.sources || []).map(function(s) { return s.processingStatus; }).filter(Boolean))];
  var h = "<div class=\"filter-bar\">";
  h += "<select id=\"filter-source-type\"><option value=\"\">All Types</option>";
  h += types.map(function(t) { return "<option value=\"" + t + "\">" + t + "</option>"; }).join("") + "</select>";
  h += "<select id=\"filter-source-status\"><option value=\"\">All Status</option>";
  h += statuses.map(function(s) { return "<option value=\"" + s + "\">" + s + "</option>"; }).join("") + "</select></div>";
  c.innerHTML = h;
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
  createSourceRow: createSourceRow,
  renderSourceFilters: renderSourceFilters,
  filterSources: filterSources
};
