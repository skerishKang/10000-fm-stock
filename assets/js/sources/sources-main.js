/**
 * sources-main.js --- MVP: Sources Page Initialiser
 */

export function initSourcesList() {
  const {renderSourceFilters}=require('./sources-list.js');
  const {initSourceFilters}=require('./sources-filter.js');
  const {renderSourcesList}=require('./sources-list.js');
  fetch('/api/sources').then(r=>r.json()).then(data=>{
    renderSourceFilters(data);
    initSourceFilters(data,()=>renderSourcesList(data.sources,data.segments,data.claims));
    renderSourcesList(data.sources,data.segments,data.claims);
  }).catch(err=>console.error('Failed to load sources list:',err));
}

export function initSourceDetail() {
  const p=new URLSearchParams(window.location.search);
  const id=p.get('id');
  if(!id){
    const c=document.getElementById('source-detail-container');
    if(c) c.innerHTML='<div class="error">No source ID provided</div>';
    return;
  }
  const {renderSourceDetail}=require('./sources-detail.js');
  fetch('/api/sources/'+id).then(r=>r.json()).then(data=>renderSourceDetail(id,data))
    .catch(err=>console.error('Failed to load source detail:',err));
}
