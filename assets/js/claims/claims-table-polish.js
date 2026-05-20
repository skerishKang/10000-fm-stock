(function () {
  'use strict';

  window.FMStock = window.FMStock || {};
  window.FMStock.ui = window.FMStock.ui || {};
  window.FMStock.ui.claims = window.FMStock.ui.claims || {};

  var CL = window.FMStock.ui.claims.list || {};
  var CF = window.FMStock.ui.claims.filter || {};

  var VERDICT_LABELS = {
    hit: '적중',
    partial_hit: '부분 적중',
    miss: '실패',
    pending: '검증 대기',
    invalid: '무효',
    educational_onlyinvalid: '교육용/무효',
    evaluated: '검증 완료'
  };

  var DIRECTION_LABELS = {
    bullish: '상승',
    bearish: '하락',
    neutral: '중립',
    educational_only: '교육용'
  };

  function escapeHtml(value) {
    if (window.FMStock.security && typeof window.FMStock.security.escapeHtml === 'function') {
      return window.FMStock.security.escapeHtml(value);
    }
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
    });
  }

  function escapeAttr(value) {
    if (window.FMStock.security && typeof window.FMStock.security.escapeAttr === 'function') {
      return window.FMStock.security.escapeAttr(value);
    }
    return escapeHtml(value);
  }

  function safeClassToken(value) {
    return String(value == null ? '' : value).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }

  function unique(items) {
    var out = [];
    (items || []).forEach(function (item) {
      if (item && out.indexOf(item) === -1) out.push(item);
    });
    return out;
  }

  function getClaimVerdict(claim, evaluation) {
    if (evaluation && evaluation.result) return evaluation.result;
    if (claim && claim.status && claim.status !== 'evaluated') return claim.status;
    return 'pending';
  }

  function getVerdictLabel(value) {
    var key = String(value || 'pending');
    return VERDICT_LABELS[key] || key;
  }

  function getDirectionLabel(value) {
    var key = String(value || '');
    return DIRECTION_LABELS[key] || key || '-';
  }

  function getExpertName(expertId, data) {
    if (typeof CL.getExpertName === 'function') return CL.getExpertName(expertId, data);
    return expertId || '-';
  }

  function findEvaluation(claimId, evaluations) {
    if (typeof CL.findEvaluation === 'function') return CL.findEvaluation(claimId, evaluations || []);
    for (var i = 0; i < (evaluations || []).length; i++) {
      if (evaluations[i].claimId === claimId) return evaluations[i];
    }
    return null;
  }

  function createClaimRow(claim, evaluation, data) {
    if (!claim) return '';

    var verdict = getClaimVerdict(claim, evaluation);
    var verdictClass = safeClassToken(verdict || 'pending');
    var directionClass = safeClassToken(claim.direction || 'unknown');
    var expertName = getExpertName(claim.expertId, data);
    var companyName = claim.companyName || claim.ticker || '-';
    var ticker = claim.ticker || '';
    var meta = [claim.timeHorizon, claim.targetDate ? '목표일 ' + claim.targetDate : ''].filter(Boolean).join(' · ');

    var html = '<tr class="claim-row" data-claim-id="' + escapeAttr(claim.id) + '">';
    html += '<td class="claim-text-cell"><div class="claim-copy">' + escapeHtml(claim.claimText || '') + '</div>';
    if (meta) html += '<div class="claim-submeta">' + escapeHtml(meta) + '</div>';
    html += '</td>';
    html += '<td class="claim-speaker">' + escapeHtml(expertName) + '</td>';
    html += '<td class="claim-stock"><span class="stock-name">' + escapeHtml(companyName) + '</span>';
    if (ticker) html += '<span class="stock-ticker">' + escapeHtml(ticker) + '</span>';
    html += '</td>';
    html += '<td class="claim-industry">' + escapeHtml(claim.industry || '-') + '</td>';
    html += '<td><span class="badge badge-direction direction-' + escapeAttr(directionClass) + '">' + escapeHtml(getDirectionLabel(claim.direction)) + '</span></td>';
    html += '<td><span class="badge badge-verdict verdict-' + escapeAttr(verdictClass) + '">' + escapeHtml(getVerdictLabel(verdict)) + '</span></td>';
    html += '<td class="claim-date">' + escapeHtml(claim.baseDate || '') + '</td>';
    html += '</tr>';
    return html;
  }

  function renderClaimsList(claims, evaluations, data) {
    var container = document.getElementById('claims-list');
    if (!container) return;

    var dataset = data || {};
    var claimList = Array.isArray(claims) ? claims : [];
    var evaluationList = Array.isArray(evaluations) ? evaluations : [];
    var filters = typeof CF.getActiveFilters === 'function' ? CF.getActiveFilters() : {};
    var filtered = typeof CL.filterClaims === 'function'
      ? CL.filterClaims(claimList, filters, evaluationList, dataset)
      : claimList;
    var sorted = typeof CL.sortClaims === 'function'
      ? CL.sortClaims(filtered, 'date_desc')
      : filtered.slice();

    if (!sorted.length) {
      container.innerHTML = '<ul class="item-list"><li class="placeholder">조건에 맞는 발언 데이터가 없습니다.</li></ul>';
      return;
    }

    container.innerHTML = '<div class="claims-count">' + sorted.length + '개 발언</div>' +
      '<table class="claims-table data-table"><thead><tr>' +
      '<th class="claim-column-text">발언</th><th>발언자</th><th>종목</th><th>산업</th><th>방향</th><th>판정</th><th>기준일</th>' +
      '</tr></thead><tbody>' +
      sorted.map(function (claim) {
        return createClaimRow(claim, findEvaluation(claim.id, evaluationList), dataset);
      }).join('') +
      '</tbody></table>';

    attachRowClickHandlers(container, dataset);
  }

  function renderClaimFilters(data) {
    data = data || {};
    var claims = Array.isArray(data.claims) ? data.claims : [];
    var speakers = unique(claims.map(function (claim) { return claim.expertId; })).map(function (expertId) {
      return { id: expertId, name: getExpertName(expertId, data) };
    });
    var tickers = unique(claims.map(function (claim) { return claim.ticker; }).filter(Boolean));
    var industries = unique(claims.map(function (claim) { return claim.industry; }).filter(Boolean));

    var speaker = document.getElementById('cf-speaker');
    if (speaker) {
      speaker.innerHTML = '<option value="">발언자 전체</option>' + speakers.map(function (item) {
        return '<option value="' + escapeAttr(item.id) + '">' + escapeHtml(item.name) + '</option>';
      }).join('');
    }

    var ticker = document.getElementById('cf-ticker');
    if (ticker) {
      ticker.innerHTML = '<option value="">종목 전체</option>' + tickers.map(function (item) {
        return '<option value="' + escapeAttr(item) + '">' + escapeHtml(item) + '</option>';
      }).join('');
    }

    var industry = document.getElementById('cf-industry');
    if (industry) {
      industry.innerHTML = '<option value="">산업 전체</option>' + industries.map(function (item) {
        return '<option value="' + escapeAttr(item) + '">' + escapeHtml(item) + '</option>';
      }).join('');
    }

    var direction = document.getElementById('cf-direction');
    if (direction) {
      direction.innerHTML = '<option value="">방향성 전체</option><option value="bullish">상승</option><option value="bearish">하락</option><option value="neutral">중립</option><option value="educational_only">교육용</option>';
    }

    var verdict = document.getElementById('cf-verdict');
    if (verdict) {
      verdict.innerHTML = '<option value="">판정 전체</option>' +
        '<option value="hit">적중</option>' +
        '<option value="partial_hit">부분 적중</option>' +
        '<option value="miss">실패</option>' +
        '<option value="pending">검증 대기</option>' +
        '<option value="invalid">무효</option>' +
        '<option value="educational_onlyinvalid">교육용/무효</option>';
    }
  }

  function attachRowClickHandlers(container, data) {
    var rows = container.querySelectorAll('.claim-row');
    for (var i = 0; i < rows.length; i++) {
      (function (row) {
        row.addEventListener('click', function () {
          var claimId = row.getAttribute('data-claim-id');
          for (var j = 0; j < rows.length; j++) rows[j].classList.remove('is-selected');
          row.classList.add('is-selected');
          if (claimId && window.FMStock.ui.claims.detail && typeof window.FMStock.ui.claims.detail.renderClaimDetail === 'function') {
            window.FMStock.ui.claims.detail.renderClaimDetail(claimId, data);
          }
        });
      })(rows[i]);
    }
  }

  CL.renderClaimsList = renderClaimsList;
  CL.createClaimRow = createClaimRow;
  CL.renderClaimFilters = renderClaimFilters;
  CL.getClaimVerdict = getClaimVerdict;
  CL.getVerdictLabel = getVerdictLabel;
  CL.getDirectionLabel = getDirectionLabel;

  window.FMStock.ui.claims.labels = {
    getClaimVerdict: getClaimVerdict,
    getVerdictLabel: getVerdictLabel,
    getDirectionLabel: getDirectionLabel,
    safeClassToken: safeClassToken
  };
})();
