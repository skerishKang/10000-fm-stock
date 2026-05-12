/**
 * claims-filter.js --- MVP: Claims Filter Logic
 * Namespace: FMStock.ui.claims.filter
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.claims = window.FMStock.ui.claims || {};

var activeFilters = {};
var callback = null;

function initClaimFilters(data, onFilterChange) {
  callback = onFilterChange;
  if (typeof window.FMStock.ui.claims.list.renderClaimFilters === "function") {
    window.FMStock.ui.claims.list.renderClaimFilters(data);
  }
  ["filter-speaker","filter-ticker","filter-direction","filter-verdict","filter-date-from","filter-date-to"].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("change", updateFilters);
  });
  updateFilters();
}

function updateFilters() {
  activeFilters = {};
  var g = function(id) { return document.getElementById(id); };
  var s = g("filter-speaker"); if (s && s.value) activeFilters.speaker = s.value;
  var t = g("filter-ticker"); if (t && t.value) activeFilters.ticker = t.value;
  var d = g("filter-direction"); if (d && d.value) activeFilters.direction = d.value;
  var v = g("filter-verdict"); if (v && v.value) activeFilters.verdict = v.value;
  var f = g("filter-date-from"); if (f && f.value) activeFilters.dateFrom = f.value;
  var to = g("filter-date-to"); if (to && to.value) activeFilters.dateTo = to.value;
  if (callback) callback(activeFilters);
}

function getActiveFilters() {
  var copy = {};
  var keys = Object.keys(activeFilters);
  for (var i = 0; i < keys.length; i++) { copy[keys[i]] = activeFilters[keys[i]]; }
  return copy;
}

function resetFilters() {
  activeFilters = {};
  document.querySelectorAll("#claims-filter select,#claims-filter input").forEach(function(el) { el.value = ""; });
  if (callback) callback(activeFilters);
}

function renderFilterSummary(filters) {
  var keys = Object.keys(filters).filter(function(k) { return filters[k]; });
  if (!keys.length) return "<span class=\"filter-summary\">No filters active</span>";
  return "<span class=\"filter-summary\">Active filters: " + keys.map(function(k) { return k + ": " + filters[k]; }).join(", ") + "</span>";
}

window.FMStock.ui.claims.filter = {
  initClaimFilters: initClaimFilters,
  getActiveFilters: getActiveFilters,
  resetFilters: resetFilters,
  renderFilterSummary: renderFilterSummary
};
