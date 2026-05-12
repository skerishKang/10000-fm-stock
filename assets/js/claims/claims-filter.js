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
  ['cf-search', 'cf-speaker', 'cf-ticker', 'cf-industry', 'cf-direction', 'cf-verdict'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var eventName = el.tagName === 'INPUT' ? 'input' : 'change';
    el.addEventListener(eventName, updateFilters);
  });
  updateFilters();
}

function updateFilters() {
  activeFilters = {};
  var g = function (id) { return document.getElementById(id); };
  var search = g('cf-search'); if (search && search.value) activeFilters.search = search.value.trim();
  var speaker = g('cf-speaker'); if (speaker && speaker.value) activeFilters.speaker = speaker.value;
  var ticker = g('cf-ticker'); if (ticker && ticker.value) activeFilters.ticker = ticker.value;
  var industry = g('cf-industry'); if (industry && industry.value) activeFilters.industry = industry.value;
  var direction = g('cf-direction'); if (direction && direction.value) activeFilters.direction = direction.value;
  var verdict = g('cf-verdict'); if (verdict && verdict.value) activeFilters.verdict = verdict.value;
  if (callback) callback(activeFilters);
}

function getActiveFilters() {
  var copy = {};
  Object.keys(activeFilters).forEach(function (key) {
    copy[key] = activeFilters[key];
  });
  return copy;
}

function resetFilters() {
  activeFilters = {};
  ['cf-search', 'cf-speaker', 'cf-ticker', 'cf-industry', 'cf-direction', 'cf-verdict'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  if (callback) callback(activeFilters);
}

function renderFilterSummary(filters) {
  var keys = Object.keys(filters || {}).filter(function (key) { return filters[key]; });
  if (!keys.length) return '<span class="filter-summary">활성 필터 없음</span>';
  return '<span class="filter-summary">활성 필터: ' + keys.map(function (key) {
    return key + ': ' + filters[key];
  }).join(', ') + '</span>';
}

window.FMStock.ui.claims.filter = {
  initClaimFilters: initClaimFilters,
  getActiveFilters: getActiveFilters,
  resetFilters: resetFilters,
  renderFilterSummary: renderFilterSummary
};
