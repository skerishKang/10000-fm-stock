/**
 * claims-main.js --- MVP: Claims Page Initialiser
 * Namespace: FMStock.ui.claims.main
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.claims = window.FMStock.ui.claims || {};

function initClaimsPage() {
  var CL = window.FMStock.ui.claims.list;
  var CF = window.FMStock.ui.claims.filter;
  var CM = window.FMStock.ui.claims.metrics;

  fetch("/api/claims").then(function(r) { return r.json(); }).then(function(data) {
    CL.renderClaimFilters(data);
    CF.initClaimFilters(data, function() { CL.renderClaimsList(data.claims, data.evaluations, data); });
    CL.renderClaimsList(data.claims, data.evaluations, data);
    var stats = CM.getClaimsStats(data.claims, data.evaluations);
    var el = document.getElementById("claims-stats");
    if (el) el.innerHTML = "<div class=\"stat-card\">Total: " + stats.total + "</div>" +
      "<div class=\"stat-card\">Avg Accuracy: " + (stats.avgAccuracy * 100).toFixed(1) + "%</div>";
  }).catch(function(err) { console.error("Failed to load claims page:", err); });
}

window.FMStock.ui.claims.main = {
  initClaimsPage: initClaimsPage
};
