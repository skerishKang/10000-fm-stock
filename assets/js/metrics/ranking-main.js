/**
 * ranking-main.js - Ranking Page Entry Point
 * Initializes the ranking page with default 'return' tab.
 * Namespace: FMStock.ui.ranking.main
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.ranking = window.FMStock.ui.ranking || {};

function initRankingPage(data) {
  var container = document.getElementById('ranking-app');
  if (!container) return;

  if (!data) {
    container.innerHTML = '<div class="empty">랭킹 데이터를 불러올 수 없습니다.</div>';
    return;
  }

  window.FMStock.ui.ranking.render.initRankingTabs();
  window.FMStock.ui.ranking.render.renderRankingTab('return', data);

  document.addEventListener('ranking-tab-change', function(e) {
    window.FMStock.ui.ranking.render.renderRankingTab(e.detail.tab, data);
  });

  console.log('[ranking-main] Initialized ranking page');
}

window.FMStock.ui.ranking.main = {
  initRankingPage: initRankingPage
};
