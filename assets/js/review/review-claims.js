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
    pendingClaims = claims;
    var container = document.getElementById("claim-list");
    if (!container) return;
    container.innerHTML = "";
    claims.forEach(function(claim, idx) {
      container.appendChild(createClaimCandidateCard(claim, idx));
    });
  }

  function createClaimCandidateCard(claim, index) {
    var card = document.createElement("div");
    card.className = "candidate-card claim-card";
    card.dataset.index = index;
    card.innerHTML = "<h4>" + (claim.title || "Untitled Claim") + "</h4>" +
      "<p>" + (claim.detail || "") + "</p>" +
      "<span class=\"badge badge-claim\">Claim</span>";
    card.addEventListener("click", function() { renderClaimDetail(claim); });
    return card;
  }

  function renderClaimDetail(claim) {
    var panel = document.getElementById("detail-panel");
    if (!panel) return;
    panel.innerHTML = "<h3>" + (claim.title || "Untitled Claim") + "</h3>" +
      "<p><strong>Detail:</strong> " + (claim.detail || "") + "</p>" +
      "<p><strong>Status:</strong> Pending Review</p>";
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
