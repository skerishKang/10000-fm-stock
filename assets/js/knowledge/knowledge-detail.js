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
  if (!note) {
    container.replaceChildren();
    var err = document.createElement("div");
    err.className = "error";
    err.textContent = "Note not found";
    container.appendChild(err);
    return;
  }

  container.replaceChildren();
  var detail = document.createElement("div");
  detail.className = "knowledge-detail";

  var h2 = document.createElement("h2");
  h2.textContent = note.title || "Untitled";
  detail.appendChild(h2);

  var meta = document.createElement("div");
  meta.className = "meta";
  if (note.industry) { var s1 = document.createElement("span"); s1.className = "industry"; s1.textContent = note.industry; meta.appendChild(s1); }
  if (note.stock) { var s2 = document.createElement("span"); s2.className = "stock"; s2.textContent = note.stock; meta.appendChild(s2); }
  if (note.date) { var s3 = document.createElement("span"); s3.className = "date"; s3.textContent = note.date; meta.appendChild(s3); }
  detail.appendChild(meta);

  var content = document.createElement("div");
  content.className = "content";
  renderRelatedClaims(note, data.claims || [], content);
  detail.appendChild(content);

  var related = document.createElement("div");
  related.className = "related";
  renderRelatedExperts(note, data.experts || [], related);
  detail.appendChild(related);

  container.appendChild(detail);
}

function renderRelatedClaims(note, claims, container) {
  var related = claims.filter(function(c) { return c.knowledgeNoteId === note.id || c.id === note.claimId; });
  if (!related.length) {
    var p = document.createElement("p");
    p.textContent = "No related claims.";
    container.appendChild(p);
    return;
  }
  var h3 = document.createElement("h3");
  h3.textContent = "Related Claims";
  container.appendChild(h3);
  var ul = document.createElement("ul");
  for (var i = 0; i < related.length; i++) {
    var li = document.createElement("li");
    li.className = "related-item claim-item";
    li.dataset.id = related[i].id;
    var header = document.createElement("div");
    header.className = "item-header";
    header.textContent = related[i].title || "Claim";
    li.appendChild(header);
    var meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = (related[i].speaker || "") + " - " + (related[i].ticker || "");
    li.appendChild(meta);
    ul.appendChild(li);
  }
  container.appendChild(ul);
}

function renderRelatedExperts(note, experts, container) {
  var related = experts.filter(function(e) { return e.id === note.expertId; });
  if (!related.length) return;
  var h3 = document.createElement("h3");
  h3.textContent = "Related Experts";
  container.appendChild(h3);
  var ul = document.createElement("ul");
  for (var i = 0; i < related.length; i++) {
    var li = document.createElement("li");
    li.className = "related-item expert-item";
    li.dataset.id = related[i].id;
    var header = document.createElement("div");
    header.className = "item-header";
    header.textContent = related[i].name || related[i].expert || "";
    li.appendChild(header);
    var meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = related[i].affiliation || related[i].role || "";
    li.appendChild(meta);
    ul.appendChild(li);
  }
  container.appendChild(ul);
}

window.FMStock.ui.knowledge.detail = {
  renderKnowledgeDetail: renderKnowledgeDetail,
  renderRelatedClaims: renderRelatedClaims,
  renderRelatedExperts: renderRelatedExperts
};
