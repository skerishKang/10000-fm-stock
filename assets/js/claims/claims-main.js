/**
 * claims-main.js --- MVP: Claims Page Initialiser
 */

export function initClaimsPage() {
  const {renderClaimFilters}=require('./claims-list.js');
  const {initClaimFilters}=require('./claims-filter.js');
  const {renderClaimsList}=require('./claims-list.js');
  const {getClaimsStats}=require('./claims-metrics.js');
  fetch('/api/claims').then(r=>r.json()).then(data=>{
    renderClaimFilters(data);
    initClaimFilters(data,()=>renderClaimsList(data.claims,data.evaluations,data));
    renderClaimsList(data.claims,data.evaluations,data);
    const stats=getClaimsStats(data.claims,data.evaluations);
    const el=document.getElementById('claims-stats');
    if(el) el.innerHTML='<div class="stat-card">Total: '+stats.total+'</div>'+
      '<div class="stat-card">Avg Accuracy: '+(stats.avgAccuracy*100).toFixed(1)+'%</div>';
  }).catch(err=>console.error('Failed to load claims page:',err));
}
