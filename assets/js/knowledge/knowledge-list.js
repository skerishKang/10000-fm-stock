/**
 * knowledge-list.js --- Knowledge List Renderer
 * Namespace: FMStock.ui.knowledge.list
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.knowledge = window.FMStock.ui.knowledge || {};

function renderKnowledgeList(notes, data) {
  var container = document.getElementById("knowledge-list");
  if (!container) return;
  container.innerHTML = notes.map(function(note) { return createKnowledgeCard(note); }).join("");
}

function createKnowledgeCard(note) {
  var industry = note.industry ? "<span class=\"badge badge-industry\">" + note.industry + "</span>" : "";
  var stock = note.stock ? "<span class=\"badge badge-stock\">" + note.stock + "</span>" : "";
  var topic = note.topic ? "<span class=\"badge badge-topic\">" + note.topic + "</span>" : "";
  var difficulty = note.difficulty ? "<span class=\"badge badge-difficulty difficulty-" + note.difficulty.toLowerCase() + "\">" + note.difficulty + "</span>" : "";
  var tags = (note.tags || []).map(function(t) { return "<span class=\"tag\">" + t + "</span>"; }).join("");
  var source = note.source ? "<div class=\"source\">\ud83d\udcda " + note.source + "</div>" : "";
  return "<div class=\"knowledge-card\" data-id=\"" + note.id + "\">" +
    "<div class=\"card-badges\">" + industry + stock + topic + difficulty + "</div>" +
    "<h3 class=\"card-title\">" + note.title + "</h3>" +
    "<p class=\"card-summary\">" + (note.summary || "") + "</p>" +
    "<div class=\"card-keypoints\"><strong>\ud575\uc2ec\ud3ec\uc778\ud2b8:</strong><ul>" +
    (note.keyPoints || []).map(function(kp) { return "<li>" + kp + "</li>"; }).join("") + "</ul></div>" +
    "<div class=\"card-tags\">" + tags + "</div>" + source + "</div>";
}

function renderKnowledgeFilters(data) {
  var container = document.getElementById("knowledge-filters");
  if (!container) return;
  var allTags = [...new Set((data.notes || []).flatMap(function(n) { return n.tags || []; }))];
  container.innerHTML =
    "<div class=\"filter-group\"><label>\uc0b0\uc5c5</label>" +
    "<select class=\"filter-select\" data-filter=\"industry\"><option value=\"\">\uc804\uccb4</option>" +
    getUniqueValues(data.notes || [], "industry").map(function(v) { return "<option value=\"" + v + "\">" + v + "</option>"; }).join("") + "</select></div>" +
    "<div class=\"filter-group\"><label>\uc885\ubaa9</label>" +
    "<select class=\"filter-select\" data-filter=\"stock\"><option value=\"\">\uc804\uccb4</option>" +
    getUniqueValues(data.notes || [], "stock").map(function(v) { return "<option value=\"" + v + "\">" + v + "</option>"; }).join("") + "</select></div>" +
    "<div class=\"filter-group\"><label>\uc8fc\uc81c</label>" +
    "<select class=\"filter-select\" data-filter=\"topic\"><option value=\"\">\uc804\uccb4</option>" +
    getUniqueValues(data.notes || [], "topic").map(function(v) { return "<option value=\"" + v + "\">" + v + "</option>"; }).join("") + "</select></div>" +
    "<div class=\"filter-group\"><label>\ub09c\uc774\ub3c4</label>" +
    "<select class=\"filter-select\" data-filter=\"difficulty\"><option value=\"\">\uc804\uccb4</option>" +
    ["\ucd08\uae09", "\uc911\uae09", "\uace0\uae09"].map(function(v) { return "<option value=\"" + v + "\">" + v + "</option>"; }).join("") + "</select></div>" +
    "<div class=\"filter-group\"><label>\ud0dc\uadf8</label>" +
    "<select class=\"filter-select\" data-filter=\"tag\"><option value=\"\">\uc804\uccb4</option>" +
    allTags.map(function(v) { return "<option value=\"" + v + "\">" + v + "</option>"; }).join("") + "</select></div>";
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
