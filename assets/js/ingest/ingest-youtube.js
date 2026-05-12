/**
 * ingest-youtube.js
 * YouTube form data extraction, validation, and JSON builders.
 */

const IngestYoutube = (() => {

  function getYoutubeFormData() {
    return {
      url: (document.getElementById('yt-url')?.value || '').trim(),
      title: (document.getElementById('yt-title')?.value || '').trim(),
      publisher: (document.getElementById('yt-publisher')?.value || '').trim(),
      publishedAt: (document.getElementById('yt-published')?.value || '').trim(),
      startTime: (document.getElementById('yt-start')?.value || '').trim(),
      endTime: (document.getElementById('yt-end')?.value || '').trim(),
      expertName: (document.getElementById('yt-expert')?.value || '').trim(),
      ticker: (document.getElementById('yt-ticker')?.value || '').trim(),
      industry: (document.getElementById('yt-industry')?.value || '').trim(),
      memo: (document.getElementById('yt-memo')?.value || '').trim(),
      transcript: (document.getElementById('yt-transcript')?.value || '').trim()
    };
  }

  function validateYoutubeForm(data) {
    if (!data.url) { alert('URL is required.'); return false; }
    if (!data.title) { alert('Title is required.'); return false; }
    if (!data.publisher) { alert('Publisher is required.'); return false; }
    return true;
  }

  function buildYoutubeSource(data) {
    return {
      sourceType: 'youtube',
      url: data.url,
      title: data.title,
      publisher: data.publisher,
      publishedAt: data.publishedAt,
      expertName: data.expertName,
      ticker: data.ticker,
      industry: data.industry,
      memo: data.memo,
      createdAt: new Date().toISOString()
    };
  }

  function buildYoutubeSegment(data) {
    return {
      segmentType: 'youtube_clip',
      startTimeSec: parseTimeInput(data.startTime),
      endTimeSec: parseTimeInput(data.endTime),
      startTimeDisplay: formatTimeDisplay(parseTimeInput(data.startTime)),
      endTimeDisplay: formatTimeDisplay(parseTimeInput(data.endTime)),
      transcript: data.transcript,
      memo: data.memo
    };
  }

  function parseTimeInput(str) {
    if (!str) return 0;
    const trimmed = str.trim();
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    const parts = trimmed.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  function formatTimeDisplay(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  }

  return { getYoutubeFormData, validateYoutubeForm, buildYoutubeSource, buildYoutubeSegment, parseTimeInput, formatTimeDisplay };
})();
