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
    // sources.html uses #sources-list (not #sources-list-container)
    var c = document.getElementById("sources-list") || document.getElementById("sources-list-container");
    if (c) c.innerHTML = '<div class="empty">출처 데이터를 불러올 수 없습니다.</div>';
    return;
  }

  if (SL && typeof SL.renderSourceFilters === 'function') SL.renderSourceFilters(data);
  if (SF && typeof SF.initSourceFilters === 'function') {
    SF.initSourceFilters(data, function() {
      if (SL && typeof SL.renderSourcesList === 'function') SL.renderSourcesList(data.sources, data.segments, data.claims);
    });
  }
  if (SL && typeof SL.renderSourcesList === 'function') SL.renderSourcesList(data.sources, data.segments, data.claims);
}

function initSourceDetail() {
  var p = new URLSearchParams(window.location.search);
  var id = p.get("id");
  if (!id) {
    var c = document.getElementById("source-detail-container");
    if (c) c.innerHTML = "<div class=\"error\">No source ID provided</div>";
    return;
  }
  // Static MVP: no backend API available. Load from cached data.
  var data = window.FMStock && window.FMStock.data && window.FMStock.data.getAll
    ? window.FMStock.data.getAll()
    : null;
  if (!data) { console.warn('[sources-main] initSourceDetail: data not loaded yet'); return; }
  var SD = window.FMStock.ui.sources.detail;
  if (SD && typeof SD.renderSourceDetail === 'function') {
    SD.renderSourceDetail(id, data);
  }
}

window.FMStock.ui.sources.main = {
  initSourcesList: initSourcesList,
  initSourceDetail: initSourceDetail
};
