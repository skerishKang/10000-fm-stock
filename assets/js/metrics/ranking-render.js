/**
 * ranking-render.js - Ranking Tab Renderer
 * Renders 6 ranking tabs with individual ranking algorithms.
 * Namespace: FMStock.ui.ranking.render
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.ranking = window.FMStock.ui.ranking || {};

function renderRankingTab(tabName, data) {
  var container = document.getElementById('ranking-content');
  if (!container) return;
  var N = 20;
  var html = '';
  switch (tabName) {
    case 'return': html = renderReturnRanking(data, N); break;
    case 'alpha': html = renderAlphaRanking(data, N); break;
    case 'expert-alpha': html = renderExpertAlphaRanking(data, N, 5); break;
    case 'hit-rate': html = renderHitRateRanking(data, N, 5); break;
    case 'industry': html = renderIndustryRanking(data, 'all'); break;
    case 'knowledge': html = renderKnowledgeRanking(data, N); break;
    default: html = '<div class="empty-state">선택한 탭이 없습니다.</div>';
  }
  container.innerHTML = html;
}

function initRankingTabs() {
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

function renderReturnRanking(data, N) {
  var items = (data.returns || []).sort(function(a, b) { return (b.return || 0) - (a.return || 0); }).slice(0, N);
  return buildRankingTable('수익률 TOP', items, 'return');
}

function renderAlphaRanking(data, N) {
  var items = (data.alphas || data.returns || []).sort(function(a, b) {
    return (b.alpha || b.excessReturn || 0) - (a.alpha || a.excessReturn || 0);
  }).slice(0, N);
  return buildRankingTable('초과수익률 TOP', items, 'alpha');
}

function renderExpertAlphaRanking(data, N, minSample) {
  var items = (data.experts || []).filter(function(e) {
    return (e.sampleSize || e.count || 0) >= minSample;
  }).sort(function(a, b) { return (b.alpha || 0) - (a.alpha || 0); }).slice(0, N);
  return buildRankingTable('전문가 알파 랭킹', items, 'expert-alpha');
}

function renderHitRateRanking(data, N, minSample) {
  var items = (data.experts || []).filter(function(e) {
    return (e.sampleSize || e.count || 0) >= minSample;
  }).sort(function(a, b) { return (b.hitRate || 0) - (a.hitRate || 0); }).slice(0, N);
  return buildRankingTable('적중률 랭킹', items, 'hit-rate');
}

function renderIndustryRanking(data, industry) {
  var items = (data.industries || []).filter(function(ind) {
    return industry === 'all' || ind.name === industry;
  }).sort(function(a, b) { return (b.return || 0) - (a.return || 0); });
  return buildRankingTable(industry === 'all' ? '산업별 랭킹' : industry + ' 랭킹', items, 'industry');
}

function renderKnowledgeRanking(data, N) {
  var items = (data.knowledgeContributors || data.notes || []).sort(function(a, b) {
    return (b.contributions || b.score || 0) - (a.contributions || a.score || 0);
  }).slice(0, N);
  return buildRankingTable('지식 기여 랭킹', items, 'knowledge');
}

function createRankingRow(item, rank) {
  var name = item.name || item.title || item.stock || item.expert || '-';
  var value = item.return != null ? item.return : item.alpha != null ? item.alpha : item.excessReturn != null ? item.excessReturn : item.hitRate != null ? item.hitRate : item.contributions != null ? item.contributions : item.score != null ? item.score : 0;
  var formatted = typeof value === 'number' ? value.toFixed(2) + '%' : value;
  var detail = item.sampleSize ? '(표본: ' + item.sampleSize + ')' : item.count ? '(표본: ' + item.count + ')' : '';
  return '<tr class="ranking-row"><td class="rank">' + rank + '</td><td class="name">' + escapeHtml(name) + '</td><td class="value">' + escapeHtml(formatted) + '</td><td class="detail">' + escapeHtml(detail) + '</td></tr>';
}

function buildRankingTable(title, items, type) {
  if (!items.length) return '<div class="empty-state">데이터가 없습니다.</div>';
  var rows = items.map(function(item, i) { return createRankingRow(item, i + 1); }).join('');
  return '<div class="ranking-table-wrapper"><h3 class="ranking-title">' + escapeHtml(title) + '</h3>' +
    '<table class="ranking-table"><thead><tr><th>순위</th><th>이름</th><th>' + escapeHtml(getValueLabel(type)) + '</th><th>비고</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function getValueLabel(type) {
  var labels = { 'return': '수익률', 'alpha': '초과수익률', 'expert-alpha': '알파', 'hit-rate': '적중률', 'industry': '수익률', 'knowledge': '기여도' };
  return labels[type] || '값';
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
  });
}

window.FMStock.ui.ranking.render = {
  renderRankingTab: renderRankingTab,
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
