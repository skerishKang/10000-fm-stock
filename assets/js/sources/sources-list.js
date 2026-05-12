/**
 * sources-list.js — Source list page rendering
 */

export function renderSourcesList(sources, segments, claims) {
  const container = document.getElementById('sources-list');
  if (!container) return;
  container.innerHTML = '<table class="sources-table"><thead><tr><th>Title</th><th>Type</th><th>Date</th><th>Segments</th><th>Status</th></tr></thead><tbody>' +
    sources.map(s => createSourceRow(s, getSourceStats(s.id, segments, claims))).join('') +
    '</tbody></table>';
}

function getSourceStats(sourceId, segments, claims) {
  const segCount = (segments||[]).filter(s => s.sourceId === sourceId).length;
  const claimCount = (claims||[]).filter(c => c.sourceId === sourceId).length;
  return { segCount, claimCount };
}

export function createSourceRow(source, stats) {
  var r = '<tr>';
  r += '<td><a href="'+window.pagesUrl('sources.html', '?id=' + source.id)+'">'+(source.title||source.name||'Untitled')+'</a></td>';
  r += '<td>'+(source.type||'-')+'</td>';
  r += '<td>'+(source.publishedAt?.substring(0,10)||'-')+'</td>';
  r += '<td>'+(stats.segCount||0)+'</td>';
  r += '<td><span class="status-badge status-'+(source.visibility||'pending').toLowerCase()+'">'+(source.visibility||'pending')+'</span></td>';
  r += '</tr>';
  return r;
}

export function renderSourceFilters(data) {
  const typeSelect = document.getElementById('sf-type');
  if (typeSelect) {
    const types = [...new Set((data.sources||[]).map(s => s.type).filter(Boolean))];
    types.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      typeSelect.appendChild(opt);
    });
  }
  const statusSelect = document.getElementById('sf-status');
  if (statusSelect) {
    const statuses = [...new Set((data.sources||[]).map(s => s.visibility).filter(Boolean))];
    statuses.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      statusSelect.appendChild(opt);
    });
  }
}

export function filterSources(sources, filters) {
  return sources.filter(s => {
    if (filters.type && s.type !== filters.type) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const title = (s.title || s.name || '').toLowerCase();
      const publisher = (s.publisher || '').toLowerCase();
      if (!title.includes(q) && !publisher.includes(q)) return false;
    }
    if (filters.status && s.visibility !== filters.status) return false;
    return true;
  });
}
