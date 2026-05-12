/**
 * claims-list.js --- MVP: Claims List View
 */

export function renderClaimsList(claims, evaluations, data) {
  const c = document.getElementById('claims-list-container');
  if (!c) return;
  const f = typeof getActiveFilters === 'function' ? getActiveFilters() : {};
  const fl = filterClaims(claims, f);
  const s = sortClaims(fl, 'date_desc');
  c.innerHTML = '<div class="claims-list"><div class="claims-count">'+s.length+' claims</div>' +
    '<table class="claims-table"><thead><tr><th>Claim</th><th>Speaker</th><th>Ticker</th><th>Direction</th><th>Verdict</th><th>Date</th></tr></thead><tbody>' +
    s.map(x => createClaimRow(x, evaluations?.[x.id])).join('') +
    '</tbody></table></div>';
}

export function createClaimRow(claim, evaluation) {
  if (!claim) return '';
  const v = evaluation?.verdict || 'pending';
  var r = '<tr class="claim-row" data-claim-id="'+claim.id+'">';
  r += '<td class="claim-text">'+(claim.text||claim.title||'')+'</td>';
  r += '<td>'+(claim.speaker||'-')+'</td>';
  r += '<td>'+(claim.ticker||'-')+'</td>';
  r += '<td><span class="direction-badge '+(claim.direction||'').toLowerCase()+'">'+(claim.direction||'-')+'</span></td>';
  r += '<td><span class="verdict-badge verdict-'+v.toLowerCase()+'">'+v+'</span></td>';
  r += '<td>'+(claim.date||'')+'</td></tr>';
  return r;
}

export function renderClaimFilters(data) {
  const c = document.getElementById('claim-filters');
  if (!c) return;
  const sp = [...new Set((data.claims||[]).map(x=>x.speaker).filter(Boolean))];
  const tk = [...new Set((data.claims||[]).map(x=>x.ticker).filter(Boolean))];
  var h = '<div class="filter-bar">';
  h += '<select id="filter-speaker"><option value="">All Speakers</option>';
  h += sp.map(s=>'<option value="'+s+'">'+s+'</option>').join('')+'</select>';
  h += '<select id="filter-ticker"><option value="">All Tickers</option>';
  h += tk.map(t=>'<option value="'+t+'">'+t+'</option>').join('')+'</select>';
  h += '<select id="filter-direction"><option value="">All Directions</option>';
  h += '<option value="bullish">Bullish</option><option value="bearish">Bearish</option><option value="neutral">Neutral</option></select>';
  h += '<select id="filter-verdict"><option value="">All Verdicts</option>';
  h += '<option value="correct">Correct</option><option value="partial">Partial</option><option value="wrong">Wrong</option><option value="pending">Pending</option></select>';
  h += '<input type="date" id="filter-date-from" placeholder="From" />';
  h += '<input type="date" id="filter-date-to" placeholder="To" />';
  h += '</div>';
  c.innerHTML = h;
}

export function filterClaims(claims, filters) {
  if (!claims) return [];
  return claims.filter(c => {
    if (filters.speaker && c.speaker !== filters.speaker) return false;
    if (filters.ticker && c.ticker !== filters.ticker) return false;
    if (filters.direction && c.direction !== filters.direction) return false;
    if (filters.verdict) { var v = (c.evaluation?.verdict || 'pending'); if (v !== filters.verdict) return false; }
    if (filters.dateFrom && c.date && c.date < filters.dateFrom) return false;
    if (filters.dateTo && c.date && c.date > filters.dateTo) return false;
    return true;
  });
}

export function sortClaims(claims, sortBy) {
  if (!claims) return [];
  const copy = [...claims];
  const sorts = {
    date_desc: (a,b) => (b.date||'').localeCompare(a.date||''),
    date_asc:  (a,b) => (a.date||'').localeCompare(b.date||''),
    speaker:   (a,b) => (a.speaker||'').localeCompare(b.speaker||''),
  };
  return copy.sort(sorts[sortBy] || sorts.date_desc);
}
