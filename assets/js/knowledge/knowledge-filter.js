/**
 * knowledge-filter.js - Knowledge Filters
 * Manages filter state and unique value extraction.
 */

var activeFilters = {};
var onFilterChangeCallback = null;

export function initKnowledgeFilters(data, onFilterChange) {
  onFilterChangeCallback = onFilterChange;
  activeFilters = {};

  document.querySelectorAll('.filter-select').forEach(function(select) {
    select.addEventListener('change', function(e) {
      var filterKey = e.target.dataset.filter;
      activeFilters[filterKey] = e.target.value;
      if (onFilterChangeCallback) onFilterChangeCallback(getActiveFilters());
    });
  });

  document.querySelectorAll('.filter-chip').forEach(function(chip) {
    chip.addEventListener('click', function(e) {
      var filterKey = e.target.dataset.filter;
      var value = e.target.dataset.value;
      if (activeFilters[filterKey] === value) {
        activeFilters[filterKey] = '';
      } else {
        activeFilters[filterKey] = value;
      }
      if (onFilterChangeCallback) onFilterChangeCallback(getActiveFilters());
    });
  });
}

export function getActiveFilters() {
  var copy = {};
  for (var k in activeFilters) { copy[k] = activeFilters[k]; }
  return copy;
}

export function getUniqueValues(notes, field) {
  return [...new Set((notes || []).map(function(n) { return n[field]; }).filter(Boolean))].sort();
}
