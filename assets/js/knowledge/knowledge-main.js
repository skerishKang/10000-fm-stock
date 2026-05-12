/**
 * knowledge-main.js - Knowledge Page Entry Point
 * Initializes the knowledge page with list, filters, and detail routing.
 */

import { renderKnowledgeList, renderKnowledgeFilters, filterKnowledge, sortKnowledge } from './knowledge-list.js';
import { renderKnowledgeDetail } from './knowledge-detail.js';
import { initKnowledgeFilters, getActiveFilters } from './knowledge-filter.js';

export async function initKnowledgePage() {
  var container = document.getElementById('knowledge-app');
  if (!container) return;

  try {
    var res = await fetch('/api/knowledge');
    var data = await res.json();
    var notes = data.notes || [];

    renderKnowledgeFilters(data);
    renderKnowledgeList(notes, data);

    initKnowledgeFilters(data, function(filters) {
      var filtered = filterKnowledge(notes, filters);
      var sortSelect = document.getElementById('sort-select');
      var sortBy = sortSelect ? sortSelect.value : 'newest';
      var sorted = sortKnowledge(filtered, sortBy);
      renderKnowledgeList(sorted, data);
    });

    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', function(e) {
        var filtered = filterKnowledge(notes, getActiveFilters());
        var sorted = sortKnowledge(filtered, e.target.value);
        renderKnowledgeList(sorted, data);
      });
    }

    document.addEventListener('click', function(e) {
      var card = e.target.closest('.knowledge-card');
      if (card) {
        var noteId = card.dataset.id;
        renderKnowledgeDetail(noteId, data);
      }
    });

    console.log('[knowledge-main] Initialized with ' + notes.length + ' notes');
  } catch (err) {
    console.error('[knowledge-main] Failed to initialize:', err);
    container.innerHTML = '<div class="error-state">\ub370\uc774\ud130\ub97c \ubd88\ub7ec\uc624\ub294 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.</div>';
  }
}
