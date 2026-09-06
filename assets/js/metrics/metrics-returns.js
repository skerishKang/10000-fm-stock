/**
 * metrics-returns.js — Rendering-only wrapper for evaluation data
 * Namespace: FMStock.metrics.returns
 *
 * NOTE: All calculation logic has been moved to the builder (scripts/build-evaluations.js).
 * This file now only renders precomputed evaluation records.
 */

window.FMStock = window.FMStock || {};
window.FMStock.metrics = window.FMStock.metrics || {};

(function () {
  'use strict';

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
    });
  }

  function renderRankedList(evaluations, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var items = (evaluations || []).filter(function (e) {
      return e.status === 'evaluated' && e.policyVersion === 'v1';
    });

    if (items.length === 0) {
      container.innerHTML = '<li class="placeholder">평가 데이터가 없습니다.</li>';
      return;
    }

    var html = items.map(function (e) {
      var claimId = escapeHtml(e.claimId || '');
      var returnRate = (e.returnRate != null) ? escapeHtml(String(e.returnRate)) : 'N/A';
      var evaluatedAt = escapeHtml(e.evaluatedAt || '');
      return '<li><strong>' + claimId + '</strong> — Return: ' + returnRate + '% (평가일: ' + evaluatedAt + ')</li>';
    }).join('');

    container.innerHTML = html;
  }

  window.FMStock.metrics.returns = {
    renderRankedList: renderRankedList
  };
})();
