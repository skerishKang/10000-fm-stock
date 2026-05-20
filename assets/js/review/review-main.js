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
    ensureReviewShell();
    loadCandidates();
    bindTabs();
    bindGlobalActions();
    renderCurrentTab();
  }

  function ensureReviewShell() {
    var listPanel = document.querySelector(".review-list");
    var detailPanel = document.querySelector(".review-detail");

    if (listPanel && !document.getElementById("tab-claim")) {
      listPanel.innerHTML = '<div class="workflow-filter review-filters">' +
        '<select id="rf-type"><option value="all">전체</option><option value="claim">Claim 후보</option><option value="knowledge">Knowledge 후보</option></select>' +
        '<input type="text" id="rf-search" placeholder="후보 제목·내용 검색">' +
        '</div>' +
        '<div class="tabs" role="tablist">' +
        '<button class="tab active" id="tab-claim" type="button" aria-selected="true">Claim 후보</button>' +
        '<button class="tab" id="tab-knowledge" type="button" aria-selected="false">Knowledge 후보</button>' +
        '</div>' +
        '<section class="review-section-panel" id="review-claim-section"><div id="claim-list"></div></section>' +
        '<section class="review-section-panel" id="review-knowledge-section" style="display:none;"><div id="knowledge-list"></div></section>';
    }

    if (detailPanel && !document.getElementById("detail-panel")) {
      detailPanel.innerHTML = '<div id="detail-panel" class="detail-panel">' +
        '<div class="empty-state-card"><h3>검토할 후보를 선택하세요</h3>' +
        '<p>왼쪽 후보를 클릭하면 세부 내용과 채택 판단 기준을 확인할 수 있습니다.</p>' +
        '<p class="text-small text-muted">채택은 공식 data/*.json 직접 쓰기가 아니라 별도 데이터 PR 전 검토 단계입니다.</p></div>' +
        '</div>' +
        '<div class="review-actions form-actions">' +
        '<button class="btn btn-accept" id="btn-approve" type="button">채택</button>' +
        '<button class="btn btn-edit" id="btn-edit" type="button">수정 필요</button>' +
        '<button class="btn btn-delete" id="btn-delete" type="button">보류/삭제</button>' +
        '<button class="btn btn-educate" id="btn-convert" type="button">교육용 전환</button>' +
        '<button class="btn btn-secondary" id="btn-later" type="button">나중에 검토</button>' +
        '</div>';
    }
  }

  function loadCandidates() {
    var stored = localStorage.getItem("ingest_candidates");
    if (stored) {
      try { candidates = JSON.parse(stored); } catch (e) { candidates = []; }
    }
    if (!Array.isArray(candidates)) candidates = [];
  }

  function bindTabs() {
    var claimTab = document.getElementById("tab-claim");
    var knowledgeTab = document.getElementById("tab-knowledge");
    if (claimTab && !claimTab.dataset.reviewBound) {
      claimTab.dataset.reviewBound = "true";
      claimTab.addEventListener("click", function() { switchTab("claim"); });
    }
    if (knowledgeTab && !knowledgeTab.dataset.reviewBound) {
      knowledgeTab.dataset.reviewBound = "true";
      knowledgeTab.addEventListener("click", function() { switchTab("knowledge"); });
    }
  }

  function renderCurrentTab() {
    if (currentTab === "claim") {
      window.FMStock.ui.review.claims.renderClaimCandidates(candidates.filter(function(c) { return c.type === "claim"; }));
    } else {
      window.FMStock.ui.review.knowledge.renderKnowledgeCandidates(candidates.filter(function(c) { return c.type === "knowledge"; }));
    }
  }

  function switchTab(tab) {
    currentTab = tab;
    var claimTab = document.getElementById("tab-claim");
    var knowledgeTab = document.getElementById("tab-knowledge");
    if (claimTab) {
      claimTab.classList.toggle("active", tab === "claim");
      claimTab.setAttribute("aria-selected", tab === "claim" ? "true" : "false");
    }
    if (knowledgeTab) {
      knowledgeTab.classList.toggle("active", tab === "knowledge");
      knowledgeTab.setAttribute("aria-selected", tab === "knowledge" ? "true" : "false");
    }
    var claimSection = document.getElementById("review-claim-section");
    var knowledgeSection = document.getElementById("review-knowledge-section");
    if (claimSection) claimSection.style.display = tab === "claim" ? "block" : "none";
    if (knowledgeSection) knowledgeSection.style.display = tab === "knowledge" ? "block" : "none";
    renderCurrentTab();
  }

  function bindGlobalActions() {
    var btnApprove = document.getElementById("btn-approve");
    var btnEdit = document.getElementById("btn-edit");
    var btnDelete = document.getElementById("btn-delete");
    var btnConvert = document.getElementById("btn-convert");
    var btnLater = document.getElementById("btn-later");
    if (btnApprove && !btnApprove.dataset.reviewBound) { btnApprove.dataset.reviewBound = "true"; btnApprove.addEventListener("click", handleApprove); }
    if (btnEdit && !btnEdit.dataset.reviewBound) { btnEdit.dataset.reviewBound = "true"; btnEdit.addEventListener("click", handleEdit); }
    if (btnDelete && !btnDelete.dataset.reviewBound) { btnDelete.dataset.reviewBound = "true"; btnDelete.addEventListener("click", handleDelete); }
    if (btnConvert && !btnConvert.dataset.reviewBound) { btnConvert.dataset.reviewBound = "true"; btnConvert.addEventListener("click", handleConvertToEducational); }
    if (btnLater && !btnLater.dataset.reviewBound) { btnLater.dataset.reviewBound = "true"; btnLater.addEventListener("click", handleSaveForLater); }
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
