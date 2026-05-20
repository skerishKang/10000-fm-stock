/**
 * ranking-main.js - Ranking Page Entry Point
 * Initializes the ranking page with default 'return' tab.
 * Aligned with ranking.html DOM structure:
 *   - Tab buttons: class="tab", data-tab = return|excess|alpha|hitrate|industry|knowledge
 *   - Content panels: id="rank-{tab}", list: id="rank-{tab}-list"
 * Namespace: FMStock.ui.ranking.main
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.ranking = window.FMStock.ui.ranking || {};

/**
 * Maps HTML data-tab attribute values to ranking-render.js tab names.
 * ranking.html uses: return, excess, alpha, hitrate, industry, knowledge
 * ranking-render.js renderRankingTab expects: return, alpha, expert-alpha, hit-rate, industry, knowledge
 */
var TAB_NAME_MAP = {
  'return':    'return',
  'excess':    'alpha',
  'alpha':     'expert-alpha',
  'hitrate':   'hit-rate',
  'industry':  'industry',
  'knowledge': 'knowledge'
};

function initRankingPage(data) {
  // Check that at least one ranking tab panel exists
  var firstPanel = document.getElementById('rank-return');
  if (!firstPanel) {
    console.warn('[ranking-main] #rank-return panel not found — is this ranking.html?');
    return;
  }

  if (!data) {
    if (firstPanel) firstPanel.innerHTML = '<div class="empty">\ub7ad\ud0b9 \ub370\uc774\ud130\ub97c \ubd88\ub7ec\uc62c \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.</div>';
    return;
  }

  // Use .tab class (actual HTML class, not .ranking-tab)
  var tabs = document.querySelectorAll('.tab[data-tab]');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      // Update active tab styling
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');

      var htmlTabName = tab.dataset.tab;
      var renderTabName = TAB_NAME_MAP[htmlTabName] || htmlTabName;

      // Show active panel, hide others
      document.querySelectorAll('.tab-content[id^="rank-"]').forEach(function(panel) {
        panel.classList.remove('active');
      });
      var activePanel = document.getElementById('rank-' + htmlTabName);
      if (activePanel) activePanel.classList.add('active');

      // Render into the list element inside the panel
      renderRankingTabIntoList(htmlTabName, renderTabName, data);
    });
  });

  // Render the default 'return' tab on load
  renderRankingTabIntoList('return', 'return', data);

  console.log('[ranking-main] Initialized ranking page');
}

function renderRankingTabIntoList(htmlTabName, renderTabName, data) {
  var listEl = document.getElementById('rank-' + htmlTabName + '-list');
  var sampleEl = document.getElementById('sample-' + htmlTabName);
  var RR = window.FMStock.ui.ranking.render;

  if (!listEl || !RR || typeof RR.renderRankingTab !== 'function') return;

  // Temporarily set the list element as the render target
  // ranking-render.js looks for #ranking-content or #rank-{tabName}
  // We use a delegate: call the render function and capture the output
  var html = RR.buildRankingHtml(renderTabName, data);
  listEl.innerHTML = html;

  // Update sample count if available
  if (sampleEl) {
    var count = getRankingCount(renderTabName, data);
    sampleEl.textContent = count;
  }
}

function getRankingCount(tabName, data) {
  switch (tabName) {
    case 'return':      return (data.evaluations || []).filter(function(e) { return e.returnRate != null; }).length;
    case 'alpha':       return (data.evaluations || []).filter(function(e) { return e.alpha != null; }).length;
    case 'expert-alpha': return (data.experts || []).length;
    case 'hit-rate':    return (data.experts || []).length;
    case 'industry':    return (data.claims || []).length;
    case 'knowledge':   return (data.knowledgeNotes || []).length;
    default:            return 0;
  }
}

window.FMStock.ui.ranking.main = {
  initRankingPage: initRankingPage
};
