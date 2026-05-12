/**
 * sources-list.js --- MVP: Sources List
 */

export function renderSourcesList(sources, segments, claims) {
  const c=document.getElementById('sources-list-container');
  if(!c) return;
  const m={};
  (sources||[]).forEach(s=>{
    m[s.id]={segmentCount:(segments||[]).filter(x=>x.sourceId===s.id).length,
              claimCount:(claims||[]).filter(x=>x.sourceId===s.id).length};
  });
  var h = '<div class="sources-list"><div class="sources-count">'+(sources?.length||0)+' sources</div>';
  h += '<table class="sources-table"><thead><tr><th>Title</th><th>Type</th><th>Date</th><th>Segments</th><th>Claims</th><th>Status</th></tr></thead><tbody>';
  for (var i = 0; i < (sources||[]).length; i++) { h += createSourceRow(sources[i], m[sources[i].id]); }
  h += '</tbody></table></div>';
  c.innerHTML = h;
}

export function createSourceRow(source, stats) {
  if(!source) return '';
  var r = '<tr class="source-row" data-source-id="'+source.id+'">';
  r += '<td><a href="/sources/detail.html?id='+source.id+'">'+(source.title||source.name||'Untitled')+'</a></td>';
  r += '<td>'+(source.type||'-')+'</td>';
  r += '<td>'+(source.date||'-')+'</td>';
  r += '<td>'+(stats?.segmentCount||0)+'</td>';
  r += '<td>'+(stats?.claimCount||0)+'</td>';
  r += '<td><span class="status-badge status-'+(source.processingStatus||'pending').toLowerCase()+'">'+(source.processingStatus||'pending')+'</span></td></tr>';
  return r;
}

export function renderSourceFilters(data) {
  const c=document.getElementById('source-filters');
  if(!c) return;
  const types=[...new Set((data.sources||[]).map(s=>s.type).filter(Boolean))];
  const statuses=[...new Set((data.sources||[]).map(s=>s.processingStatus).filter(Boolean))];
  var h = '<div class="filter-bar">';
  h += '<select id="filter-source-type"><option value="">All Types</option>';
  h += types.map(t=>'<option value="'+t+'">'+t+'</option>').join('')+'</select>';
  h += '<select id="filter-source-status"><option value="">All Status</option>';
  h += statuses.map(s=>'<option value="'+s+'">'+s+'</option>').join('')+'</select></div>';
  c.innerHTML = h;
}

export function filterSources(sources, filters) {
  if(!sources) return [];
  return sources.filter(s=>{
    if(filters.type&&s.type!==filters.type) return false;
    if(filters.status&&s.processingStatus!==filters.status) return false;
    return true;
  });
}
