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
  }

  function bindTabButtons() {
    var youtubeTab = document.getElementById("tab-youtube");
    var reportTab = document.getElementById("tab-report");
    if (youtubeTab) youtubeTab.addEventListener("click", function() { showYoutubeMode(); });
    if (reportTab) reportTab.addEventListener("click", function() { showReportMode(); });
  }

  function showYoutubeMode() {
    currentMode = "youtube";
    var ytSection = document.getElementById("ingest-youtube-section");
    var rpSection = document.getElementById("ingest-report-section");
    if (ytSection) ytSection.style.display = "block";
    if (rpSection) rpSection.style.display = "none";
  }

  function showReportMode() {
    currentMode = "report";
    var ytSection = document.getElementById("ingest-youtube-section");
    var rpSection = document.getElementById("ingest-report-section");
    if (ytSection) ytSection.style.display = "none";
    if (rpSection) rpSection.style.display = "block";
  }

  function bindSaveButton() {
    var btn = document.getElementById("btn-save");
    if (btn) btn.addEventListener("click", handleSave);
  }

  function handleSave() {
    var source, segment, formData;
    if (currentMode === "youtube") {
      formData = window.FMStock.ui.ingest.youtube.getYoutubeFormData();
      if (!window.FMStock.ui.ingest.youtube.validateYoutubeForm(formData)) return;
      source = window.FMStock.ui.ingest.youtube.buildYoutubeSource(formData);
      segment = window.FMStock.ui.ingest.youtube.buildYoutubeSegment(formData);
    } else {
      formData = window.FMStock.ui.ingest.report.getReportFormData();
      if (!window.FMStock.ui.ingest.report.validateReportForm(formData)) return;
      source = window.FMStock.ui.ingest.report.buildReportSource(formData);
      segment = window.FMStock.ui.ingest.report.buildReportSegment(formData);
    }
    var payload = { source: source, segment: segment, mode: currentMode };
    console.log("[IngestMain] Save payload:", JSON.stringify(payload, null, 2));
    var previewEl = document.getElementById("json-preview");
    if (previewEl) previewEl.textContent = JSON.stringify(payload, null, 2);
  }

  function handleReviewNavigation() {
    var btn = document.getElementById("btn-go-review");
    if (btn) {
      btn.addEventListener("click", function() {
        localStorage.setItem("ingest_pending", "true");
        window.location.href = "review.html";
      });
    }
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
