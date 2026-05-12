/**
 * ingest-report.js
 * Report form data extraction, validation, and JSON builders.
 * Namespace: FMStock.ui.ingest.report
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.ingest = window.FMStock.ui.ingest || {};

(function () {
  function getReportFormData() {
    return {
      title: (document.getElementById("rp-title") ? document.getElementById("rp-title").value : "").trim(),
      publisher: (document.getElementById("rp-publisher") ? document.getElementById("rp-publisher").value : "").trim(),
      analyst: (document.getElementById("rp-analyst") ? document.getElementById("rp-analyst").value : "").trim(),
      publishedAt: (document.getElementById("rp-published") ? document.getElementById("rp-published").value : "").trim(),
      url: (document.getElementById("rp-url") ? document.getElementById("rp-url").value : "").trim(),
      privatePath: (document.getElementById("rp-private") ? document.getElementById("rp-private").value : "").trim(),
      page: (document.getElementById("rp-page") ? document.getElementById("rp-page").value : "").trim(),
      sectionTitle: (document.getElementById("rp-section") ? document.getElementById("rp-section").value : "").trim(),
      ticker: (document.getElementById("rp-ticker") ? document.getElementById("rp-ticker").value : "").trim(),
      industry: (document.getElementById("rp-industry") ? document.getElementById("rp-industry").value : "").trim(),
      memo: (document.getElementById("rp-memo") ? document.getElementById("rp-memo").value : "").trim(),
      excerpt: (document.getElementById("rp-excerpt") ? document.getElementById("rp-excerpt").value : "").trim()
    };
  }

  function validateReportForm(data) {
    if (!data.title) { alert("Title is required."); return false; }
    if (!data.publisher) { alert("Publisher is required."); return false; }
    return true;
  }

  function buildReportSource(data) {
    return { sourceType: "report", title: data.title, publisher: data.publisher, analyst: data.analyst, publishedAt: data.publishedAt, url: data.url, privatePath: data.privatePath, ticker: data.ticker, industry: data.industry, memo: data.memo, createdAt: new Date().toISOString() };
  }

  function buildReportSegment(data) {
    return { segmentType: "report_excerpt", page: parsePageInput(data.page), sectionTitle: data.sectionTitle, excerpt: data.excerpt, memo: data.memo };
  }

  function parsePageInput(str) {
    if (!str) return null;
    var trimmed = str.trim();
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    var range = trimmed.match(/^(\d+)\s*[-~]\s*(\d+)$/);
    if (range) return { from: parseInt(range[1], 10), to: parseInt(range[2], 10) };
    return trimmed;
  }

  window.FMStock.ui.ingest.report = {
    getReportFormData: getReportFormData,
    validateReportForm: validateReportForm,
    buildReportSource: buildReportSource,
    buildReportSegment: buildReportSegment,
    parsePageInput: parsePageInput
  };
})();
