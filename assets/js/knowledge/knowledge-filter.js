/**
 * knowledge-filter.js --- Knowledge Filters
 * Manages filter state and unique value extraction.
 * Namespace: FMStock.ui.knowledge.filter
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.knowledge = window.FMStock.ui.knowledge || {};

var activeFilters = {};
var onFilterChangeCallback = null;

function initKnowledgeFilters(data, onFilterChange) {
  onFilterChangeCallback = onFilterChange;
  document.querySelectorAll("#knowledge-filters .filter-select").forEach(function(el) {
    el.addEventListener("change", function() {
      activeFilters[el.dataset.filter] = el.value;
      if (onFilterChangeCallback) onFilterChangeCallback(activeFilters);
    });
  });
}

function getActiveFilters() {
  var copy = {};
  var keys = Object.keys(activeFilters);
  for (var i = 0; i < keys.length; i++) { copy[keys[i]] = activeFilters[keys[i]]; }
  return copy;
}

function resetKnowledgeFilters() {
  activeFilters = {};
  document.querySelectorAll("#knowledge-filters .filter-select").forEach(function(el) { el.value = ""; });
  if (onFilterChangeCallback) onFilterChangeCallback(activeFilters);
}

function getUniqueValues(notes, field) {
  var set = {};
  (notes || []).forEach(function(n) {
    var v = n[field];
    if (v) set[v] = true;
  });
  return Object.keys(set).sort();
}

window.FMStock.ui.knowledge.filter = {
  initKnowledgeFilters: initKnowledgeFilters,
  getActiveFilters: getActiveFilters,
  resetKnowledgeFilters: resetKnowledgeFilters,
  getUniqueValues: getUniqueValues
};
