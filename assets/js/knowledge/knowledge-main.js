/**
 * knowledge-main.js --- Knowledge Page Entry Point
 * Namespace: FMStock.ui.knowledge.main
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.knowledge = window.FMStock.ui.knowledge || {};

function initKnowledgePage(data) {
  var container = document.getElementById("knowledge-app") || document.getElementById("knowledge-grid");
  if (!container) return;

  if (!data || !data.knowledgeNotes) {
    container.innerHTML = '<div class="empty">지식노트 데이터를 불러올 수 없습니다.</div>';
    return;
  }

  var notes = data.knowledgeNotes || [];
  var KL = window.FMStock.ui.knowledge.list;
  var KD = window.FMStock.ui.knowledge.detail;
  var KF = window.FMStock.ui.knowledge.filter;

  KL.renderKnowledgeFilters(data);
  KL.renderKnowledgeList(notes, data);

  KF.initKnowledgeFilters(data, function(filters) {
    var filtered = KL.filterKnowledge(notes, filters);
    var sortSelect = document.getElementById("sort-select");
    var sortBy = sortSelect ? sortSelect.value : "newest";
    var sorted = KL.sortKnowledge(filtered, sortBy);
    KL.renderKnowledgeList(sorted, data);
  });

  var sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", function(e) {
      var filtered = KL.filterKnowledge(notes, KF.getActiveFilters());
      var sorted = KL.sortKnowledge(filtered, e.target.value);
      KL.renderKnowledgeList(sorted, data);
    });
  }

  document.addEventListener("click", function(e) {
    var card = e.target.closest(".knowledge-card");
    if (card) {
      var noteId = card.dataset.id;
      KD.renderKnowledgeDetail(noteId, data);
    }
  });

  console.log("[knowledge-main] Initialized with " + notes.length + " notes");
}

window.FMStock.ui.knowledge.main = {
  initKnowledgePage: initKnowledgePage
};
