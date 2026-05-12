/** app-main.js — Application entry point */
(function () {
  'use strict';

  window.App = window.App || {};

  // ── Init ────────────────────────────────────────────────
  App.init = function () {
    App.state.init();
    loadAllData();
    App.router.handlePage();
  };

  // ── Data loader (stub) ──────────────────────────────────
  function loadAllData() {
    // TODO: fetch data from JSON endpoints
    App.state.set('data', { loaded: true });
  }

  // ── Boot ────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
  } else {
    App.init();
  }

  // ── Global error handler ────────────────────────────────
  window.addEventListener('error', function (e) {
    console.error('[App] Uncaught error:', e.error || e.message);
  });

})();
