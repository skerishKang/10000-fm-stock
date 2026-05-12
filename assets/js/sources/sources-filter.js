/**
 * sources-filter.js --- MVP: Sources Filter Logic
 */

let activeFilters={};
let callback=null;

export function initSourceFilters(data, onFilterChange) {
  callback=onFilterChange;
  const {renderSourceFilters}=require('./sources-list.js')||{};
  if(typeof renderSourceFilters==='function') renderSourceFilters(data);
  ['sf-type','sf-status'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('change',updateFilters);
  });
  updateFilters();
}

function updateFilters() {
  activeFilters={};
  const t=document.getElementById('sf-type');
  if(t&&t.value) activeFilters.type=t.value;
  const s=document.getElementById('sf-status');
  if(s&&s.value) activeFilters.status=s.value;
  if(callback) callback(activeFilters);
}

export function getActiveFilters() { return {...activeFilters}; }

export function resetSourceFilters() {
  activeFilters={};
  document.querySelectorAll('#sources-filters select').forEach(el=>el.value='');
  if(callback) callback(activeFilters);
}
