/**
 * knowledge-list.js --- Knowledge List Renderer
 * Namespace: FMStock.ui.knowledge.list
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.knowledge = window.FMStock.ui.knowledge || {};

function renderKnowledgeList(notes, data) {
  var container = document.getElementById("knowledge-list") || document.getElementById("knowledge-grid");
  if (!container) return;
  container.replaceChildren();
  notes.forEach(function(note) { container.appendChild(createKnowledgeCard(note)); });
}

function createKnowledgeCard(note) {
  var card = document.createElement("div");
  card.className = "knowledge-card";
  card.dataset.id = note.id;

  var badges = document.createElement("div");
  badges.className = "card-badges";
  if (note.industry) { var b = document.createElement("span"); b.className = "badge badge-industry"; b.textContent = note.industry; badges.appendChild(b); }
  if (note.stock) { var b2 = document.createElement("span"); b2.className = "badge badge-stock"; b2.textContent = note.stock; badges.appendChild(b2); }
  if (note.topic) { var b3 = document.createElement("span"); b3.className = "badge badge-topic"; b3.textContent = note.topic; badges.appendChild(b3); }
  if (note.difficulty) { var b4 = document.createElement("span"); b4.className = "badge badge-difficulty difficulty-" + note.difficulty.toLowerCase(); b4.textContent = note.difficulty; badges.appendChild(b4); }
  card.appendChild(badges);

  var h3 = document.createElement("h3");
  h3.className = "card-title";
  h3.textContent = note.title || "";
  card.appendChild(h3);

  var p = document.createElement("p");
  p.className = "card-summary";
  p.textContent = note.summary || "";
  card.appendChild(p);

  var keypoints = document.createElement("div");
  keypoints.className = "card-keypoints";
  var strong = document.createElement("strong");
  strong.textContent = "\ud575\uc2ec\ud3ec\uc778\ud2b8:";
  keypoints.appendChild(strong);
  var ul = document.createElement("ul");
  (note.keyPoints || []).forEach(function(kp) { var li = document.createElement("li"); li.textContent = kp; ul.appendChild(li); });
  keypoints.appendChild(ul);
  card.appendChild(keypoints);

  var tagsDiv = document.createElement("div");
  tagsDiv.className = "card-tags";
  (note.tags || []).forEach(function(t) { var span = document.createElement("span"); span.className = "tag"; span.textContent = t; tagsDiv.appendChild(span); });
  card.appendChild(tagsDiv);

  if (note.source) {
    var sourceDiv = document.createElement("div");
    sourceDiv.className = "source";
    sourceDiv.textContent = "\ud83d\udcda " + note.source;
    card.appendChild(sourceDiv);
  }

  return card;
}

function renderKnowledgeFilters(data) {
  var container = document.getElementById("knowledge-filters");
  if (!container) return;
  container.replaceChildren();

  var allTags = [...new Set((data.notes || []).flatMap(function(n) { return n.tags || []; }))];

  var filters = [
    { label: "\uc0b0\uc5c5", field: "industry", values: getUniqueValues(data.notes || [], "industry") },
    { label: "\uc885\ubaa9", field: "stock", values: getUniqueValues(data.notes || [], "stock") },
    { label: "\uc8fc\uc81c", field: "topic", values: getUniqueValues(data.notes || [], "topic") },
    { label: "\ub09c\uc774\ub3c4", field: "difficulty", values: ["\ucd08\uae09", "\uc911\uae09", "\uace0\uae09"] },
    { label: "\ud0dc\uadf8", field: "tag", values: allTags }
  ];

  filters.forEach(function(f) {
    var group = document.createElement("div");
    group.className = "filter-group";
    var label = document.createElement("label");
    label.textContent = f.label;
    group.appendChild(label);
    var select = document.createElement("select");
    select.className = "filter-select";
    select.dataset.filter = f.field;
    var optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "\uc804\uccb4";
    select.appendChild(optAll);
    f.values.forEach(function(v) {
      var opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
    group.appendChild(select);
    container.appendChild(group);
  });
}

function filterKnowledge(notes, filters) {
  return notes.filter(function(note) {
    for (var key in filters) {
      var value = filters[key];
      if (!value) continue;
      if (key === "tag" && !(note.tags || []).includes(value)) return false;
      if (key !== "tag" && note[key] !== value) return false;
    }
    return true;
  });
}

function sortKnowledge(notes, sortBy) {
  var sorted = notes.slice();
  switch (sortBy) {
    case "title":
      sorted.sort(function(a, b) { return (a.title || "").localeCompare(b.title || ""); });
      break;
    case "newest":
      sorted.sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
      break;
    case "oldest":
      sorted.sort(function(a, b) { return new Date(a.createdAt || 0) - new Date(b.createdAt || 0); });
      break;
  }
  return sorted;
}

function getUniqueValues(notes, field) {
  var set = {};
  (notes || []).forEach(function(n) {
    var v = n[field];
    if (v) set[v] = true;
  });
  return Object.keys(set);
}

window.FMStock.ui.knowledge.list = {
  renderKnowledgeList: renderKnowledgeList,
  createKnowledgeCard: createKnowledgeCard,
  renderKnowledgeFilters: renderKnowledgeFilters,
  filterKnowledge: filterKnowledge,
  sortKnowledge: sortKnowledge
};
