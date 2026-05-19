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
    var h4 = document.createElement("h4");
    h4.textContent = claim.title || "Untitled Claim";
    var p = document.createElement("p");
    p.textContent = claim.detail || "";
    var badge = document.createElement("span");
    badge.className = "badge badge-claim";
    badge.textContent = "Claim";
    card.appendChild(h4);
    card.appendChild(p);
    card.appendChild(badge);
    card.addEventListener("click", function() { renderClaimDetail(claim); });
    return card;
  }

  function renderClaimDetail(claim) {
    var panel = document.getElementById("detail-panel");
    if (!panel) return;
    panel.replaceChildren();
    var h3 = document.createElement("h3");
    h3.textContent = claim.title || "Untitled Claim";
    var p1 = document.createElement("p");
    var strong1 = document.createElement("strong");
    strong1.textContent = "Detail: ";
    p1.appendChild(strong1);
    p1.appendChild(document.createTextNode(claim.detail || ""));
    var p2 = document.createElement("p");
    var strong2 = document.createElement("strong");
    strong2.textContent = "Status: ";
    p2.appendChild(strong2);
    p2.appendChild(document.createTextNode("Pending Review"));
    panel.appendChild(h3);
    panel.appendChild(p1);
    panel.appendChild(p2);
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
