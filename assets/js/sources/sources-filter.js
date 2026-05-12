/**
 * sources-filter.js --- MVP: Sources Filter Logic
 */

let activeFilters={};
let callback=null;

export function initSourceFilters(data, onFilterChange) {
  callback=onFilterChange;
  const {renderSourceFilters}=require('./sources-list.js')||{};
  if(typeof renderSourceFilters==='function') renderSourceFilters(data);
  ['filter-source-type','filter-source-status'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('change',updateFilters);
  });
  updateFilters();
}

function updateFilters() {
  activeFilters={};
  const t=document.getElementById('filter-source-type');
  if(t&&t.value) activeFilters.type=t.value;
  const s=document.getElementById('filter-source-status');
  if(s&&s.value) activeFilters.status=s.value;
  if(callback) callback(activeFilters);
}

export function getActiveFilters() { return {...activeFilters}; }

export function resetSourceFilters() {
  activeFilters={};
  document.querySelectorAll('#source-filters select').forEach(el=>el.value='');
  if(callback) callback(activeFilters);
}
