/**
 * app-main.js — Application entry point
 * Namespace: FMStock.app
 */

window.FMStock = window.FMStock || {};
window.FMStock.app = window.FMStock.app || {};

(function () {
  'use strict';

  var App = window.FMStock.app;

  App.init = async function () {
    try {
      App.state.init();

      var data = await loadAllData();
      App.state.set('data', data);

      App.router.handlePage();
      initCurrentPage();
    } catch (err) {
      console.error('[App] Failed to initialise:', err);
      renderBootError(err);
    }
  };

  async function loadAllData() {
    // Prefer FMStock.data.loadAll (new), fall back to DataLoader.loadAllData (legacy)
    if (window.FMStock && window.FMStock.data && typeof window.FMStock.data.loadAll === 'function') {
      return await window.FMStock.data.loadAll();
    }
    if (window.DataLoader && typeof window.DataLoader.loadAllData === 'function') {
      return await window.DataLoader.loadAllData();
    }
    throw new Error('DataLoader is not available. Check script loading order.');
  }

  function initCurrentPage() {
    var page = App.state.get('currentPage') || getCurrentPageName();
    var data = App.state.get('data') || {};

    var initializer = PAGE_INITIALIZERS[page];
    if (typeof initializer === 'function') {
      initializer(data);
    } else {
      console.log('[App] No initializer registered for page:', page);
    }
  }

  var PAGE_INITIALIZERS = {
    'index.html': function (data) {
      renderDashboardFallback(data);
      if (window.FMStock.ui && window.FMStock.ui.dashboard && window.FMStock.ui.dashboard.render &&
          typeof window.FMStock.ui.dashboard.render.renderDashboard === 'function') {
        window.FMStock.ui.dashboard.render.renderDashboard(data);
      }
    },
    'claims.html': function (data) {
      if (window.FMStock.ui && window.FMStock.ui.claims && window.FMStock.ui.claims.main &&
          typeof window.FMStock.ui.claims.main.initClaimsPage === 'function') {
        window.FMStock.ui.claims.main.initClaimsPage(data);
      }
    },
    'source-hub.html': function (data) {
      if (window.FMStock.ui && window.FMStock.ui.sourceHub && window.FMStock.ui.sourceHub.main &&
          typeof window.FMStock.ui.sourceHub.main.initSourceHubPage === 'function') {
        window.FMStock.ui.sourceHub.main.initSourceHubPage(data);
      }
    },
    'experts.html': function () {
      if (window.FMStock.ui && window.FMStock.ui.experts && window.FMStock.ui.experts.main &&
          typeof window.FMStock.ui.experts.main.initExpertsList === 'function') {
        window.FMStock.ui.experts.main.initExpertsList();
      }
    },
    'experts-detail.html': function () {
      if (window.FMStock.ui && window.FMStock.ui.experts && window.FMStock.ui.experts.main &&
          typeof window.FMStock.ui.experts.main.initExpertDetail === 'function') {
        window.FMStock.ui.experts.main.initExpertDetail();
      }
    },
    'review.html': function (data) {
      if (window.FMStock.ui && window.FMStock.ui.review && window.FMStock.ui.review.main &&
          typeof window.FMStock.ui.review.main.initReviewPage === 'function') {
        window.FMStock.ui.review.main.initReviewPage(data);
      }
    },
    'knowledge.html': function (data) {
      if (window.FMStock.ui && window.FMStock.ui.knowledge && window.FMStock.ui.knowledge.main &&
          typeof window.FMStock.ui.knowledge.main.initKnowledgePage === 'function') {
        window.FMStock.ui.knowledge.main.initKnowledgePage(data);
      }
    },
    'ranking.html': function (data) {
      if (window.FMStock.ui && window.FMStock.ui.ranking && window.FMStock.ui.ranking.main &&
          typeof window.FMStock.ui.ranking.main.initRankingPage === 'function') {
        window.FMStock.ui.ranking.main.initRankingPage(data);
      }
    },
    'sources.html': function (data) {
      if (window.FMStock.ui && window.FMStock.ui.sources && window.FMStock.ui.sources.main &&
          typeof window.FMStock.ui.sources.main.initSourcesList === 'function') {
        window.FMStock.ui.sources.main.initSourcesList(data);
      }
    }
  };

  function getCurrentPageName() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    if (page.indexOf('.html') === -1) page += '.html';
    return page;
  }

  function renderDashboardFallback(data) {
    setText('stat-sources', count(data.sources));
    setText('stat-claims', count(data.claims));
    setText('stat-verified', count((data.evaluations || []).filter(function (e) {
      return e.result && e.result !== 'invalid';
    })));
    setText('stat-knowledge', count(data.knowledgeNotes));
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function count(value) {
    return Array.isArray(value) ? value.length : 0;
  }

  /**
   * Render a boot-time error to the DOM.
   * Creates an #error-container div dynamically if one does not exist.
   */
  function renderBootError(err) {
    var message = err && err.message ? err.message : 'Unknown error';

    // Build diagnostics hint
    var diagnosticsHint = '';
    if (window.FMStock && window.FMStock.data && typeof window.FMStock.data.getDiagnostics === 'function') {
      diagnosticsHint = ' 브라우저 콘솔에서 FMStock.data.getDiagnostics() 로 자세한 정보를 확인하세요.';
    }

    var container = document.getElementById('error-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'error-container';
      var target = document.querySelector('.app-main') || document.body;
      target.insertBefore(container, target.firstChild);
    }
    container.innerHTML = '<div class="alert alert-error" role="alert" style="padding:1em;margin-bottom:1em;border:2px solid #c00;background:#fee;color:#c00;border-radius:6px;font-weight:bold">' +
      escapeHtml('앱 초기화 중 오류가 발생했습니다: ' + message + diagnosticsHint) + '</div>';
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
  } else {
    App.init();
  }

  window.addEventListener('error', function (e) {
    console.error('[App] Uncaught error:', e.error || e.message);
  });
})();
