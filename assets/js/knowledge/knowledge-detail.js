/**
 * knowledge-detail.js - Knowledge Detail View
 * Renders full note, related claims, sources, experts.
 */

export function renderKnowledgeDetail(noteId, data) {
  var note = (data.notes || []).find(function(n) { return n.id === noteId; });
  var container = document.getElementById('knowledge-detail');
  if (!container) return;
  if (!note) {
    container.innerHTML = '<div class="empty-state">\ub178\ud2b8\ub97c \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.</div>';
    return;
  }
  container.innerHTML = renderFullNote(note);

  var relatedClaims = (data.claims || []).filter(function(c) {
    return c.noteId === noteId || (note.claimIds || []).includes(c.id);
  });
  var relatedSources = (data.sources || []).filter(function(s) {
    return s.noteId === noteId || (note.sourceIds || []).includes(s.id);
  });
  var relatedExperts = (data.experts || []).filter(function(e) {
    return e.noteId === noteId || (note.expertIds || []).includes(e.id);
  });

  if (relatedClaims.length) {
    container.innerHTML += '<section class="detail-section related-claims"><h3>\ud83d\udccb \uad00\ub828 Claim</h3>' +
      relatedClaims.map(function(c) { return renderRelatedClaims(c); }).join('') + '</section>';
  }
  if (relatedSources.length) {
    container.innerHTML += '<section class="detail-section related-sources"><h3>\ud83d\udcda \uad00\ub828 \ucd9c\ucc98</h3>' +
      relatedSources.map(function(s) { return renderRelatedSources(s); }).join('') + '</section>';
  }
  if (relatedExperts.length) {
    container.innerHTML += '<section class="detail-section related-experts"><h3>\ud83d\udc64 \uad00\ub828 \uc804\ubb38\uac00</h3>' +
      relatedExperts.map(function(e) { return renderRelatedExpert(e); }).join('') + '</section>';
  }
}

export function renderFullNote(note) {
  var tags = (note.tags || []).map(function(t) { return '<span class="tag">' + t + '</span>'; }).join('');
  var keyPoints = (note.keyPoints || []).map(function(kp) { return '<li>' + kp + '</li>'; }).join('');
  var meta = (note.industry ? '<span class="meta-item">\ud83c\udfed ' + note.industry + '</span>' : '') +
    (note.companyName ? '<span class="meta-item">\ud83d\udcc8 ' + note.companyName + '</span>' : '') +
    (note.topic ? '<span class="meta-item">\ud83d\udccc ' + note.topic + '</span>' : '') +
    (note.level ? '<span class="meta-item difficulty-' + note.level.toLowerCase() + '">\ud83c\udfaf ' + note.level + '</span>' : '');

  return '<div class="full-note">' +
    '<h2 class="note-title">' + (note.summary?.substring(0, 60) || 'Knowledge Note') + '</h2>' +
    '<div class="note-meta">' + meta + '</div>' +
    '<div class="note-summary"><h3>\uc694\uc57d</h3><p>' + (note.summary || '') + '</p></div>' +
    '<div class="note-content"><h3>\uc804\uccb4 \ub0b4\uc6a9</h3><div>' + (note.summary || '') + '</div></div>' +
    '<div class="note-keypoints"><h3>\ud575\uc2ec \ud3ec\uc778\ud2b8</h3><ul>' + keyPoints + '</ul></div>' +
    '<div class="note-tags">' + tags + '</div>' +
    (note.source ? '<div class="note-source">\ud83d\udcda \ucd9c\ucc98: ' + note.source + '</div>' : '') +
    '</div>';
}

export function renderRelatedClaims(claim) {
  return '<div class="related-item claim-item" data-id="' + claim.id + '">' +
    '<div class="item-header">' + (claim.claimText || '') + '</div>' +
    '<div class="item-meta">' + (claim.status ? '<span class="status-badge status-' + claim.status.toLowerCase() + '">' + claim.status + '</span>' : '') + '</div>' +
    '</div>';
}

export function renderRelatedSources(source) {
  return '<div class="related-item source-item" data-id="' + source.id + '">' +
    '<div class="item-header">' + (source.title || source.name || '') + '</div>' +
    (source.url ? '<a class="item-link" href="' + source.url + '" target="_blank">\ud83d\udd17 \ubc14\ub85c\uac00\uae30</a>' : '') +
    '</div>';
}

export function renderRelatedExpert(expert) {
  return '<div class="related-item expert-item" data-id="' + expert.id + '">' +
    '<div class="item-header">' + (expert.displayName || expert.name || '') + '</div>' +
    '<div class="item-meta">' + (expert.organization || '') + '</div>' +
    '</div>';
}
