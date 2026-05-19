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
  c.replaceChildren();

  if (!source) {
    var error = document.createElement("div");
    error.className = "error";
    error.textContent = "Source not found";
    c.appendChild(error);
    return;
  }

  var segments = (data.segments || []).filter(function(s) { return s.sourceId === sourceId; });
  var claims = (data.claims || []).filter(function(claim) { return claim.sourceId === sourceId; });
  var notes = (data.knowledgeNotes || []).filter(function(note) {
    return segments.some(function(segment) { return segment.id === note.segmentId; });
  });

  var detail = document.createElement("div");
  detail.className = "source-detail";
  detail.appendChild(renderSourceHeader(source));
  detail.appendChild(renderSegmentsList(segments));

  var connectedClaims = renderConnectedClaims(claims);
  if (connectedClaims) detail.appendChild(connectedClaims);

  var connectedKnowledge = renderConnectedKnowledge(notes);
  if (connectedKnowledge) detail.appendChild(connectedKnowledge);

  c.appendChild(detail);
}

function safeClassSuffix(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeExternalUrl(value) {
  try {
    var url = new URL(String(value || ""), window.location.href);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch (err) {
    // Fall through to null.
  }
  return null;
}

function appendHeading(section, level, text) {
  var heading = document.createElement(level);
  heading.textContent = text;
  section.appendChild(heading);
  return heading;
}

function renderSourceHeader(source) {
  var section = document.createElement("div");
  section.className = "detail-section source-header";

  appendHeading(section, "h2", source.title || source.name || "Untitled Source");

  var meta = document.createElement("div");
  meta.className = "meta";

  var type = document.createElement("span");
  type.className = "source-type";
  type.textContent = source.type || "-";
  meta.appendChild(type);

  var date = document.createElement("span");
  date.className = "source-date";
  date.textContent = source.date || "";
  meta.appendChild(date);

  var status = source.processingStatus || "pending";
  var statusBadge = document.createElement("span");
  statusBadge.className = "status-badge status-" + safeClassSuffix(status);
  statusBadge.textContent = status;
  meta.appendChild(statusBadge);

  section.appendChild(meta);

  if (source.url) {
    var p = document.createElement("p");
    var safeUrl = safeExternalUrl(source.url);
    if (safeUrl) {
      var a = document.createElement("a");
      a.href = safeUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = source.url;
      p.appendChild(a);
    } else {
      var disabled = document.createElement("span");
      disabled.className = "text-muted";
      disabled.textContent = "비허용 URL";
      disabled.title = "안전하지 않은 URL입니다";
      p.appendChild(disabled);
    }
    section.appendChild(p);
  }

  return section;
}

function renderSegmentsList(segments) {
  var section = document.createElement("div");
  section.className = "detail-section";
  appendHeading(section, "h3", segments && segments.length ? "Segments (" + segments.length + ")" : "Segments");

  if (!segments || !segments.length) {
    var empty = document.createElement("p");
    empty.textContent = "No segments found.";
    section.appendChild(empty);
    return section;
  }

  var table = document.createElement("table");
  table.className = "segments-table";
  var thead = document.createElement("thead");
  thead.innerHTML = "<tr><th>Label</th><th>Start</th><th>End</th><th>Page</th><th>Claims</th></tr>";
  table.appendChild(thead);

  var tbody = document.createElement("tbody");
  segments.forEach(function(segment) {
    var tr = document.createElement("tr");

    var label = document.createElement("td");
    label.textContent = segment.label || segment.id || "-";
    tr.appendChild(label);

    var start = document.createElement("td");
    start.textContent = segment.startTime || segment.start || "-";
    tr.appendChild(start);

    var end = document.createElement("td");
    end.textContent = segment.endTime || segment.end || "-";
    tr.appendChild(end);

    var page = document.createElement("td");
    page.textContent = segment.page || "-";
    tr.appendChild(page);

    var claims = document.createElement("td");
    var link = document.createElement("a");
    link.href = "/claims/?segmentId=" + encodeURIComponent(segment.id || "");
    link.textContent = "View Claims";
    claims.appendChild(link);
    tr.appendChild(claims);

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  section.appendChild(table);
  return section;
}

function renderConnectedClaims(claims) {
  if (!claims || !claims.length) return null;

  var section = document.createElement("div");
  section.className = "detail-section";
  appendHeading(section, "h3", "Connected Claims (" + claims.length + ")");

  var ul = document.createElement("ul");
  claims.forEach(function(claim) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "/claims/detail.html?id=" + encodeURIComponent(claim.id || "");
    a.textContent = claim.title || claim.text || claim.id || "Untitled claim";
    li.appendChild(a);
    ul.appendChild(li);
  });
  section.appendChild(ul);
  return section;
}

function renderConnectedKnowledge(notes) {
  if (!notes || !notes.length) return null;

  var section = document.createElement("div");
  section.className = "detail-section";
  appendHeading(section, "h3", "Connected Knowledge (" + notes.length + ")");

  var ul = document.createElement("ul");
  notes.forEach(function(note) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "/knowledge/detail.html?id=" + encodeURIComponent(note.id || "");
    a.textContent = note.title || note.id || "Untitled note";
    li.appendChild(a);
    ul.appendChild(li);
  });
  section.appendChild(ul);
  return section;
}

function renderYoutubeSegments(segments, source) {
  if (!segments || !segments.length || !source || source.type !== "youtube") return null;

  var videoId = source.sourceId;
  if (!videoId && source.url) {
    try {
      videoId = new URL(source.url, window.location.href).searchParams.get("v");
    } catch (err) {
      videoId = null;
    }
  }
  if (!videoId) return null;

  var section = document.createElement("div");
  section.className = "youtube-segments";
  appendHeading(section, "h3", "YouTube Segments");

  var ul = document.createElement("ul");
  segments.forEach(function(segment) {
    var li = document.createElement("li");
    var start = segment.startTime || segment.start || 0;
    var end = segment.endTime || segment.end || "";
    var a = document.createElement("a");
    a.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(videoId) + "&t=" + encodeURIComponent(start) + "s";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Segment " + start + "s - " + end + "s";
    li.appendChild(a);
    ul.appendChild(li);
  });
  section.appendChild(ul);
  return section;
}

function renderReportSegments(segments) {
  var reportSegments = (segments || []).filter(function(segment) { return segment.page; });
  if (!reportSegments.length) return null;

  var section = document.createElement("div");
  section.className = "report-segments";
  appendHeading(section, "h3", "Report Pages");

  var ul = document.createElement("ul");
  reportSegments.forEach(function(segment) {
    var li = document.createElement("li");
    li.textContent = "Page " + segment.page + (segment.label ? ": " + segment.label : "");
    ul.appendChild(li);
  });
  section.appendChild(ul);
  return section;
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
