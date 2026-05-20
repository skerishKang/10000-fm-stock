/**
 * ingest-main.js
 * Main entry point for the ingestion page (ingest.html).
 * Namespace: FMStock.ui.ingest.main
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.ingest = window.FMStock.ui.ingest || {};

(function () {
  var currentMode = "youtube";

  function initIngestPage() {
    bindTabButtons();
    bindSaveButton();
    handleReviewNavigation();
    showYoutubeMode();
  }

  function bindTabButtons() {
    var buttons = document.querySelectorAll(".ingest-tabs .tab[data-tab]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function () {
        if (this.dataset.tab === "report") showReportMode();
        else showYoutubeMode();
      });
    }
  }

  function setTabButtonState(mode) {
    var buttons = document.querySelectorAll(".ingest-tabs .tab[data-tab]");
    for (var i = 0; i < buttons.length; i++) {
      var active = buttons[i].dataset.tab === mode;
      buttons[i].classList.toggle("active", active);
      buttons[i].setAttribute("aria-selected", active ? "true" : "false");
    }
  }

  function showYoutubeMode() {
    currentMode = "youtube";
    setTabButtonState("youtube");
    var youtubePanel = document.getElementById("tab-youtube") || document.getElementById("ingest-youtube-section");
    var reportPanel = document.getElementById("tab-report") || document.getElementById("ingest-report-section");
    if (youtubePanel) youtubePanel.style.display = "block";
    if (reportPanel) reportPanel.style.display = "none";
  }

  function showReportMode() {
    currentMode = "report";
    setTabButtonState("report");
    var youtubePanel = document.getElementById("tab-youtube") || document.getElementById("ingest-youtube-section");
    var reportPanel = document.getElementById("tab-report") || document.getElementById("ingest-report-section");
    if (youtubePanel) youtubePanel.style.display = "none";
    if (reportPanel) reportPanel.style.display = "block";
  }

  function bindSaveButton() {
    bindClick("btn-save", handleSave);
    bindClick("btn-save-youtube", function () { currentMode = "youtube"; handleSave(); });
    bindClick("btn-candidate-youtube", function () { currentMode = "youtube"; handleSave(); });
    bindClick("btn-save-report", function () { currentMode = "report"; handleSave(); });
    bindClick("btn-candidate-report", function () { currentMode = "report"; handleSave(); });
  }

  function bindClick(id, handler) {
    var btn = document.getElementById(id);
    if (btn && !btn.dataset.ingestBound) {
      btn.dataset.ingestBound = "true";
      btn.addEventListener("click", handler);
    }
  }

  function readFormByName(formId) {
    var form = document.getElementById(formId);
    var data = {};
    if (!form) return data;
    var fields = form.querySelectorAll("input, textarea, select");
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].name) data[fields[i].name] = fields[i].value.trim();
    }
    return data;
  }

  function getYoutubeData() {
    if (window.FMStock.ui.ingest.youtube && typeof window.FMStock.ui.ingest.youtube.getYoutubeFormData === "function") {
      var data = window.FMStock.ui.ingest.youtube.getYoutubeFormData();
      if (data.url || data.title || data.publisher) return data;
    }
    var raw = readFormByName("youtube-form");
    return {
      url: raw.url || "",
      title: raw.title || raw.url || "YouTube candidate",
      publisher: raw.publisher || raw.speaker || "",
      publishedAt: raw.publishedAt || "",
      startTime: raw.startTime || raw.timestamp || "",
      endTime: raw.endTime || "",
      expertName: raw.expertName || raw.speaker || "",
      ticker: raw.ticker || "",
      industry: raw.industry || "",
      memo: raw.memo || "",
      transcript: raw.transcript || ""
    };
  }

  function getReportData() {
    if (window.FMStock.ui.ingest.report && typeof window.FMStock.ui.ingest.report.getReportFormData === "function") {
      var data = window.FMStock.ui.ingest.report.getReportFormData();
      if (data.title || data.publisher) return data;
    }
    var raw = readFormByName("report-form");
    return {
      title: raw.title || "Report candidate",
      publisher: raw.publisher || "",
      analyst: raw.analyst || "",
      publishedAt: raw.publishedAt || raw.pub_date || "",
      url: raw.url || "",
      privatePath: raw.privatePath || "",
      page: raw.page || "",
      sectionTitle: raw.sectionTitle || "",
      ticker: raw.ticker || "",
      industry: raw.industry || "",
      memo: raw.memo || "",
      excerpt: raw.excerpt || raw.body || ""
    };
  }

  function handleSave() {
    var source, segment, formData;
    if (currentMode === "youtube") {
      formData = getYoutubeData();
      if (!formData.url) { alert("URL is required."); return; }
      source = window.FMStock.ui.ingest.youtube.buildYoutubeSource(formData);
      segment = window.FMStock.ui.ingest.youtube.buildYoutubeSegment(formData);
    } else {
      formData = getReportData();
      if (!formData.title) { alert("Title is required."); return; }
      source = window.FMStock.ui.ingest.report.buildReportSource(formData);
      segment = window.FMStock.ui.ingest.report.buildReportSegment(formData);
    }
    var payload = { status: "candidate", official: false, source: source, segment: segment, mode: currentMode };
    var previewEl = document.getElementById("json-preview");
    if (previewEl) previewEl.textContent = JSON.stringify(payload, null, 2);
    console.log("[IngestMain] Candidate preview payload:", payload);
  }

  function handleReviewNavigation() {
    ["btn-go-review", "btn-review-youtube", "btn-review-report"].forEach(function (id) {
      bindClick(id, function() {
        localStorage.setItem("ingest_pending", "true");
        window.location.href = "review.html";
      });
    });
  }

  window.FMStock.ui.ingest.main = {
    initIngestPage: initIngestPage,
    showYoutubeMode: showYoutubeMode,
    showReportMode: showReportMode,
    handleSave: handleSave,
    handleReviewNavigation: handleReviewNavigation
  };
})();

document.addEventListener("DOMContentLoaded", function() { window.FMStock.ui.ingest.main.initIngestPage(); });
