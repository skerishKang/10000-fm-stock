/**
 * ingest-main.js
 * Main entry point for the ingestion page (ingest.html).
 * Handles tab switching, save, and navigation to review.
 */

const IngestMain = (() => {
  let currentMode = 'youtube';

  function initIngestPage() {
    bindTabButtons();
    bindSaveButton();
    bindReviewNavigation();
  }

  function bindTabButtons() {
    const youtubeTab = document.getElementById('tab-youtube');
    const reportTab = document.getElementById('tab-report');
    if (youtubeTab) youtubeTab.addEventListener('click', () => showYoutubeMode());
    if (reportTab) reportTab.addEventListener('click', () => showReportMode());
  }

  function showYoutubeMode() {
    currentMode = 'youtube';
    const ytSection = document.getElementById('ingest-youtube-section');
    const rpSection = document.getElementById('ingest-report-section');
    if (ytSection) ytSection.style.display = 'block';
    if (rpSection) rpSection.style.display = 'none';
  }

  function showReportMode() {
    currentMode = 'report';
    const ytSection = document.getElementById('ingest-youtube-section');
    const rpSection = document.getElementById('ingest-report-section');
    if (ytSection) ytSection.style.display = 'none';
    if (rpSection) rpSection.style.display = 'block';
  }

  function bindSaveButton() {
    const btn = document.getElementById('btn-save');
    if (btn) btn.addEventListener('click', handleSave);
  }

  function handleSave() {
    let source, segment;
    let formData;
    if (currentMode === 'youtube') {
      formData = IngestYoutube.getYoutubeFormData();
      if (!IngestYoutube.validateYoutubeForm(formData)) return;
      source = IngestYoutube.buildYoutubeSource(formData);
      segment = IngestYoutube.buildYoutubeSegment(formData);
    } else {
      formData = IngestReport.getReportFormData();
      if (!IngestReport.validateReportForm(formData)) return;
      source = IngestReport.buildReportSource(formData);
      segment = IngestReport.buildReportSegment(formData);
    }
    const payload = { source, segment, mode: currentMode };
    console.log('[IngestMain] Save payload:', JSON.stringify(payload, null, 2));
    const previewEl = document.getElementById('json-preview');
    if (previewEl) previewEl.textContent = JSON.stringify(payload, null, 2);
  }

  function handleReviewNavigation() {
    const btn = document.getElementById('btn-go-review');
    if (btn) {
      btn.addEventListener('click', () => {
        localStorage.setItem('ingest_pending', 'true');
        window.location.href = 'review.html';
      });
    }
  }

  return { initIngestPage, showYoutubeMode, showReportMode, handleSave, handleReviewNavigation };
})();

document.addEventListener('DOMContentLoaded', () => IngestMain.initIngestPage());
