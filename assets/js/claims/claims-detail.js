/**
 * claims-detail.js --- MVP: Claim Detail Panel
 * Namespace: FMStock.ui.claims.detail
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.claims = window.FMStock.ui.claims || {};

function renderClaimDetail(claimId, data) {
  var c = document.getElementById("claims-detail");
  if (!c) return;
  var claim = (data.claims || []).find(function(x) { return x.id === claimId; });
  if (!claim) { c.innerHTML = "<div class=\"error\">Claim not found</div>"; return; }
  var h = "<div class=\"claim-detail\">";
  h += renderClaimSummary(claim, data);
  h += renderSourceInfo(claim, data.sources || [], data.segments || []);
  h += renderEvidence(claim);
  h += renderEvaluationResult(claim, data.evaluations || []);
  h += renderConnectedKnowledge(claim, data.knowledgeNotes || []);
  h += "</div>";
  c.innerHTML = h;
}

function getExpertName(expertId, data) {
  var experts = data && Array.isArray(data.experts) ? data.experts : [];
  for (var i = 0; i < experts.length; i++) {
    if (experts[i].id === expertId) return experts[i].displayName || experts[i].name || expertId;
  }
  return expertId || '-';
}

function renderClaimSummary(claim, data) {
  var expertName = getExpertName(claim.expertId, data);
  var directionClass = safeClassToken(claim.direction);
  var h = "<div class=\"detail-section claim-summary\">";
  h += "<h2>" + escapeHtml(claim.companyName || claim.ticker || "Claim Detail") + "</h2>";
  h += "<div class=\"meta\">";
  h += "<span class=\"speaker\">" + escapeHtml(expertName) + "</span>";
  h += "<span class=\"ticker\">" + escapeHtml(claim.ticker || "-") + "</span>";
  h += "<span class=\"industry\">" + escapeHtml(claim.industry || "-") + "</span>";
  h += "<span class=\"direction " + directionClass + "\">" + escapeHtml(claim.direction || "-") + "</span>";
  h += "<span class=\"date\">" + escapeHtml(claim.baseDate || "") + "</span></div>";
  h += "<blockquote class=\"claim-text\">" + escapeHtml(claim.claimText || "") + "</blockquote>";
  if (claim.targetPrice) {
    h += "<p class=\"target-info\">Target: " + escapeHtml(claim.targetPrice) + " by " + escapeHtml(claim.targetDate || "N/A") + " (Base: " + escapeHtml(claim.basePrice || "N/A") + ")</p>";
  }
  h += "</div>";
  return h;
}

function renderSourceInfo(claim, sources, segments) {
  var src = sources.find(function(s) { return s.id === claim.sourceId; });
  if (!src) return "<div class=\"detail-section source-info\"><h3>Source</h3><p>No source linked</p></div>";
  var segs = segments.filter(function(s) { return s.claimId === claim.id; });
  var h = "<div class=\"detail-section source-info\">";
  h += "<h3>Source: " + escapeHtml(src.title || src.name || "Untitled") + "</h3>";
  h += "<p class=\"source-type\">" + escapeHtml(src.type || "-") + " -- " + escapeHtml(src.date || "") + "</p>";
  if (segs.length) {
    h += "<ul>";
    for (var i = 0; i < segs.length; i++) { h += "<li>" + renderYoutubeLink(src, segs[i]) + "</li>"; }
    h += "</ul>";
  }
  h += "</div>";
  return h;
}

function renderEvidence(claim) {
  var evidence = claim.evidence;
  if (!evidence || (Array.isArray(evidence) && evidence.length === 0)) {
    return "<div class=\"detail-section evidence\"><h3>Evidence</h3><p>No evidence recorded.</p></div>";
  }
  var content = Array.isArray(evidence) ? evidence.join("; ") : evidence;
  return "<div class=\"detail-section evidence\"><h3>Evidence " + String.fromCharCode(38) + " Logic</h3><p>" + escapeHtml(content) + "</p></div>";
}

function renderEvaluationResult(claim, evaluations) {
  var evals = (evaluations || []).filter(function(e) { return e.claimId === claim.id; });
  if (!evals.length) return "<div class=\"detail-section evaluation\"><h3>Verification Results</h3><p>Not yet evaluated.</p></div>";

  var rows = "";
  for (var i = 0; i < evals.length; i++) {
    var e = evals[i];
    var resultClass = safeClassToken(e.result);
    rows += "<tr>";
    rows += "<td>" + escapeHtml(e.evaluatedAt || "-") + "</td>";
    rows += "<td class=\"verdict-" + resultClass + "\">" + escapeHtml(e.result || "-") + "</td>";
    rows += "<td>" + escapeHtml(e.evaluatedPrice != null ? e.evaluatedPrice.toLocaleString() : "-") + "</td>";
    rows += "<td>" + escapeHtml(e.returnRate != null ? e.returnRate.toFixed(2) + "%" : "-") + "</td>";
    rows += "<td>" + escapeHtml(e.alpha != null ? e.alpha.toFixed(2) + "%" : "-") + "</td>";
    rows += "<td>" + escapeHtml(e.benchmark || "-") + " " + escapeHtml(e.benchmarkReturn != null ? "(" + e.benchmarkReturn.toFixed(2) + "%)" : "") + "</td>";
    rows += "</tr>";
  }

  var h = "<div class=\"detail-section evaluation\"><h3>Verification Results</h3>";
  h += "<table class=\"eval-table\"><thead><tr>";
  h += "<th>Evaluated At</th><th>Result</th><th>Price</th><th>Return %</th><th>Alpha</th><th>Benchmark</th>";
  h += "</tr></thead>";
  h += "<tbody>" + rows + "</tbody></table>";
  if (evals[0].memo) {
    h += "<p class=\"eval-memo\">" + escapeHtml(evals[0].memo) + "</p>";
  }
  h += "</div>";
  return h;
}

function renderConnectedKnowledge(claim, knowledgeNotes) {
  var notes = (knowledgeNotes || []).filter(function(n) { return n.claimId === claim.id; });
  if (!notes.length) return "";
  var h = "<div class=\"detail-section knowledge\"><h3>Connected Knowledge Notes (" + escapeHtml(notes.length) + ")</h3><ul>";
  for (var i = 0; i < notes.length; i++) {
    h += '<li><a href="knowledge.html?id=' + escapeAttr(notes[i].id || '') + '">' + escapeHtml(notes[i].title || 'Untitled') + '</a></li>';
  }
  h += "</ul></div>";
  return h;
}

function renderYoutubeLink(source, segment) {
  if (!source || source.type !== "youtube") return "<span>" + escapeHtml(segment.start || "") + " - " + escapeHtml(segment.end || "") + "</span>";
  var start = segment.startTime || segment.start || 0;
  var url = "https://www.youtube.com/watch?v=" + encodeURIComponent(source.sourceId || source.url || '') + String.fromCharCode(38) + "t=" + encodeURIComponent(start) + "s";
  return "<a href=\"" + escapeAttr(url) + "\" target=\"_blank\" rel=\"noopener noreferrer\">Watch segment " + escapeHtml(start) + "s - " + escapeHtml(segment.endTime || segment.end || "") + "s</a>";
}

function safeClassToken(value) {
  return String(value == null ? '' : value).toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}

function escapeHtml(text) {
  return String(text == null ? '' : text).replace(/[&<>\"']/g, function (ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' })[ch];
  });
}

window.FMStock.ui.claims.detail = {
  renderClaimDetail: renderClaimDetail,
  renderClaimSummary: renderClaimSummary,
  renderSourceInfo: renderSourceInfo,
  renderEvidence: renderEvidence,
  renderEvaluationResult: renderEvaluationResult,
  renderConnectedKnowledge: renderConnectedKnowledge,
  renderYoutubeLink: renderYoutubeLink
};
