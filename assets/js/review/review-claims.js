/**
 * review-claims.js
 * Claim candidate rendering and review actions.
 * Namespace: FMStock.ui.review.claims
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.review = window.FMStock.ui.review || {};

(function () {
  var pendingClaims = [];

  function renderClaimCandidates(claims) {
    pendingClaims = Array.isArray(claims) ? claims : [];
    var container = document.getElementById("claim-list") || document.getElementById("review-items");
    if (!container) return;
    container.innerHTML = "";

    if (!pendingClaims.length) {
      container.appendChild(createEmptyState());
      return;
    }

    pendingClaims.forEach(function(claim, idx) {
      container.appendChild(createClaimCandidateCard(claim, idx));
    });
  }

  function createEmptyState() {
    var empty = document.createElement("div");
    empty.className = "empty-state-card";
    var h3 = document.createElement("h3");
    h3.textContent = "검토할 Claim 후보가 없습니다";
    var p = document.createElement("p");
    p.textContent = "자료수집 또는 자료허브에서 후보 JSON을 만든 뒤 로컬 review workspace에 보관하면 이곳에서 검토할 수 있습니다.";
    var small = document.createElement("p");
    small.className = "text-small text-muted";
    small.textContent = "공식 data/*.json 승격은 별도 검토와 validation 이후 진행합니다.";
    empty.appendChild(h3);
    empty.appendChild(p);
    empty.appendChild(small);
    return empty;
  }

  function createClaimCandidateCard(claim, index) {
    var card = document.createElement("div");
    card.className = "candidate-card claim-card";
    card.dataset.index = index;
    var h4 = document.createElement("h4");
    h4.textContent = claim.title || "제목 없는 Claim 후보";
    var p = document.createElement("p");
    p.textContent = claim.detail || claim.claimText || "세부 내용이 없습니다.";
    var badge = document.createElement("span");
    badge.className = "badge badge-claim";
    badge.textContent = "Claim 후보";
    card.appendChild(h4);
    card.appendChild(p);
    card.appendChild(badge);
    card.addEventListener("click", function() { renderClaimDetail(claim); });
    return card;
  }

  function renderClaimDetail(claim) {
    var panel = document.getElementById("detail-panel") || document.getElementById("review-detail-content");
    if (!panel) return;
    panel.replaceChildren();
    var h3 = document.createElement("h3");
    h3.textContent = claim.title || "제목 없는 Claim 후보";
    var p1 = document.createElement("p");
    var strong1 = document.createElement("strong");
    strong1.textContent = "검토 내용: ";
    p1.appendChild(strong1);
    p1.appendChild(document.createTextNode(claim.detail || claim.claimText || ""));
    var p2 = document.createElement("p");
    var strong2 = document.createElement("strong");
    strong2.textContent = "상태: ";
    p2.appendChild(strong2);
    p2.appendChild(document.createTextNode("검토 대기"));
    var p3 = document.createElement("p");
    p3.className = "text-small text-muted";
    p3.textContent = "모호한 발언은 공식 claim으로 승격하지 말고 candidate로 유지하거나 교육용으로 전환하세요.";
    panel.appendChild(h3);
    panel.appendChild(p1);
    panel.appendChild(p2);
    panel.appendChild(p3);
  }

  function approveClaim(index) {
    if (index >= 0 && index < pendingClaims.length) {
      console.log("[ReviewClaims] Approved claim index " + index + ":", pendingClaims[index]);
      pendingClaims.splice(index, 1);
      renderClaimCandidates(pendingClaims);
    }
  }

  function editClaim(index, updates) {
    if (index >= 0 && index < pendingClaims.length) {
      var claim = pendingClaims[index];
      Object.assign(claim, updates);
      console.log("[ReviewClaims] Edited claim index " + index + ":", claim);
      approveClaim(index);
    }
  }

  function deleteClaim(index) {
    if (index >= 0 && index < pendingClaims.length) {
      console.log("[ReviewClaims] Deleted claim index " + index + ":", pendingClaims[index]);
      pendingClaims.splice(index, 1);
      renderClaimCandidates(pendingClaims);
    }
  }

  function convertToEducational(index) {
    if (index >= 0 && index < pendingClaims.length) {
      var claim = pendingClaims[index];
      claim.direction = "educational_only";
      console.log("[ReviewClaims] Converted to educational:", claim);
      approveClaim(index);
    }
  }

  function saveForLater(index) {
    if (index >= 0 && index < pendingClaims.length) {
      console.log("[ReviewClaims] Saved for later:", pendingClaims[index]);
    }
  }

  function getPendingClaims() { return pendingClaims.slice(); }

  window.FMStock.ui.review.claims = {
    renderClaimCandidates: renderClaimCandidates,
    createClaimCandidateCard: createClaimCandidateCard,
    renderClaimDetail: renderClaimDetail,
    approveClaim: approveClaim,
    editClaim: editClaim,
    deleteClaim: deleteClaim,
    convertToEducational: convertToEducational,
    saveForLater: saveForLater,
    getPendingClaims: getPendingClaims
  };
})();
