/**
 * ranking-render.js - Ranking Tab Renderer
 * Renders 6 ranking tabs with individual ranking algorithms.
 * Aligned with actual data schema (evaluations.returnRate, evaluations.alpha, etc.)
 * Namespace: FMStock.ui.ranking.render
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.ranking = window.FMStock.ui.ranking || {};

/**
 * renderRankingTab — legacy entry point kept for compatibility.
 * Renders into #ranking-content or #rank-{tabName} (the panel div, not the list).
 * ranking-main.js now uses buildRankingHtml + direct innerHTML injection into rank-{tab}-list.
 */
function renderRankingTab(tabName, data) {
  var container = document.getElementById('ranking-content') || document.getElementById('rank-' + tabName);
  if (!container) return;
  var html = buildRankingHtml(tabName, data);
  container.innerHTML = html;
}

/**
 * buildRankingHtml — returns HTML string for the given tab name.
 * Used by ranking-main.js to inject into rank-{tab}-list elements.
 */
function buildRankingHtml(tabName, data) {
  var N = 20;
  switch (tabName) {
    case 'return':        return renderReturnRanking(data, N);
    case 'alpha':         return renderAlphaRanking(data, N);
    case 'expert-alpha':  return renderExpertAlphaRanking(data, N, 3);
    case 'hit-rate':      return renderHitRateRanking(data, N, 3);
    case 'industry':      return renderIndustryRanking(data, 'all');
    case 'knowledge':     return renderKnowledgeRanking(data, N);
    default:              return '<li class="empty-state">\uc120\ud0dd\ud55c \ud0ed\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</li>';
  }
}

function initRankingTabs() {
  // Legacy: fires ranking-tab-change event for old-style listeners.
  // ranking-main.js now handles tab clicks directly.
  document.querySelectorAll('.ranking-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.ranking-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var tabName = tab.dataset.tab;
      var event = new CustomEvent('ranking-tab-change', { detail: { tab: tabName } });
      document.dispatchEvent(event);
    });
  });
}

/**
 * renderReturnRanking — sorts evaluations by returnRate desc.
 * evaluations.json fields: claimId, returnRate, alpha, result
 */
function renderReturnRanking(data, N) {
  var claimsById = {};
  (data.claims || []).forEach(function(c) { claimsById[c.id] = c; });
  var expertsById = {};
  (data.experts || []).forEach(function(ex) { expertsById[ex.id] = ex; });

  var items = (data.evaluations || []).filter(function(e) {
    return e.returnRate != null;
  }).slice().sort(function(a, b) {
    return (b.returnRate || 0) - (a.returnRate || 0);
  }).slice(0, N).map(function(e) {
    var claim = claimsById[e.claimId] || {};
    var expert = expertsById[claim.expertId] || {};
    var name = expert.displayName || expert.name || claim.expertId || e.claimId || '-';
    return { name: name, return: e.returnRate, sampleSize: null };
  });
  return buildRankingTable('\uc218\uc775\ub960 TOP', items, 'return');
}

/**
 * renderAlphaRanking — sorts evaluations by alpha desc.
 * evaluations.json fields: claimId, alpha
 */
function renderAlphaRanking(data, N) {
  var claimsById = {};
  (data.claims || []).forEach(function(c) { claimsById[c.id] = c; });
  var expertsById = {};
  (data.experts || []).forEach(function(ex) { expertsById[ex.id] = ex; });

  var items = (data.evaluations || []).filter(function(e) {
    return e.alpha != null;
  }).slice().sort(function(a, b) {
    return (b.alpha || 0) - (a.alpha || 0);
  }).slice(0, N).map(function(e) {
    var claim = claimsById[e.claimId] || {};
    var expert = expertsById[claim.expertId] || {};
    var name = expert.displayName || expert.name || claim.expertId || e.claimId || '-';
    return { name: name, alpha: e.alpha, excessReturn: e.alpha };
  });
  return buildRankingTable('\ucd08\uacfc\uc218\uc775\ub960 TOP', items, 'alpha');
}

/**
 * renderExpertAlphaRanking — uses metrics-experts.js getExpertStats for computed avgAlpha.
 */
function renderExpertAlphaRanking(data, N, minSample) {
  var E = window.FMStock && window.FMStock.metrics && window.FMStock.metrics.experts;
  if (!E || typeof E.getExpertStats !== 'function') {
    // Fallback: use raw expert data if metrics module not available
    var items = (data.experts || []).slice(0, N).map(function(ex) {
      return { name: ex.displayName || ex.name || '-', alpha: null };
    });
    return buildRankingTable('\uc804\ubb38\uac00 \uc54c\ud30c \ub7ad\ud0b9', items, 'expert-alpha');
  }
  var ranked = (data.experts || []).map(function(ex) {
    var stats = E.getExpertStats(ex.id, data.claims, data.evaluations);
    return { name: ex.displayName || ex.name || '-', alpha: stats.avgAlpha, count: stats.verified };
  }).filter(function(item) {
    return item.count >= (minSample || 3) && item.alpha != null;
  }).sort(function(a, b) {
    return (b.alpha || 0) - (a.alpha || 0);
  }).slice(0, N);
  return buildRankingTable('\uc804\ubb38\uac00 \uc54c\ud30c \ub7ad\ud0b9', ranked, 'expert-alpha');
}

/**
 * renderHitRateRanking — uses metrics-experts.js getExpertStats for computed hitRate.
 */
function renderHitRateRanking(data, N, minSample) {
  var E = window.FMStock && window.FMStock.metrics && window.FMStock.metrics.experts;
  if (!E || typeof E.getExpertStats !== 'function') {
    var items = (data.experts || []).slice(0, N).map(function(ex) {
      return { name: ex.displayName || ex.name || '-', hitRate: null };
    });
    return buildRankingTable('\uc801\uc911\ub960 \ub7ad\ud0b9', items, 'hit-rate');
  }
  var ranked = (data.experts || []).map(function(ex) {
    var stats = E.getExpertStats(ex.id, data.claims, data.evaluations);
    return { name: ex.displayName || ex.name || '-', hitRate: stats.hitRate, count: stats.verified };
  }).filter(function(item) {
    return item.count >= (minSample || 3) && item.hitRate != null;
  }).sort(function(a, b) {
    return (b.hitRate || 0) - (a.hitRate || 0);
  }).slice(0, N);
  return buildRankingTable('\uc801\uc911\ub960 \ub7ad\ud0b9', ranked, 'hit-rate');
}

/**
 * renderIndustryRanking — uses metrics-experts.js getIndustryBreakdown.
 */
function renderIndustryRanking(data, industry) {
  var E = window.FMStock && window.FMStock.metrics && window.FMStock.metrics.experts;
  if (!E || typeof E.getIndustryBreakdown !== 'function') {
    return '<li class="empty-state">\uc0b0\uc5c5 \ub370\uc774\ud130\ub97c \uacc4\uc0b0\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.</li>';
  }
  // Aggregate all experts' industry breakdowns
  var industryMap = {};
  (data.experts || []).forEach(function(ex) {
    var breakdown = E.getIndustryBreakdown(ex.id, data.claims, data.evaluations);
    Object.keys(breakdown).forEach(function(ind) {
      if (industry !== 'all' && ind !== industry) return;
      if (!industryMap[ind]) industryMap[ind] = { name: ind, return: 0, count: 0 };
      var b = breakdown[ind];
      if (b.avgReturn != null) {
        industryMap[ind].return += b.avgReturn * b.verified;
        industryMap[ind].count += b.verified;
      }
    });
  });
  var items = Object.keys(industryMap).map(function(ind) {
    var d = industryMap[ind];
    return { name: ind, return: d.count > 0 ? d.return / d.count : 0 };
  }).sort(function(a, b) { return (b.return || 0) - (a.return || 0); });
  return buildRankingTable(industry === 'all' ? '\uc0b0\uc5c5\ubcc4 \ub7ad\ud0b9' : industry + ' \ub7ad\ud0b9', items, 'industry');
}

/**
 * renderKnowledgeRanking — uses knowledgeNotes (canonical field from data-loader.js).
 */
function renderKnowledgeRanking(data, N) {
  var expertsById = {};
  (data.experts || []).forEach(function(ex) { expertsById[ex.id] = ex; });

  // Count notes per expert
  var contributionMap = {};
  (data.knowledgeNotes || []).forEach(function(n) {
    var eid = n.expertId;
    if (!eid) return;
    if (!contributionMap[eid]) {
      var ex = expertsById[eid] || {};
      contributionMap[eid] = { name: ex.displayName || ex.name || eid, contributions: 0 };
    }
    contributionMap[eid].contributions++;
  });
  var items = Object.keys(contributionMap).map(function(eid) {
    return contributionMap[eid];
  }).sort(function(a, b) {
    return (b.contributions || 0) - (a.contributions || 0);
  }).slice(0, N);
  return buildRankingTable('\uc9c0\uc2dd \uae30\uc5ec \ub7ad\ud0b9', items, 'knowledge');
}

function createRankingRow(item, rank) {
  var name = item.name || item.title || item.stock || item.expert || '-';
  var value = item.return != null ? item.return
    : item.alpha != null ? item.alpha
    : item.excessReturn != null ? item.excessReturn
    : item.hitRate != null ? (item.hitRate * 100)
    : item.contributions != null ? item.contributions
    : item.score != null ? item.score : 0;
  var formatted = typeof value === 'number'
    ? (value < 1 && item.hitRate != null ? value.toFixed(1) + '%' : value.toFixed(2) + '%')
    : String(value);
  // For contributions (integer), don't add %
  if (item.contributions != null && item.hitRate == null && item.return == null && item.alpha == null) {
    formatted = String(item.contributions || 0);
  }
  var detail = item.count != null ? '(\ud45c\ubcf8: ' + item.count + ')' : '';
  return '<li class="rank-item"><span class="rank-num">' + rank + '</span><span class="rank-name">' +
    FMStock.security.escapeHtml(name) + '</span><span class="rank-value">' +
    FMStock.security.escapeHtml(formatted) + '</span>' +
    (detail ? '<span class="rank-detail">' + FMStock.security.escapeHtml(detail) + '</span>' : '') +
    '</li>';
}

function buildRankingTable(title, items, type) {
  if (!items || !items.length) {
    var emptyMsg = '\ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.';
    if (type === 'return' || type === 'alpha') emptyMsg = '\uac80\uc99d \uc644\ub8cc\ub41c \ud3c9\uac00 \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.';
    else if (type === 'expert-alpha' || type === 'hit-rate') emptyMsg = '\ud45c\ubcf8 \uc218\uac00 \ubd80\uc871\ud569\ub2c8\ub2e4.';
    else if (type === 'knowledge') emptyMsg = '\uc9c0\uc2dd\ub178\ud2b8 \uae30\uc5ec \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.';
    else if (type === 'industry') emptyMsg = '\ubd84\uc11d \uac00\ub2a5\ud55c \uc0b0\uc5c5 \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.';
    return '<li class="empty-state">' + emptyMsg + '</li>';
  }
  return items.map(function(item, i) { return createRankingRow(item, i + 1); }).join('');
}

function getValueLabel(type) {
  var labels = { 'return': '\uc218\uc775\ub960', 'alpha': '\ucd08\uacfc\uc218\uc775\ub960', 'expert-alpha': '\uc54c\ud30c', 'hit-rate': '\uc801\uc911\ub960', 'industry': '\uc218\uc775\ub960', 'knowledge': '\uae30\uc5ec\ub3c4' };
  return labels[type] || '\uac12';
}


window.FMStock.ui.ranking.render = {
  renderRankingTab: renderRankingTab,
  buildRankingHtml: buildRankingHtml,
  initRankingTabs: initRankingTabs,
  renderReturnRanking: renderReturnRanking,
  renderAlphaRanking: renderAlphaRanking,
  renderExpertAlphaRanking: renderExpertAlphaRanking,
  renderHitRateRanking: renderHitRateRanking,
  renderIndustryRanking: renderIndustryRanking,
  renderKnowledgeRanking: renderKnowledgeRanking,
  createRankingRow: createRankingRow,
  buildRankingTable: buildRankingTable,
  getValueLabel: getValueLabel
};
