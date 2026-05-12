/**
 * ranking-main.js - Ranking Page Entry Point
 * Initializes the ranking page with default 'return' tab.
 * Namespace: FMStock.ui.ranking.main
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.ranking = window.FMStock.ui.ranking || {};

async function initRankingPage() {
  var container = document.getElementById('ranking-app');
  if (!container) return;

  try {
    var res = await fetch('/api/ranking');
    var data = await res.json();

    window.FMStock.ui.ranking.render.initRankingTabs();
    window.FMStock.ui.ranking.render.renderRankingTab('return', data);

    document.addEventListener('ranking-tab-change', function(e) {
      window.FMStock.ui.ranking.render.renderRankingTab(e.detail.tab, data);
    });

    console.log('[ranking-main] Initialized ranking page');
  } catch (err) {
    console.error('[ranking-main] Failed to initialize:', err);
    container.innerHTML = '<div class="error-state">데이터를 불러오는 중 오류가 발생했습니다.</div>';
  }
}

window.FMStock.ui.ranking.main = {
  initRankingPage: initRankingPage
};
