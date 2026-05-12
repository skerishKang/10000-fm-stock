/**
 * ingest-parser.js
 * Shared parsing utilities for ingestion.
 */

const IngestParser = (() => {

  function parseYoutubeUrl(url) {
    if (!url) return { videoId: null, valid: false };
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pat of patterns) {
      const m = url.match(pat);
      if (m) return { videoId: m[1], valid: true };
    }
    return { videoId: null, valid: false };
  }

  function parseMultipleTimes(str) {
    if (!str) return null;
    const trimmed = str.trim();
    const sep = trimmed.includes('~') ? '~' : (trimmed.includes('-') ? '-' : null);
    if (!sep) return null;
    const parts = trimmed.split(sep).map(s => s.trim());
    if (parts.length !== 2) return null;
    return { start: parts[0], end: parts[1] };
  }

  function autoDetectMode(formData) {
    if (!formData) return 'youtube';
    if (formData.url && formData.url.includes('youtube.com')) return 'youtube';
    if (formData.url && formData.url.includes('youtu.be')) return 'youtube';
    if (formData.transcript) return 'youtube';
    if (formData.page || formData.excerpt) return 'report';
    if (formData.privatePath) return 'report';
    if (formData.analyst) return 'report';
    return 'youtube';
  }

  function generateSamplePreview(formData) {
    const mode = autoDetectMode(formData);
    let source, segment;
    if (mode === 'youtube') {
      source = {
        sourceType: 'youtube',
        url: formData.url || '',
        title: formData.title || '',
        publisher: formData.publisher || '',
        publishedAt: formData.publishedAt || '',
        createdAt: new Date().toISOString()
      };
      segment = {
        segmentType: 'youtube_clip',
        startTimeSec: 0,
        endTimeSec: 0,
        transcript: formData.transcript || ''
      };
    } else {
      source = {
        sourceType: 'report',
        title: formData.title || '',
        publisher: formData.publisher || '',
        analyst: formData.analyst || '',
        publishedAt: formData.publishedAt || '',
        createdAt: new Date().toISOString()
      };
      segment = {
        segmentType: 'report_excerpt',
        page: formData.page || null,
        sectionTitle: formData.sectionTitle || '',
        excerpt: formData.excerpt || ''
      };
    }
    return { source, segment, mode };
  }

  function sanitizeInput(text) {
    if (!text) return '';
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return { parseYoutubeUrl, parseMultipleTimes, autoDetectMode, generateSamplePreview, sanitizeInput };
})();
