/**
 * sources-detail.js --- MVP: Source Detail View
 * Namespace: FMStock.ui.sources.detail
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.sources = window.FMStock.ui.sources || {};

function renderSourceDetail(sourceId, data) {
  var c = document.getElementById("source-detail-container");
  if (!c) return;
  var source = (data.sources || []).find(function(s) { return s.id === sourceId; });
  if (!source) { c.innerHTML = "<div class=\"error\">Source not found</div>"; return; }
  var segments = (data.segments || []).filter(function(s) { return s.sourceId === sourceId; });
  var claims = (data.claims || []).filter(function(c) { return c.sourceId === sourceId; });
  var notes = (data.knowledgeNotes || []).filter(function(n) { return segments.some(function(s) { return s.id === n.segmentId; }); });
  var h = "<div class=\"source-detail\">";
  h += renderSourceHeader(source);
  h += renderSegmentsList(segments);
  h += renderConnectedClaims(claims);
  h += renderConnectedKnowledge(notes);
  h += "</div>";
  c.innerHTML = h;
}

function renderSourceHeader(source) {
  var h = "<div class=\"detail-section source-header\">";
  h += "<h2>" + (source.title || source.name || "Untitled Source") + "</h2>";
  h += "<div class=\"meta\"><span class=\"source-type\">" + (source.type || "-") + "</span>";
  h += "<span class=\"source-date\">" + (source.date || "") + "</span>";
  h += "<span class=\"status-badge status-" + (source.processingStatus || "pending").toLowerCase() + "\">" + (source.processingStatus || "pending") + "</span></div>";
  if (source.url) h += "<p><a href=\"" + source.url + "\" target=\"_blank\">" + source.url + "</a></p>";
  h += "</div>";
  return h;
}

function renderSegmentsList(segments) {
  if (!segments || !segments.length) return "<div class=\"detail-section\"><h3>Segments</h3><p>No segments found.</p></div>";
  var rows = "";
  for (var i = 0; i < segments.length; i++) {
    var s = segments[i];
    rows += "<tr><td>" + (s.label || s.id || "-") + "</td>";
    rows += "<td>" + (s.startTime || s.start || "-") + "</td>";
    rows += "<td>" + (s.endTime || s.end || "-") + "</td>";
    rows += "<td>" + (s.page || "-") + "</td>";
    rows += "<td><a href=\"/claims/?segmentId=" + s.id + "\">View Claims</a></td></tr>";
  }
  var h = "<div class=\"detail-section\"><h3>Segments (" + segments.length + ")</h3>";
  h += "<table class=\"segments-table\"><thead><tr><th>Label</th><th>Start</th><th>End</th><th>Page</th><th>Claims</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
  return h;
}

function renderConnectedClaims(claims) {
  if (!claims || !claims.length) return "";
  var h = "<div class=\"detail-section\"><h3>Connected Claims (" + claims.length + ")</h3><ul>";
  for (var i = 0; i < claims.length; i++) {
    h += "<li><a href=\"/claims/detail.html?id=" + claims[i].id + "\">" + (claims[i].title || claims[i].text || claims[i].id) + "</a></li>";
  }
  h += "</ul></div>";
  return h;
}

function renderConnectedKnowledge(notes) {
  if (!notes || !notes.length) return "";
  var h = "<div class=\"detail-section\"><h3>Connected Knowledge (" + notes.length + ")</h3><ul>";
  for (var i = 0; i < notes.length; i++) {
    h += "<li><a href=\"/knowledge/detail.html?id=" + notes[i].id + "\">" + (notes[i].title || notes[i].id) + "</a></li>";
  }
  h += "</ul></div>";
  return h;
}

function renderYoutubeSegments(segments, source) {
  if (!segments || !segments.length || !source || source.type !== "youtube") return "";
  var videoId = source.sourceId || (source.url ? new URL(source.url).searchParams.get("v") : null);
  if (!videoId) return "";
  var h = "<div class=\"youtube-segments\"><h3>YouTube Segments</h3><ul>";
  for (var i = 0; i < segments.length; i++) {
    var s = segments[i];
    var start = s.startTime || s.start || 0;
    var link = "https://www.youtube.com/watch?v=" + videoId + String.fromCharCode(38) + "t=" + start + "s";
    h += "<li><a href=\"" + link + "\" target=\"_blank\">Segment " + start + "s - " + (s.endTime || s.end || "") + "s</a></li>";
  }
  h += "</ul></div>";
  return h;
}

function renderReportSegments(segments) {
  var rs = (segments || []).filter(function(s) { return s.page; });
  if (!rs.length) return "";
  var h = "<div class=\"report-segments\"><h3>Report Pages</h3><ul>";
  for (var i = 0; i < rs.length; i++) {
    h += "<li>Page " + rs[i].page + (rs[i].label ? ": " + rs[i].label : "") + "</li>";
  }
  h += "</ul></div>";
  return h;
}

window.FMStock.ui.sources.detail = {
  renderSourceDetail: renderSourceDetail,
  renderSourceHeader: renderSourceHeader,
  renderSegmentsList: renderSegmentsList,
  renderConnectedClaims: renderConnectedClaims,
  renderConnectedKnowledge: renderConnectedKnowledge,
  renderYoutubeSegments: renderYoutubeSegments,
  renderReportSegments: renderReportSegments
};
