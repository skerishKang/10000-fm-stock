/**
 * review-knowledge.js
 * Knowledge candidate rendering and review actions.
 * Namespace: FMStock.ui.review.knowledge
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.review = window.FMStock.ui.review || {};

(function () {
  var pendingKnowledge = [];

  function renderKnowledgeCandidates(notes) {
    pendingKnowledge = notes;
    var container = document.getElementById("knowledge-list");
    if (!container) return;
    container.innerHTML = "";
    notes.forEach(function(note, idx) {
      container.appendChild(createKnowledgeCandidateCard(note, idx));
    });
  }

  function createKnowledgeCandidateCard(note, index) {
    var card = document.createElement("div");
    card.className = "candidate-card knowledge-card";
    card.dataset.index = index;
    card.innerHTML = "<h4>" + (note.title || "Untitled Knowledge") + "</h4>" +
      "<p>" + (note.detail || "") + "</p>" +
      "<span class=\"badge badge-knowledge\">Knowledge</span>";
    card.addEventListener("click", function() { renderKnowledgeDetail(note); });
    return card;
  }

  function renderKnowledgeDetail(note) {
    var panel = document.getElementById("detail-panel");
    if (!panel) return;
    panel.innerHTML = "<h3>" + (note.title || "Untitled Knowledge") + "</h3>" +
      "<p><strong>Detail:</strong> " + (note.detail || "") + "</p>" +
      "<p><strong>Status:</strong> Pending Review</p>";
  }

  function approveKnowledge(index) {
    if (index >= 0 && index < pendingKnowledge.length) {
      console.log("[ReviewKnowledge] Approved knowledge index " + index + ":", pendingKnowledge[index]);
      pendingKnowledge.splice(index, 1);
      renderKnowledgeCandidates(pendingKnowledge);
    }
  }

  function editKnowledge(index, updates) {
    if (index >= 0 && index < pendingKnowledge.length) {
      var note = pendingKnowledge[index];
      Object.assign(note, updates);
      console.log("[ReviewKnowledge] Edited knowledge index " + index + ":", note);
      approveKnowledge(index);
    }
  }

  function deleteKnowledge(index) {
    if (index >= 0 && index < pendingKnowledge.length) {
      console.log("[ReviewKnowledge] Deleted knowledge index " + index + ":", pendingKnowledge[index]);
      pendingKnowledge.splice(index, 1);
      renderKnowledgeCandidates(pendingKnowledge);
    }
  }

  function convertToClaim(index) {
    if (index >= 0 && index < pendingKnowledge.length) {
      var note = pendingKnowledge[index];
      note.type = "claim";
      console.log("[ReviewKnowledge] Converted to claim:", note);
      approveKnowledge(index);
    }
  }

  function saveForLater(index) {
    if (index >= 0 && index < pendingKnowledge.length) {
      console.log("[ReviewKnowledge] Saved for later:", pendingKnowledge[index]);
    }
  }

  function getPendingKnowledge() { return pendingKnowledge.slice(); }

  window.FMStock.ui.review.knowledge = {
    renderKnowledgeCandidates: renderKnowledgeCandidates,
    createKnowledgeCandidateCard: createKnowledgeCandidateCard,
    renderKnowledgeDetail: renderKnowledgeDetail,
    approveKnowledge: approveKnowledge,
    editKnowledge: editKnowledge,
    deleteKnowledge: deleteKnowledge,
    convertToClaim: convertToClaim,
    saveForLater: saveForLater,
    getPendingKnowledge: getPendingKnowledge
  };
})();
