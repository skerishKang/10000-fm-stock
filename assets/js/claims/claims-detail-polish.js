(function () {
  'use strict';

  function labels() {
    return window.FMStock && window.FMStock.ui && window.FMStock.ui.claims && window.FMStock.ui.claims.labels || {};
  }

  function escapeHtml(value) {
    if (window.FMStock && window.FMStock.security && typeof window.FMStock.security.escapeHtml === 'function') {
      return window.FMStock.security.escapeHtml(value);
    }
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
    });
  }

  function toClass(value) {
    var helper = labels().safeClassToken;
    if (typeof helper === 'function') return helper(value);
    return String(value == null ? '' : value).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }

  function directionLabel(value) {
    var helper = labels().getDirectionLabel;
    return typeof helper === 'function' ? helper(value) : value;
  }

  function verdictLabel(value) {
    var helper = labels().getVerdictLabel;
    return typeof helper === 'function' ? helper(value) : value;
  }

  function polishClaimDetail() {
    var detail = document.getElementById('claims-detail');
    if (!detail) return;

    var direction = detail.querySelector('.claim-summary .meta .direction');
    if (direction) {
      var rawDirection = direction.textContent.trim();
      direction.textContent = directionLabel(rawDirection);
      direction.className = 'direction badge badge-direction direction-' + toClass(rawDirection || 'unknown');
    }

    var verdictCells = detail.querySelectorAll('.eval-table td[class^="verdict-"]');
    for (var i = 0; i < verdictCells.length; i++) {
      var rawVerdict = verdictCells[i].textContent.trim();
      verdictCells[i].className = '';
      verdictCells[i].innerHTML = '<span class="badge badge-verdict verdict-' + toClass(rawVerdict || 'pending') + '">' + escapeHtml(verdictLabel(rawVerdict)) + '</span>';
    }
  }

  var claims = window.FMStock && window.FMStock.ui && window.FMStock.ui.claims;
  var detailApi = claims && claims.detail;
  if (!detailApi || typeof detailApi.renderClaimDetail !== 'function' || detailApi.renderClaimDetail.__detailPolish) return;

  var originalRenderClaimDetail = detailApi.renderClaimDetail;
  detailApi.renderClaimDetail = function (claimId, data) {
    originalRenderClaimDetail(claimId, data);
    polishClaimDetail();
  };
  detailApi.renderClaimDetail.__detailPolish = true;
})();
