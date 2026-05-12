/**
 * ranking-render.js - Ranking Tab Renderer
 * Renders 6 ranking tabs with individual ranking algorithms.
 */

export function renderRankingTab(tabName, data) {
  var container = document.getElementById('ranking-content');
  if (!container) return;

  var N = 20;
  var html = '';

  switch (tabName) {
    case 'return':
      html = renderReturnRanking(data, N);
      break;
    case 'alpha':
      html = renderAlphaRanking(data, N);
      break;
    case 'expert-alpha':
      html = renderExpertAlphaRanking(data, N, 5);
      break;
    case 'hit-rate':
      html = renderHitRateRanking(data, N, 5);
      break;
    case 'industry':
      html = renderIndustryRanking(data, 'all');
      break;
    case 'knowledge':
      html = renderKnowledgeRanking(data, N);
      break;
    default:
      html = '<div class="empty-state">\uc120\ud0dd\ud55c \ud0ed\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>';
  }

  container.innerHTML = html;
}

export function initRankingTabs() {
  document.querySelectorAll('.ranking-tab').forEach(function(tab) {
    tab.addEventListener('click', function(e) {
      document.querySelectorAll('.ranking-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var tabName = tab.dataset.tab;
      var event = new CustomEvent('ranking-tab-change', { detail: { tab: tabName } });
      document.dispatchEvent(event);
    });
  });
}

export function renderReturnRanking(data, N) {
  var items = (data.returns || []).sort(function(a, b) { return (b.return || 0) - (a.return || 0); }).slice(0, N);
  return buildRankingTable('\uc218\uc775\ub960 TOP', items, 'return');
}

export function renderAlphaRanking(data, N) {
  var items = (data.alphas || data.returns || []).sort(function(a, b) {
    return (b.alpha || b.excessReturn || 0) - (a.alpha || a.excessReturn || 0);
  }).slice(0, N);
  return buildRankingTable('\ucd08\uacfc\uc218\uc775\ub960 TOP', items, 'alpha');
}

export function renderExpertAlphaRanking(data, N, minSample) {
  var items = (data.experts || []).filter(function(e) {
    return (e.sampleSize || e.count || 0) >= minSample;
  }).sort(function(a, b) { return (b.alpha || 0) - (a.alpha || 0); }).slice(0, N);
  return buildRankingTable('\uc804\ubb38\uac00 \uc54c\ud30c \ub7ad\ud0b9', items, 'expert-alpha');
}

export function renderHitRateRanking(data, N, minSample) {
  var items = (data.experts || []).filter(function(e) {
    return (e.sampleSize || e.count || 0) >= minSample;
  }).sort(function(a, b) { return (b.hitRate || 0) - (a.hitRate || 0); }).slice(0, N);
  return buildRankingTable('\uc801\uc911\ub960 \ub7ad\ud0b9', items, 'hit-rate');
}

export function renderIndustryRanking(data, industry) {
  var items = (data.industries || []).filter(function(ind) {
    return industry === 'all' || ind.name === industry;
  }).sort(function(a, b) { return (b.return || 0) - (a.return || 0); });
  return buildRankingTable(industry === 'all' ? '\uc0b0\uc5c5\ubcc4 \ub7ad\ud0b9' : industry + ' \ub7ad\ud0b9', items, 'industry');
}

export function renderKnowledgeRanking(data, N) {
  var items = (data.knowledgeContributors || data.notes || []).sort(function(a, b) {
    return (b.contributions || b.score || 0) - (a.contributions || a.score || 0);
  }).slice(0, N);
  return buildRankingTable('\uc9c0\uc2dd \uae30\uc5ec \ub7ad\ud0b9', items, 'knowledge');
}

export function createRankingRow(item, rank) {
  var name = item.name || item.title || item.stock || item.expert || '-';
  var value = item.return != null ? item.return : item.alpha != null ? item.alpha : item.excessReturn != null ? item.excessReturn : item.hitRate != null ? item.hitRate : item.contributions != null ? item.contributions : item.score != null ? item.score : 0;
  var formatted = typeof value === 'number' ? value.toFixed(2) + '%' : value;
  var detail = item.sampleSize ? '(\ud45c\ubcf8: ' + item.sampleSize + ')' : item.count ? '(\ud45c\ubcf8: ' + item.count + ')' : '';

  return '<tr class="ranking-row"><td class="rank">' + rank + '</td><td class="name">' + name + '</td><td class="value">' + formatted + '</td><td class="detail">' + detail + '</td></tr>';
}

function buildRankingTable(title, items, type) {
  if (!items.length) {
    return '<div class="empty-state">\ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</div>';
  }
  var rows = items.map(function(item, i) { return createRankingRow(item, i + 1); }).join('');
  return '<div class="ranking-table-wrapper"><h3 class="ranking-title">' + title + '</h3>' +
    '<table class="ranking-table"><thead><tr><th>\uc21c\uc704</th><th>\uc774\ub984</th><th>' + getValueLabel(type) + '</th><th>\ube44\uace0</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function getValueLabel(type) {
  var labels = { 'return': '\uc218\uc775\ub960', 'alpha': '\ucd08\uacfc\uc218\uc775\ub960', 'expert-alpha': '\uc54c\ud30c', 'hit-rate': '\uc801\uc911\ub960', 'industry': '\uc218\uc775\ub960', 'knowledge': '\uae30\uc5ec\ub3c4' };
  return labels[type] || '\uac12';
}
