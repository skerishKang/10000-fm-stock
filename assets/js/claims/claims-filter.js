/**
 * claims-filter.js --- MVP: Claims Filter Logic
 */

let activeFilters={};
let callback=null;

export function initClaimFilters(data, onFilterChange) {
  callback=onFilterChange;
  const {renderClaimFilters}=require('./claims-list.js')||{};
  if(typeof renderClaimFilters==='function') renderClaimFilters(data);
  ['filter-speaker','filter-ticker','filter-direction','filter-verdict','filter-date-from','filter-date-to'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('change',updateFilters);
  });
  updateFilters();
}

function updateFilters() {
  activeFilters={};
  const g=id=>document.getElementById(id);
  const s=g('filter-speaker'); if(s&&s.value) activeFilters.speaker=s.value;
  const t=g('filter-ticker'); if(t&&t.value) activeFilters.ticker=t.value;
  const d=g('filter-direction'); if(d&&d.value) activeFilters.direction=d.value;
  const v=g('filter-verdict'); if(v&&v.value) activeFilters.verdict=v.value;
  const f=g('filter-date-from'); if(f&&f.value) activeFilters.dateFrom=f.value;
  const to=g('filter-date-to'); if(to&&to.value) activeFilters.dateTo=to.value;
  if(callback) callback(activeFilters);
}

export function getActiveFilters() { return {...activeFilters}; }

export function resetFilters() {
  activeFilters={};
  document.querySelectorAll('#claim-filters select,#claim-filters input').forEach(el=>el.value='');
  if(callback) callback(activeFilters);
}

export function renderFilterSummary(filters) {
  const keys=Object.keys(filters).filter(k=>filters[k]);
  if(!keys.length) return '<span class="filter-summary">No filters active</span>';
  return '<span class="filter-summary">Active filters: '+keys.map(k=>k+': '+filters[k]).join(', ')+'</span>';
}
