/**
 * sources-main.js --- MVP: Sources Page Initialiser
 * Namespace: FMStock.ui.sources.main
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.sources = window.FMStock.ui.sources || {};

function initSourcesList() {
  var SL = window.FMStock.ui.sources.list;
  var SF = window.FMStock.ui.sources.filter;

  fetch("/api/sources").then(function(r) { return r.json(); }).then(function(data) {
    SL.renderSourceFilters(data);
    SF.initSourceFilters(data, function() { SL.renderSourcesList(data.sources, data.segments, data.claims); });
    SL.renderSourcesList(data.sources, data.segments, data.claims);
  }).catch(function(err) { console.error("Failed to load sources list:", err); });
}

function initSourceDetail() {
  var p = new URLSearchParams(window.location.search);
  var id = p.get("id");
  if (!id) {
    var c = document.getElementById("source-detail-container");
    if (c) c.innerHTML = "<div class=\"error\">No source ID provided</div>";
    return;
  }
  var SD = window.FMStock.ui.sources.detail;
  fetch("/api/sources/" + id).then(function(r) { return r.json(); }).then(function(data) { SD.renderSourceDetail(id, data); })
    .catch(function(err) { console.error("Failed to load source detail:", err); });
}

window.FMStock.ui.sources.main = {
  initSourcesList: initSourcesList,
  initSourceDetail: initSourceDetail
};
