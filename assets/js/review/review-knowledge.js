/**
 * review-knowledge.js
 * Knowledge candidate rendering and review actions.
 */

const ReviewKnowledge = (() => {
  let pendingKnowledge = [];

  function renderKnowledgeCandidates(notes) {
    pendingKnowledge = notes;
    const container = document.getElementById('knowledge-list');
    if (!container) return;
    container.innerHTML = '';
    notes.forEach((note, idx) => {
      container.appendChild(createKnowledgeCandidateCard(note, idx));
    });
  }

  function createKnowledgeCandidateCard(note, index) {
    const card = document.createElement('div');
    card.className = 'candidate-card knowledge-card';
    card.dataset.index = index;
    card.innerHTML = `
      <h4>${note.title || 'Untitled Knowledge'}</h4>
      <p>${note.detail || ''}</p>
      <span class="badge badge-knowledge">Knowledge</span>
    `;
    card.addEventListener('click', () => renderKnowledgeDetail(note));
    return card;
  }

  function renderKnowledgeDetail(note) {
    const panel = document.getElementById('detail-panel');
    if (!panel) return;
    panel.innerHTML = `
      <h3>${note.title || 'Untitled Knowledge'}</h3>
      <p><strong>Detail:</strong> ${note.detail || ''}</p>
      <p><strong>Status:</strong> Pending Review</p>
    `;
  }

  function approveKnowledge(index) {
    if (index >= 0 && index < pendingKnowledge.length) {
      console.log(`[ReviewKnowledge] Approved knowledge index ${index}:`, pendingKnowledge[index]);
      pendingKnowledge.splice(index, 1);
      renderKnowledgeCandidates(pendingKnowledge);
    }
  }

  function editKnowledge(index, updates) {
    if (index >= 0 && index < pendingKnowledge.length) {
      const note = pendingKnowledge[index];
      Object.assign(note, updates);
      console.log(`[ReviewKnowledge] Edited knowledge index ${index}:`, note);
      approveKnowledge(index);
    }
  }

  function deleteKnowledge(index) {
    if (index >= 0 && index < pendingKnowledge.length) {
      console.log(`[ReviewKnowledge] Deleted knowledge index ${index}:`, pendingKnowledge[index]);
      pendingKnowledge.splice(index, 1);
      renderKnowledgeCandidates(pendingKnowledge);
    }
  }

  function convertToClaim(index) {
    if (index >= 0 && index < pendingKnowledge.length) {
      const note = pendingKnowledge[index];
      note.type = 'claim';
      console.log(`[ReviewKnowledge] Converted to claim:`, note);
      approveKnowledge(index);
    }
  }

  function saveForLater(index) {
    if (index >= 0 && index < pendingKnowledge.length) {
      console.log(`[ReviewKnowledge] Saved for later:`, pendingKnowledge[index]);
    }
  }

  function getPendingKnowledge() { return [...pendingKnowledge]; }

  return { renderKnowledgeCandidates, createKnowledgeCandidateCard, renderKnowledgeDetail, approveKnowledge, editKnowledge, deleteKnowledge, convertToClaim, saveForLater, getPendingKnowledge };
})();
