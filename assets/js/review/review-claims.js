/**
 * review-claims.js
 * Claim candidate rendering and review actions.
 */

const ReviewClaims = (() => {
  let pendingClaims = [];

  function renderClaimCandidates(claims) {
    pendingClaims = claims;
    const container = document.getElementById('claim-list');
    if (!container) return;
    container.innerHTML = '';
    claims.forEach((claim, idx) => {
      container.appendChild(createClaimCandidateCard(claim, idx));
    });
  }

  function createClaimCandidateCard(claim, index) {
    const card = document.createElement('div');
    card.className = 'candidate-card claim-card';
    card.dataset.index = index;
    card.innerHTML = `
      <h4>${claim.title || 'Untitled Claim'}</h4>
      <p>${claim.detail || ''}</p>
      <span class="badge badge-claim">Claim</span>
    `;
    card.addEventListener('click', () => renderClaimDetail(claim));
    return card;
  }

  function renderClaimDetail(claim) {
    const panel = document.getElementById('detail-panel');
    if (!panel) return;
    panel.innerHTML = `
      <h3>${claim.title || 'Untitled Claim'}</h3>
      <p><strong>Detail:</strong> ${claim.detail || ''}</p>
      <p><strong>Status:</strong> Pending Review</p>
    `;
  }

  function approveClaim(index) {
    if (index >= 0 && index < pendingClaims.length) {
      console.log(`[ReviewClaims] Approved claim index ${index}:`, pendingClaims[index]);
      pendingClaims.splice(index, 1);
      renderClaimCandidates(pendingClaims);
    }
  }

  function editClaim(index, updates) {
    if (index >= 0 && index < pendingClaims.length) {
      const claim = pendingClaims[index];
      Object.assign(claim, updates);
      console.log(`[ReviewClaims] Edited claim index ${index}:`, claim);
      approveClaim(index);
    }
  }

  function deleteClaim(index) {
    if (index >= 0 && index < pendingClaims.length) {
      console.log(`[ReviewClaims] Deleted claim index ${index}:`, pendingClaims[index]);
      pendingClaims.splice(index, 1);
      renderClaimCandidates(pendingClaims);
    }
  }

  function convertToEducational(index) {
    if (index >= 0 && index < pendingClaims.length) {
      const claim = pendingClaims[index];
      claim.direction = 'educational_only';
      console.log(`[ReviewClaims] Converted to educational:`, claim);
      approveClaim(index);
    }
  }

  function saveForLater(index) {
    if (index >= 0 && index < pendingClaims.length) {
      console.log(`[ReviewClaims] Saved for later:`, pendingClaims[index]);
    }
  }

  function getPendingClaims() { return [...pendingClaims]; }

  return { renderClaimCandidates, createClaimCandidateCard, renderClaimDetail, approveClaim, editClaim, deleteClaim, convertToEducational, saveForLater, getPendingClaims };
})();
