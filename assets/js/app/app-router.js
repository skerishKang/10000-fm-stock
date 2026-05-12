/** app-router.js — Simple SPA-style page router */
(function () {
  'use strict';

  App.router = App.router || {};

  var _routes = {};

  // ── Register a route ────────────────────────────────────
  App.router.register = function (path, handler) {
    _routes[path] = handler;
  };

  // ── Navigate to a path (programmatic) ───────────────────
  App.router.navigate = function (path) {
    window.location.href = path;
  };

  // ── Detect current page and run its handler ─────────────
  App.router.handlePage = function () {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';

    // Store current page in state
    App.state.set('currentPage', page);

    // Normalise
    if (page === '' || page === '/') page = 'index.html';
    if (page.indexOf('.html') === -1) page += '.html';

    // URL params
    var params = new URLSearchParams(window.location.search);
    if (params.has('id')) {
      App.state.set('activeExpert', params.get('id'));
    }
    if (params.has('claim')) {
      App.state.set('activeClaim', params.get('claim'));
    }

    // Route handler lookup
    var handler = _routes[page] || _routes['*'];
    if (handler) {
      handler(page, params);
    }

    // Update nav active state
    _updateNav(page);
  };

  // ── Update navigation active class ──────────────────────
  function _updateNav(page) {
    var links = document.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href) {
        var linkPage = href.split('/').pop();
        if (page === '') page = 'index.html';
        if (linkPage === page) {
          links[i].classList.add('active');
        } else {
          links[i].classList.remove('active');
        }
      }
    }
  }

  // ── Register known page handlers ────────────────────────
  var PAGES = [
    'index.html',
    'ingest.html',
    'review.html',
    'experts.html',
    'experts-detail.html',
    'claims.html',
    'sources.html',
    'knowledge.html',
    'ranking.html'
  ];

  for (var i = 0; i < PAGES.length; i++) {
    (function (pg) {
      App.router.register(pg, function () {
        console.log('[Router] Loaded page:', pg);
        // Page-specific initialisation can go here
      });
    })(PAGES[i]);
  }

  // Catch-all
  App.router.register('*', function () {
    console.log('[Router] Unknown page, showing home');
  });

})();
