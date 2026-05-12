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
    if (!window.DataLoader || typeof window.DataLoader.loadAllData !== 'function') {
      throw new Error('DataLoader.loadAllData is not available. Check script loading order.');
    }
    return await window.DataLoader.loadAllData();
  }

  function initCurrentPage() {
    var page = App.state.get('currentPage') || getCurrentPageName();
    var data = App.state.get('data') || {};

    if (page === 'index.html') {
      renderDashboardFallback(data);
      if (window.FMStock.ui && window.FMStock.ui.dashboard && window.FMStock.ui.dashboard.render &&
          typeof window.FMStock.ui.dashboard.render.renderDashboard === 'function') {
        window.FMStock.ui.dashboard.render.renderDashboard(data);
      }
      return;
    }

    if (page === 'claims.html' && window.FMStock.ui && window.FMStock.ui.claims && window.FMStock.ui.claims.main &&
        typeof window.FMStock.ui.claims.main.initClaimsPage === 'function') {
      window.FMStock.ui.claims.main.initClaimsPage(data);
    }
  }

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

  function renderBootError(err) {
    var main = document.querySelector('.app-main');
    if (!main) return;
    var message = err && err.message ? err.message : 'Unknown error';
    main.insertAdjacentHTML('afterbegin',
      '<div class="alert alert-error" role="alert">앱 초기화 중 오류가 발생했습니다: ' + escapeHtml(message) + '</div>'
    );
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
