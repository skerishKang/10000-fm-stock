window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.claims = window.FMStock.ui.claims || {};

function initClaimsPage(data) {
  var CL = window.FMStock.ui.claims.list;
  var CF = window.FMStock.ui.claims.filter;
  var CM = window.FMStock.ui.claims.metrics;
  var appState = window.FMStock.app && window.FMStock.app.state;
  var dataset = data || (appState && typeof appState.get === 'function' ? appState.get('data') : {}) || {};

  dataset.claims = Array.isArray(dataset.claims) ? dataset.claims : [];
  dataset.evaluations = Array.isArray(dataset.evaluations) ? dataset.evaluations : [];
  dataset.experts = Array.isArray(dataset.experts) ? dataset.experts : [];

  if (!CL || typeof CL.renderClaimsList !== 'function') return;

  if (typeof CL.renderClaimFilters === 'function') {
    CL.renderClaimFilters(dataset);
  }

  if (CF && typeof CF.initClaimFilters === 'function') {
    CF.initClaimFilters(dataset, function () {
      CL.renderClaimsList(dataset.claims, dataset.evaluations, dataset);
    });
  }

  CL.renderClaimsList(dataset.claims, dataset.evaluations, dataset);

  if (CM && typeof CM.getClaimsStats === 'function') {
    var stats = CM.getClaimsStats(dataset.claims, dataset.evaluations);
    var el = document.getElementById('claims-stats');
    if (el) {
      el.innerHTML = '<div class="stat-card">Total: ' + stats.total + '</div>';
    }
  }
}

window.FMStock.ui.claims.main = {
  initClaimsPage: initClaimsPage
};
