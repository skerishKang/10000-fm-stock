/**
 * review-main.js
 * Main entry point for the review page (review.html).
 * Namespace: FMStock.ui.review.main
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.review = window.FMStock.ui.review || {};

(function () {
  var currentTab = "claim";
  var candidates = [];

  function initReviewPage() {
    loadCandidates();
    bindTabs();
    bindGlobalActions();
    if (currentTab === "claim") {
      window.FMStock.ui.review.claims.renderClaimCandidates(candidates.filter(function(c) { return c.type === "claim"; }));
    } else {
      window.FMStock.ui.review.knowledge.renderKnowledgeCandidates(candidates.filter(function(c) { return c.type === "knowledge"; }));
    }
  }

  function loadCandidates() {
    var stored = localStorage.getItem("ingest_candidates");
    if (stored) {
      try { candidates = JSON.parse(stored); } catch (e) { candidates = []; }
    }
    if (!candidates || candidates.length === 0) {
      candidates = [
        { type: "claim", id: 0, title: "Sample Claim 1", detail: "Detail for claim 1" },
        { type: "knowledge", id: 1, title: "Sample Knowledge 1", detail: "Detail for knowledge 1" }
      ];
    }
  }

  function bindTabs() {
    var claimTab = document.getElementById("tab-claim");
    var knowledgeTab = document.getElementById("tab-knowledge");
    if (claimTab) claimTab.addEventListener("click", function() { switchTab("claim"); });
    if (knowledgeTab) knowledgeTab.addEventListener("click", function() { switchTab("knowledge"); });
  }

  function switchTab(tab) {
    currentTab = tab;
    var claimSection = document.getElementById("review-claim-section");
    var knowledgeSection = document.getElementById("review-knowledge-section");
    if (claimSection) claimSection.style.display = tab === "claim" ? "block" : "none";
    if (knowledgeSection) knowledgeSection.style.display = tab === "knowledge" ? "block" : "none";
    if (tab === "claim") {
      window.FMStock.ui.review.claims.renderClaimCandidates(candidates.filter(function(c) { return c.type === "claim"; }));
    } else {
      window.FMStock.ui.review.knowledge.renderKnowledgeCandidates(candidates.filter(function(c) { return c.type === "knowledge"; }));
    }
  }

  function bindGlobalActions() {
    var btnApprove = document.getElementById("btn-approve");
    var btnEdit = document.getElementById("btn-edit");
    var btnDelete = document.getElementById("btn-delete");
    var btnConvert = document.getElementById("btn-convert");
    var btnLater = document.getElementById("btn-later");
    if (btnApprove) btnApprove.addEventListener("click", handleApprove);
    if (btnEdit) btnEdit.addEventListener("click", handleEdit);
    if (btnDelete) btnDelete.addEventListener("click", handleDelete);
    if (btnConvert) btnConvert.addEventListener("click", handleConvertToEducational);
    if (btnLater) btnLater.addEventListener("click", handleSaveForLater);
  }

  function handleApprove() {
    if (currentTab === "claim") window.FMStock.ui.review.claims.approveClaim(-1);
    else window.FMStock.ui.review.knowledge.approveKnowledge(-1);
  }

  function handleEdit() {
    if (currentTab === "claim") window.FMStock.ui.review.claims.editClaim(-1, {});
    else window.FMStock.ui.review.knowledge.editKnowledge(-1, {});
  }

  function handleDelete() {
    if (currentTab === "claim") window.FMStock.ui.review.claims.deleteClaim(-1);
    else window.FMStock.ui.review.knowledge.deleteKnowledge(-1);
  }

  function handleConvertToEducational() {
    if (currentTab === "claim") window.FMStock.ui.review.claims.convertToEducational(-1);
    else window.FMStock.ui.review.knowledge.convertToClaim(-1);
  }

  function handleSaveForLater() {
    if (currentTab === "claim") window.FMStock.ui.review.claims.saveForLater(-1);
    else window.FMStock.ui.review.knowledge.saveForLater(-1);
  }

  window.FMStock.ui.review.main = {
    initReviewPage: initReviewPage,
    loadCandidates: loadCandidates,
    switchTab: switchTab
  };
})();

document.addEventListener("DOMContentLoaded", function() { window.FMStock.ui.review.main.initReviewPage(); });
