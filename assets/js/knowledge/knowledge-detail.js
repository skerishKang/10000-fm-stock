/**
 * knowledge-detail.js --- Knowledge Detail View
 * Namespace: FMStock.ui.knowledge.detail
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.knowledge = window.FMStock.ui.knowledge || {};

function renderKnowledgeDetail(noteId, data) {
  var note = (data.notes || []).find(function(n) { return n.id === noteId; });
  var container = document.getElementById("knowledge-detail");
  if (!container) return;
  if (!note) { container.innerHTML = "<div class=\"error\">Note not found</div>"; return; }
  var h = "<div class=\"knowledge-detail\">";
  h += "<h2>" + (note.title || "Untitled") + "</h2>";
  h += "<div class=\"meta\">";
  h += "<span class=\"industry\">" + (note.industry || "") + "</span>";
  h += "<span class=\"stock\">" + (note.stock || "") + "</span>";
  h += "<span class=\"date\">" + (note.date || "") + "</span></div>";
  h += "<div class=\"content\">" + renderRelatedClaims(note, data.claims || []) + "</div>";
  h += "<div class=\"related\">" + renderRelatedExperts(note, data.experts || []) + "</div>";
  h += "</div>";
  container.innerHTML = h;
}

function renderRelatedClaims(note, claims) {
  var related = claims.filter(function(c) { return c.knowledgeNoteId === note.id || c.id === note.claimId; });
  if (!related.length) return "<p>No related claims.</p>";
  var h = "<h3>Related Claims</h3><ul>";
  for (var i = 0; i < related.length; i++) {
    h += "<li class=\"related-item claim-item\" data-id=\"" + related[i].id + "\">" +
      "<div class=\"item-header\">" + (related[i].title || "Claim") + "</div>" +
      "<div class=\"item-meta\">" + (related[i].speaker || "") + " - " + (related[i].ticker || "") + "</div></li>";
  }
  h += "</ul>";
  return h;
}

function renderRelatedExperts(note, experts) {
  var related = experts.filter(function(e) { return e.id === note.expertId; });
  if (!related.length) return "";
  var h = "<h3>Related Experts</h3><ul>";
  for (var i = 0; i < related.length; i++) {
    h += "<li class=\"related-item expert-item\" data-id=\"" + related[i].id + "\">" +
      "<div class=\"item-header\">" + (related[i].name || related[i].expert || "") + "</div>" +
      "<div class=\"item-meta\">" + (related[i].affiliation || related[i].role || "") + "</div></li>";
  }
  h += "</ul>";
  return h;
}

window.FMStock.ui.knowledge.detail = {
  renderKnowledgeDetail: renderKnowledgeDetail,
  renderRelatedClaims: renderRelatedClaims,
  renderRelatedExperts: renderRelatedExperts
};
