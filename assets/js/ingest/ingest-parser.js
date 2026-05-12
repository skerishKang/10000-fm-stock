/**
 * ingest-parser.js
 * Shared parsing utilities for ingestion.
 * Namespace: FMStock.ui.ingest.parser
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.ingest = window.FMStock.ui.ingest || {};

(function () {
  function parseYoutubeUrl(url) {
    if (!url) return { videoId: null, valid: false };
    var patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (var pi = 0; pi < patterns.length; pi++) {
      var m = url.match(patterns[pi]);
      if (m) return { videoId: m[1], valid: true };
    }
    return { videoId: null, valid: false };
  }

  function parseMultipleTimes(str) {
    if (!str) return null;
    var trimmed = str.trim();
    var sep = trimmed.indexOf("~") !== -1 ? "~" : (trimmed.indexOf("-") !== -1 ? "-" : null);
    if (!sep) return null;
    var parts = trimmed.split(sep).map(function(s) { return s.trim(); });
    if (parts.length !== 2) return null;
    return { start: parts[0], end: parts[1] };
  }

  function autoDetectMode(formData) {
    if (!formData) return "youtube";
    if (formData.url && formData.url.indexOf("youtube.com") !== -1) return "youtube";
    if (formData.url && formData.url.indexOf("youtu.be") !== -1) return "youtube";
    if (formData.transcript) return "youtube";
    if (formData.page || formData.excerpt) return "report";
    if (formData.privatePath) return "report";
    if (formData.analyst) return "report";
    return "youtube";
  }

  function generateSamplePreview(formData) {
    var mode = autoDetectMode(formData);
    var source, segment;
    if (mode === "youtube") {
      source = { sourceType: "youtube", url: formData.url || "", title: formData.title || "", publisher: formData.publisher || "", publishedAt: formData.publishedAt || "", createdAt: new Date().toISOString() };
      segment = { segmentType: "youtube_clip", startTimeSec: 0, endTimeSec: 0, transcript: formData.transcript || "" };
    } else {
      source = { sourceType: "report", title: formData.title || "", publisher: formData.publisher || "", analyst: formData.analyst || "", publishedAt: formData.publishedAt || "", createdAt: new Date().toISOString() };
      segment = { segmentType: "report_excerpt", page: formData.page || null, sectionTitle: formData.sectionTitle || "", excerpt: formData.excerpt || "" };
    }
    return { source: source, segment: segment, mode: mode };
  }

  function sanitizeInput(text) {
    if (!text) return "";
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\s+/g, " ").trim();
  }

  window.FMStock.ui.ingest.parser = {
    parseYoutubeUrl: parseYoutubeUrl,
    parseMultipleTimes: parseMultipleTimes,
    autoDetectMode: autoDetectMode,
    generateSamplePreview: generateSamplePreview,
    sanitizeInput: sanitizeInput
  };
})();
