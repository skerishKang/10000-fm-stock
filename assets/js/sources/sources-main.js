/**
 * sources-main.js --- MVP: Sources Page Initialiser
 * Namespace: FMStock.ui.sources.main
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.sources = window.FMStock.ui.sources || {};

function initSourcesList(data) {
  var SL = window.FMStock.ui.sources.list;
  var SF = window.FMStock.ui.sources.filter;

  if (!data || !data.sources) {
    var c = document.getElementById("sources-list-container");
    if (c) c.innerHTML = '<div class="empty">출처 데이터를 불러올 수 없습니다.</div>';
    return;
  }

  SL.renderSourceFilters(data);
  SF.initSourceFilters(data, function() { SL.renderSourcesList(data.sources, data.segments, data.claims); });
  SL.renderSourcesList(data.sources, data.segments, data.claims);
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
