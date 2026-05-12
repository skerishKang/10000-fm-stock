/**
 * claims-detail.js --- MVP: Claim Detail Panel
 */

export function renderClaimDetail(claimId, data) {
  const c = document.getElementById('claim-detail-container');
  if (!c) return;
  const claim = (data.claims||[]).find(x => x.id === claimId);
  if (!claim) { c.innerHTML = '<div class="error">Claim not found</div>'; return; }
  var h = '<div class="claim-detail">';
  h += renderClaimSummary(claim);
  h += renderSourceInfo(claim, data.sources||[], data.segments||[]);
  h += renderEvidence(claim);
  h += renderEvaluationResult(claim, data.evaluations||[]);
  h += renderConnectedKnowledge(claim, data.knowledgeNotes||[]);
  h += '</div>';
  c.innerHTML = h;
}

export function renderClaimSummary(claim) {
  var h = '<div class="detail-section claim-summary">';
  h += '<h2>'+(claim.title||'Claim Detail')+'</h2>';
  h += '<div class="meta">';
  h += '<span class="speaker">'+(claim.speaker||'Unknown')+'</span>';
  h += '<span class="ticker">'+(claim.ticker||'-')+'</span>';
  h += '<span class="direction '+(claim.direction||'').toLowerCase()+'">'+(claim.direction||'-')+'</span>';
  h += '<span class="date">'+(claim.date||'')+'</span></div>';
  h += '<blockquote class="claim-text">'+(claim.text||'')+'</blockquote></div>';
  return h;
}

export function renderSourceInfo(claim, sources, segments) {
  const src = sources.find(s => s.id === claim.sourceId);
  if (!src) return '<div class="detail-section source-info"><h3>Source</h3><p>No source linked</p></div>';
  const segs = segments.filter(s => s.claimId === claim.id);
  var h = '<div class="detail-section source-info">';
  h += '<h3>Source: '+(src.title||src.name||'Untitled')+'</h3>';
  h += '<p class="source-type">'+(src.type||'-')+' -- '+(src.date||'')+'</p>';
  if (segs.length) {
    h += '<ul>';
    for (var i = 0; i < segs.length; i++) { h += '<li>'+renderYoutubeLink(src,segs[i])+'</li>'; }
    h += '</ul>';
  }
  h += '</div>';
  return h;
}

export function renderEvidence(claim) {
  if (!claim.evidence) return '<div class="detail-section evidence"><h3>Evidence</h3><p>No evidence recorded.</p></div>';
  return '<div class="detail-section evidence"><h3>Evidence '+amp+' Logic</h3><p>'+claim.evidence+'</p></div>';
}

export function renderEvaluationResult(claim, evaluations) {
  const evals = (evaluations||[]).filter(e => e.claimId === claim.id);
  if (!evals.length) return '<div class="detail-section evaluation"><h3>Verification Results</h3><p>Not yet evaluated.</p></div>';
  var rows = '';
  for (var i = 0; i < evals.length; i++) {
    var e = evals[i];
    rows += '<tr><td>'+(e.period||e.timeframe||'-')+'</td>';
    rows += '<td class="verdict-'+(e.verdict||'').toLowerCase()+'">'+(e.verdict||'-')+'</td>';
    rows += '<td>'+(e.priceAtClaim||'-')+'</td>';
    rows += '<td>'+(e.priceAtEvaluation||'-')+'</td>';
    rows += '<td>'+(e.changePercent != null ? e.changePercent.toFixed(2)+'%' : '-')+'</td></tr>';
  }
  var h = '<div class="detail-section evaluation"><h3>Verification Results</h3>';
  h += '<table class="eval-table"><thead><tr><th>Period</th><th>Verdict</th><th>Price at Claim</th><th>Price at Eval</th><th>Change %</th></tr></thead>';
  h += '<tbody>'+rows+'</tbody></table></div>';
  return h;
}

export function renderConnectedKnowledge(claim, knowledgeNotes) {
  const notes = (knowledgeNotes||[]).filter(n => n.claimId === claim.id);
  if (!notes.length) return '';
  var h = '<div class="detail-section knowledge"><h3>Connected Knowledge Notes ('+notes.length+')</h3><ul>';
  for (var i = 0; i < notes.length; i++) {
    h += '<li><a href="/knowledge/detail.html?id='+notes[i].id+'">'+(notes[i].title||'Untitled')+'</a></li>';
  }
  h += '</ul></div>';
  return h;
}

export function renderYoutubeLink(source, segment) {
  if (!source || source.type !== 'youtube') return '<span>'+(segment.start||'')+' - '+(segment.end||'')+'</span>';
  const start = segment.startTime || segment.start || 0;
  var url = 'https://www.youtube.com/watch?v='+(source.sourceId||source.url)+&t='+start+'s';
  return '<a href="'+url+'" target="_blank">Watch segment '+start+'s - '+(segment.endTime||segment.end||'')+'s</a>';
}
