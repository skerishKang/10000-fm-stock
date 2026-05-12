/**
 * app-main.js — Application entry point
 * Namespace: FMStock.app
 */

window.FMStock = window.FMStock || {};
window.FMStock.app = window.FMStock.app || {};

(function () {
  'use strict';

  var App = window.FMStock.app;

  App.init = function () {
    App.state.init();
    loadAllData();
    App.router.handlePage();
  };

  function loadAllData() {
    App.state.set('data', { loaded: true });
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
