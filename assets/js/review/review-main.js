/**
 * review-main.js
 * Main entry point for the review page (review.html).
 * Orchestrates list/detail panels and tabs (claim/knowledge).
 */

const ReviewMain = (() => {
  let currentTab = 'claim';
  let candidates = [];

  function initReviewPage() {
    loadCandidates();
    bindTabs();
    bindGlobalActions();
    if (currentTab === 'claim') {
      ReviewClaims.renderClaimCandidates(candidates.filter(c => c.type === 'claim'));
    } else {
      ReviewKnowledge.renderKnowledgeCandidates(candidates.filter(c => c.type === 'knowledge'));
    }
  }

  function loadCandidates() {
    const stored = localStorage.getItem('ingest_candidates');
    if (stored) {
      try { candidates = JSON.parse(stored); } catch (e) { candidates = []; }
    }
    if (!candidates || candidates.length === 0) {
      candidates = [
        { type: 'claim', id: 0, title: 'Sample Claim 1', detail: 'Detail for claim 1' },
        { type: 'knowledge', id: 1, title: 'Sample Knowledge 1', detail: 'Detail for knowledge 1' }
      ];
    }
  }

  function bindTabs() {
    const claimTab = document.getElementById('tab-claim');
    const knowledgeTab = document.getElementById('tab-knowledge');
    if (claimTab) claimTab.addEventListener('click', () => switchTab('claim'));
    if (knowledgeTab) knowledgeTab.addEventListener('click', () => switchTab('knowledge'));
  }

  function switchTab(tab) {
    currentTab = tab;
    const claimSection = document.getElementById('review-claim-section');
    const knowledgeSection = document.getElementById('review-knowledge-section');
    if (claimSection) claimSection.style.display = tab === 'claim' ? 'block' : 'none';
    if (knowledgeSection) knowledgeSection.style.display = tab === 'knowledge' ? 'block' : 'none';
    if (tab === 'claim') {
      ReviewClaims.renderClaimCandidates(candidates.filter(c => c.type === 'claim'));
    } else {
      ReviewKnowledge.renderKnowledgeCandidates(candidates.filter(c => c.type === 'knowledge'));
    }
  }

  function bindGlobalActions() {
    const btnApprove = document.getElementById('btn-approve');
    const btnEdit = document.getElementById('btn-edit');
    const btnDelete = document.getElementById('btn-delete');
    const btnConvert = document.getElementById('btn-convert');
    const btnLater = document.getElementById('btn-later');
    if (btnApprove) btnApprove.addEventListener('click', handleApprove);
    if (btnEdit) btnEdit.addEventListener('click', handleEdit);
    if (btnDelete) btnDelete.addEventListener('click', handleDelete);
    if (btnConvert) btnConvert.addEventListener('click', handleConvertToEducational);
    if (btnLater) btnLater.addEventListener('click', handleSaveForLater);
  }

  function handleApprove() {
    if (currentTab === 'claim') ReviewClaims.approveClaim(-1);
    else ReviewKnowledge.approveKnowledge(-1);
  }

  function handleEdit() {
    if (currentTab === 'claim') ReviewClaims.editClaim(-1, {});
    else ReviewKnowledge.editKnowledge(-1, {});
  }

  function handleDelete() {
    if (currentTab === 'claim') ReviewClaims.deleteClaim(-1);
    else ReviewKnowledge.deleteKnowledge(-1);
  }

  function handleConvertToEducational() {
    if (currentTab === 'claim') ReviewClaims.convertToEducational(-1);
    else ReviewKnowledge.convertToClaim(-1);
  }

  function handleSaveForLater() {
    if (currentTab === 'claim') ReviewClaims.saveForLater(-1);
    else ReviewKnowledge.saveForLater(-1);
  }

  return { initReviewPage, loadCandidates, switchTab };
})();

document.addEventListener('DOMContentLoaded', () => ReviewMain.initReviewPage());
