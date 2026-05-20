/**
 * claims-list.js --- MVP: Claims List View
 * Namespace: FMStock.ui.claims.list
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.claims = window.FMStock.ui.claims || {};

function renderClaimsList(claims, evaluations, data) {
  var c = document.getElementById('claims-list');
  if (!c) return;

  var dataset = data || {};
  var claimList = Array.isArray(claims) ? claims : [];
  var evaluationList = Array.isArray(evaluations) ? evaluations : [];
  var filters = typeof window.FMStock.ui.claims.filter.getActiveFilters === 'function'
    ? window.FMStock.ui.claims.filter.getActiveFilters()
    : {};

  var filtered = filterClaims(claimList, filters, evaluationList, dataset);
  var sorted = sortClaims(filtered, 'date_desc');

  if (!sorted.length) {
    c.innerHTML = '<ul class="item-list"><li class="placeholder">조건에 맞는 발언 데이터가 없습니다.</li></ul>';
    return;
  }

  c.innerHTML = '<div class="claims-count">' + sorted.length + ' claims</div>' +
    '<table class="claims-table"><thead><tr>' +
    '<th>발언</th><th>발언자</th><th>종목</th><th>산업</th><th>방향</th><th>판정</th><th>기준일</th>' +
    '</tr></thead><tbody>' +
    sorted.map(function (claim) {
      return createClaimRow(claim, findEvaluation(claim.id, evaluationList), dataset);
    }).join('') +
    '</tbody></table>';
  attachRowClickHandlers(c, dataset);
}

function createClaimRow(claim, evaluation, data) {
  if (!claim) return '';
  var verdict = evaluation ? evaluation.result : (claim.status || 'pending');
  var expertName = getExpertName(claim.expertId, data);
  var stockLabel = claim.companyName || claim.ticker || '-';

  var r = '<tr class="claim-row" data-claim-id="' + FMStock.security.escapeHtml(claim.id) + '">';
  r += '<td class="claim-text">' + FMStock.security.escapeHtml(claim.claimText || '') + '</td>';
  r += '<td>' + FMStock.security.escapeHtml(expertName) + '</td>';
  r += '<td>' + FMStock.security.escapeHtml(stockLabel) + '</td>';
  r += '<td>' + FMStock.security.escapeHtml(claim.industry || '-') + '</td>';
  r += '<td><span class="direction-badge ' + FMStock.security.escapeHtml((claim.direction || '').toLowerCase()) + '">' + FMStock.security.escapeHtml(claim.direction || '-') + '</span></td>';
  r += '<td><span class="verdict-badge verdict-' + FMStock.security.escapeHtml(String(verdict).toLowerCase()) + '">' + FMStock.security.escapeHtml(verdict) + '</span></td>';
  r += '<td>' + FMStock.security.escapeHtml(claim.baseDate || '') + '</td>';
  r += '</tr>';
  return r;
}

function renderClaimFilters(data) {
  data = data || {};
  var filterBox = document.querySelector('.claims-filters');
  if (!filterBox) return;

  var claims = Array.isArray(data.claims) ? data.claims : [];
  var experts = Array.isArray(data.experts) ? data.experts : [];
  var speakers = unique(claims.map(function (claim) { return claim.expertId; })).map(function (expertId) {
    return { id: expertId, name: getExpertName(expertId, data) };
  });
  var tickers = unique(claims.map(function (claim) { return claim.ticker; }).filter(Boolean));
  var industries = unique(claims.map(function (claim) { return claim.industry; }).filter(Boolean));

  var speaker = document.getElementById('cf-speaker');
  if (speaker) {
    speaker.innerHTML = '<option value="">발언자 전체</option>' + speakers.map(function (item) {
      return '<option value="' + FMStock.security.escapeHtml(item.id) + '">' + FMStock.security.escapeHtml(item.name) + '</option>';
    }).join('');
  }

  var ticker = document.getElementById('cf-ticker');
  if (ticker) {
    ticker.innerHTML = '<option value="">종목 전체</option>' + tickers.map(function (item) {
      return '<option value="' + FMStock.security.escapeHtml(item) + '">' + FMStock.security.escapeHtml(item) + '</option>';
    }).join('');
  }

  var industry = document.getElementById('cf-industry');
  if (industry) {
    industry.innerHTML = '<option value="">산업 전체</option>' + industries.map(function (item) {
      return '<option value="' + FMStock.security.escapeHtml(item) + '">' + FMStock.security.escapeHtml(item) + '</option>';
    }).join('');
  }

  var direction = document.getElementById('cf-direction');
  if (direction) {
    direction.innerHTML = '<option value="">방향성 전체</option><option value="bullish">상승</option><option value="bearish">하락</option><option value="neutral">중립</option><option value="educational_only">교육용</option>';
  }
}

function filterClaims(claims, filters, evaluations, data) {
  if (!claims) return [];
  return claims.filter(function (claim) {
    var evaluation = findEvaluation(claim.id, evaluations || []);
    var text = [claim.claimText, claim.companyName, claim.ticker, claim.industry, getExpertName(claim.expertId, data)].join(' ').toLowerCase();
    if (filters.search && text.indexOf(String(filters.search).toLowerCase()) === -1) return false;
    if (filters.speaker && claim.expertId !== filters.speaker) return false;
    if (filters.ticker && claim.ticker !== filters.ticker) return false;
    if (filters.industry && claim.industry !== filters.industry) return false;
    if (filters.direction && claim.direction !== filters.direction) return false;
    if (filters.verdict) {
      var result = evaluation ? evaluation.result : 'pending';
      if (result !== filters.verdict && claim.status !== filters.verdict) return false;
    }
    return true;
  });
}

function sortClaims(claims, sortBy) {
  if (!claims) return [];
  var copy = claims.slice();
  var sorts = {
    date_desc: function (a, b) { return (b.baseDate || '').localeCompare(a.baseDate || ''); },
    date_asc: function (a, b) { return (a.baseDate || '').localeCompare(b.baseDate || ''); },
    expert: function (a, b) { return (a.expertId || '').localeCompare(b.expertId || ''); }
  };
  return copy.sort(sorts[sortBy] || sorts.date_desc);
}

function findEvaluation(claimId, evaluations) {
  for (var i = 0; i < evaluations.length; i++) {
    if (evaluations[i].claimId === claimId) return evaluations[i];
  }
  return null;
}

function getExpertName(expertId, data) {
  var experts = data && Array.isArray(data.experts) ? data.experts : [];
  for (var i = 0; i < experts.length; i++) {
    if (experts[i].id === expertId) return experts[i].displayName || experts[i].name || expertId;
  }
  return expertId || '-';
}

function unique(items) {
  var out = [];
  items.forEach(function (item) {
    if (item && out.indexOf(item) === -1) out.push(item);
  });
  return out;
}


function attachRowClickHandlers(container, data) {
  var rows = container.querySelectorAll('.claim-row');
  for (var i = 0; i < rows.length; i++) {
    (function(row) {
      row.addEventListener('click', function() {
        var claimId = row.getAttribute('data-claim-id');
        if (claimId && typeof FMStock.ui.claims.detail.renderClaimDetail === 'function') {
          FMStock.ui.claims.detail.renderClaimDetail(claimId, data);
        }
      });
    })(rows[i]);
  }
}

window.FMStock.ui.claims.list = {
  renderClaimsList: renderClaimsList,
  createClaimRow: createClaimRow,
  renderClaimFilters: renderClaimFilters,
  filterClaims: filterClaims,
  sortClaims: sortClaims,
  findEvaluation: findEvaluation,
  getExpertName: getExpertName
};
