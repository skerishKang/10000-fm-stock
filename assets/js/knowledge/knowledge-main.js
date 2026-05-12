/**
 * knowledge-main.js --- Knowledge Page Entry Point
 * Namespace: FMStock.ui.knowledge.main
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.knowledge = window.FMStock.ui.knowledge || {};

async function initKnowledgePage() {
  var container = document.getElementById("knowledge-app");
  if (!container) return;
  try {
    var res = await fetch("/api/knowledge");
    var data = await res.json();
    var notes = data.notes || [];
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
  } catch (err) {
    console.error("[knowledge-main] Failed to initialize:", err);
    container.innerHTML = "<div class=\"error-state\">\ub370\uc774\ud130\ub97c \ubd88\ub7ec\uc624\ub294 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.</div>";
  }
}

window.FMStock.ui.knowledge.main = {
  initKnowledgePage: initKnowledgePage
};
