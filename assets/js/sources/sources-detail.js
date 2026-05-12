/**
 * sources-detail.js --- MVP: Source Detail View
 */

export function renderSourceDetail(sourceId, data) {
  const c=document.getElementById('source-detail-container');
  if(!c) return;
  const source=(data.sources||[]).find(s=>s.id===sourceId);
  if(!source){c.innerHTML='<div class="error">Source not found</div>';return;}
  const segments=(data.segments||[]).filter(s=>s.sourceId===sourceId);
  const claims=(data.claims||[]).filter(c=>c.sourceId===sourceId);
  const notes=(data.knowledgeNotes||[]).filter(n=>segments.some(s=>s.id===n.segmentId));
  var h = '<div class="source-detail">';
  h += renderSourceHeader(source);
  h += renderSegmentsList(segments);
  h += renderConnectedClaims(claims);
  h += renderConnectedKnowledge(notes);
  h += '</div>';
  c.innerHTML = h;
}

export function renderSourceHeader(source) {
  var h = '<div class="detail-section source-header">';
  h += '<h2>'+(source.title||source.name||'Untitled Source')+'</h2>';
  h += '<div class="meta"><span class="source-type">'+(source.type||'-')+'</span>';
  h += '<span class="source-date">'+(source.publishedAt?.substring(0,10)||'')+'</span>';
  h += '<span class="status-badge status-'+(source.visibility||'pending').toLowerCase()+'\">'+(source.visibility||'pending')+'</span></div>';
  if(source.url) h += '<p><a href="'+source.url+'" target="_blank">'+source.url+'</a></p>';
  h += '</div>';
  return h;
}

export function renderSegmentsList(segments) {
  if(!segments||!segments.length) return '<div class="detail-section"><h3>Segments</h3><p>No segments found.</p></div>';
  var rows = '';
  for (var i = 0; i < segments.length; i++) {
    var s = segments[i];
    rows += '<tr><td>'+(s.label||s.id||'-')+'</td>';
    rows += '<td>'+(s.startTime||s.start||'-')+'</td>';
    rows += '<td>'+(s.endTime||s.end||'-')+'</td>';
    rows += '<td>'+(s.page||'-')+'</td>';
    rows += '<td><a href="'+window.pagesUrl('claims.html', '?segmentId=' + s.id)+'">View Claims</a></td></tr>';
  }
  var h = '<div class="detail-section"><h3>Segments ('+segments.length+')</h3>';
  h += '<table class="segments-table"><thead><tr><th>Label</th><th>Start</th><th>End</th><th>Page</th><th>Claims</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  return h;
}

export function renderConnectedClaims(claims) {
  if(!claims||!claims.length) return '';
  var h = '<div class="detail-section"><h3>Connected Claims ('+claims.length+')</h3><ul>';
  for (var i = 0; i < claims.length; i++) {
    h += '<li><a href="'+window.pagesUrl('claims.html', '?id=' + claims[i].id)+'">'+(claims[i].claimText?.substring(0, 60)||claims[i].id)+'</a></li>';
  }
  h += '</ul></div>';
  return h;
}

export function renderConnectedKnowledge(notes) {
  if(!notes||!notes.length) return '';
  var h = '<div class="detail-section"><h3>Connected Knowledge ('+notes.length+')</h3><ul>';
  for (var i = 0; i < notes.length; i++) {
    h += '<li><a href="'+window.pagesUrl('knowledge.html', '?id=' + notes[i].id)+'">'+(notes[i].summary?.substring(0, 40)||notes[i].id)+'</a></li>';
  }
  h += '</ul></div>';
  return h;
}

export function renderYoutubeSegments(segments, source) {
  if(!segments||!segments.length||source?.type!=='youtube') return '';
  const videoId=source.url ? (source.url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1] || source.url) : null;
  if(!videoId) return '';
  var h = '<div class="youtube-segments"><h3>YouTube Segments</h3><ul>';
  for (var i = 0; i < segments.length; i++) {
    var s = segments[i];
    const start=s.startTime||s.start||0;
    var link = 'https://www.youtube.com/watch?v='+videoId+'&t='+start+'s';
    h += '<li><a href="'+link+'" target="_blank">Segment '+start+'s - '+(s.endTime||s.end||'')+'s</a></li>';
  }
  h += '</ul></div>';
  return h;
}

export function renderReportSegments(segments) {
  const rs=(segments||[]).filter(s=>s.page);
  if(!rs.length) return '';
  var h = '<div class="report-segments"><h3>Report Pages</h3><ul>';
  for (var i = 0; i < rs.length; i++) {
    h += '<li>Page '+rs[i].page+(rs[i].label?': '+rs[i].label:'')+'</li>';
  }
  h += '</ul></div>';
  return h;
}
