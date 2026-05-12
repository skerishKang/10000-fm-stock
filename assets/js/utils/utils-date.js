/**
 * utils-date.js
 * Date/time parsing and formatting utilities.
 */

(function () {
  'use strict';

  /**
   * Parses a time input into total seconds.
   * Accepts "MM:SS", "H:MM:SS", or a numeric string (seconds).
   * @param {string|number} input - Time string or seconds
   * @returns {number} Total seconds
   */
  function parseTimeInput(input) {
    if (typeof input === 'number') return Math.floor(input);
    if (typeof input !== 'string') return 0;

    var trimmed = input.trim();
    if (!trimmed) return 0;

    // Pure numeric string
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }

    var parts = trimmed.split(':').map(Number);

    if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // H:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return 0;
  }

  /**
   * Converts total seconds to MM:SS format.
   * @param {number} seconds - Total seconds
   * @returns {string} Formatted string "MM:SS"
   */
  function formatTime(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
      return '00:00';
    }
    var totalSec = Math.floor(seconds);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  /**
   * Calculates the number of full days between two dates.
   * @param {string|Date} d1 - First date
   * @param {string|Date} d2 - Second date
   * @returns {number} Days difference (absolute)
   */
  function daysBetween(d1, d2) {
    var date1 = (typeof d1 === 'string') ? new Date(d1) : d1;
    var date2 = (typeof d2 === 'string') ? new Date(d2) : d2;
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
    var diffMs = Math.abs(date2 - date1);
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculates the number of full calendar months between two dates.
   * @param {string|Date} d1 - First date
   * @param {string|Date} d2 - Second date
   * @returns {number} Month difference (absolute)
   */
  function monthsBetween(d1, d2) {
    var date1 = (typeof d1 === 'string') ? new Date(d1) : d1;
    var date2 = (typeof d2 === 'string') ? new Date(d2) : d2;
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;

    var yearDiff = Math.abs(date2.getFullYear() - date1.getFullYear());
    var monthDiff = Math.abs(date2.getMonth() - date1.getMonth());

    // Ensure start is earlier than end
    var start, end;
    if (date1 <= date2) {
      start = date1;
      end = date2;
    } else {
      start = date2;
      end = date1;
    }

    var months = (end.getFullYear() - start.getFullYear()) * 12 +
                 (end.getMonth() - start.getMonth());

    // Adjust if the end day is before the start day in the month
    if (end.getDate() < start.getDate()) {
      months--;
    }

    return Math.max(0, months);
  }

  // Export to global scope
  window.UtilsDate = {
    parseTimeInput: parseTimeInput,
    formatTime: formatTime,
    daysBetween: daysBetween,
    monthsBetween: monthsBetween
  };
})();
