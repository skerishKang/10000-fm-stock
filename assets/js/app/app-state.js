/**
 * app-state.js — Centralized state management
 * Namespace: FMStock.app.state
 */

window.FMStock = window.FMStock || {};
window.FMStock.app = window.FMStock.app || {};

(function () {
  'use strict';

  var App = window.FMStock.app;
  App.state = App.state || {};

  var _state = {
    data: null,
    filters: {},
    currentPage: null,
    activeExpert: null,
    activeClaim: null
  };

  var _subscribers = {};

  App.state.init = function () {
    _state = {
      data: null,
      filters: {},
      currentPage: null,
      activeExpert: null,
      activeClaim: null
    };
    _subscribers = {};
  };

  App.state.get = function (path) {
    if (!path) return _state;
    var keys = path.split('.');
    var val = _state;
    for (var i = 0; i < keys.length; i++) {
      if (val == null || typeof val !== 'object') return undefined;
      val = val[keys[i]];
    }
    return val;
  };

  App.state.set = function (path, value) {
    var keys = path.split('.');
    var target = _state;
    for (var i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = value;
    App.state.notify(path);
  };

  App.state.subscribe = function (key, callback) {
    if (!_subscribers[key]) _subscribers[key] = [];
    _subscribers[key].push(callback);
    return function unsubscribe() {
      var idx = _subscribers[key].indexOf(callback);
      if (idx !== -1) _subscribers[key].splice(idx, 1);
    };
  };

  App.state.notify = function (key) {
    var subs = _subscribers[key];
    if (subs) {
      for (var i = 0; i < subs.length; i++) {
        try { subs[i](App.state.get(key), key); } catch (e) { console.error(e); }
      }
    }
  };
})();
