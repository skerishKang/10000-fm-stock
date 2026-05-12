/**
 * app-router.js — Simple SPA-style page router
 * Namespace: FMStock.app.router
 */

window.FMStock = window.FMStock || {};
window.FMStock.app = window.FMStock.app || {};

(function () {
  'use strict';

  var App = window.FMStock.app;
  App.router = App.router || {};

  var _routes = {};

  App.router.register = function (path, handler) {
    _routes[path] = handler;
  };

  App.router.navigate = function (path) {
    window.location.href = path;
  };

  App.router.handlePage = function () {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';

    App.state.set('currentPage', page);

    if (page === '' || page === '/') page = 'index.html';
    if (page.indexOf('.html') === -1) page += '.html';

    var params = new URLSearchParams(window.location.search);
    if (params.has('id')) {
      App.state.set('activeExpert', params.get('id'));
    }
    if (params.has('claim')) {
      App.state.set('activeClaim', params.get('claim'));
    }

    var handler = _routes[page] || _routes['*'];
    if (handler) {
      handler(page, params);
    }

    _updateNav(page);
  };

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
      });
    })(PAGES[i]);
  }

  App.router.register('*', function () {
    console.log('[Router] Unknown page, showing home');
  });
})();
