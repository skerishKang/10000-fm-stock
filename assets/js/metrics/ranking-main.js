/**
 * ranking-main.js - Ranking Page Entry Point
 * Initializes the ranking page with default 'return' tab.
 */

import { renderRankingTab, initRankingTabs } from './ranking-render.js';

export async function initRankingPage() {
  var container = document.getElementById('ranking-app');
  if (!container) return;

  try {
    var res = await fetch('/api/ranking');
    var data = await res.json();

    initRankingTabs();

    renderRankingTab('return', data);

    document.addEventListener('ranking-tab-change', function(e) {
      renderRankingTab(e.detail.tab, data);
    });

    console.log('[ranking-main] Initialized ranking page');
  } catch (err) {
    console.error('[ranking-main] Failed to initialize:', err);
    container.innerHTML = '<div class="error-state">\ub370\uc774\ud130\ub97c \ubd88\ub7ec\uc624\ub294 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.</div>';
  }
}
