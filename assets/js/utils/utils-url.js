/**
 * utils-url.js
 * YouTube URL parsing and manipulation utilities.
 */

(function () {
  'use strict';

  /**
   * Builds a YouTube URL with an optional start time parameter.
   * Handles various YouTube URL formats (watch, short, embed).
   * @param {string} baseUrl - YouTube video URL
   * @param {number|string} [startTime] - Start time in seconds
   * @returns {string} YouTube URL with start time if provided
   */
  function buildYoutubeUrl(baseUrl, startTime) {
    if (!baseUrl) return '';

    // Clean the URL first
    var cleanUrl = baseUrl.split('?')[0].split('&')[0];

    // Extract video ID to rebuild a canonical URL
    var videoId = getYoutubeId(baseUrl);
    if (!videoId) return baseUrl;

    var canonical = 'https://www.youtube.com/watch?v=' + videoId;

    if (startTime !== undefined && startTime !== null) {
      var seconds = typeof startTime === 'number'
        ? Math.floor(startTime)
        : parseInt(startTime, 10);
      if (!isNaN(seconds) && seconds > 0) {
        return canonical + '&t=' + seconds + 's';
      }
    }

    return canonical;
  }

  /**
   * Checks whether a given URL is a valid YouTube URL.
   * @param {string} url - URL to check
   * @returns {boolean} True if the URL matches YouTube patterns
   */
  function isYoutubeUrl(url) {
    if (!url || typeof url !== 'string') return false;

    var patterns = [
      /^https?:\/\/(www\.)?youtube\.com\//,
      /^https?:\/\/youtu\.be\//,
      /^https?:\/\/(www\.)?youtube\.com\/embed\//,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\//,
      /^https?:\/\/m\.youtube\.com\//
    ];

    return patterns.some(function (re) { return re.test(url); });
  }

  /**
   * Extracts the YouTube video ID from a URL.
   * Supports watch, short, embed, and youtu.be formats.
   * @param {string} url - YouTube URL
   * @returns {string|null} Video ID or null if not found
   */
  function getYoutubeId(url) {
    if (!url || typeof url !== 'string') return null;

    var patterns = [
      // youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
      // youtu.be/VIDEO_ID
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      // youtube.com/embed/VIDEO_ID
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      // youtube.com/shorts/VIDEO_ID
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      // youtube.com/v/VIDEO_ID
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
    ];

    for (var i = 0; i < patterns.length; i++) {
      var match = url.match(patterns[i]);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  // Export to global scope
  window.UtilsUrl = {
    buildYoutubeUrl: buildYoutubeUrl,
    isYoutubeUrl: isYoutubeUrl,
    getYoutubeId: getYoutubeId
  };
})();
