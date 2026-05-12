/**
 * sources-filter.js --- MVP: Sources Filter Logic
 * Namespace: FMStock.ui.sources.filter
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.sources = window.FMStock.ui.sources || {};

var activeFilters = {};
var callback = null;

function initSourceFilters(data, onFilterChange) {
  callback = onFilterChange;
  if (typeof window.FMStock.ui.sources.list.renderSourceFilters === "function") {
    window.FMStock.ui.sources.list.renderSourceFilters(data);
  }
  ["filter-source-type", "filter-source-status"].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("change", updateFilters);
  });
  updateFilters();
}

function updateFilters() {
  activeFilters = {};
  var t = document.getElementById("filter-source-type");
  if (t && t.value) activeFilters.type = t.value;
  var s = document.getElementById("filter-source-status");
  if (s && s.value) activeFilters.status = s.value;
  if (callback) callback(activeFilters);
}

function getActiveFilters() {
  var copy = {};
  var keys = Object.keys(activeFilters);
  for (var i = 0; i < keys.length; i++) { copy[keys[i]] = activeFilters[keys[i]]; }
  return copy;
}

function resetSourceFilters() {
  activeFilters = {};
  document.querySelectorAll("#source-filters select").forEach(function(el) { el.value = ""; });
  if (callback) callback(activeFilters);
}

window.FMStock.ui.sources.filter = {
  initSourceFilters: initSourceFilters,
  getActiveFilters: getActiveFilters,
  resetSourceFilters: resetSourceFilters
};
