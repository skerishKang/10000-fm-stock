/**
 * utils-date.js
 * Date/time parsing and formatting utilities.
 * Namespace: FMStock.utils.date
 */

window.FMStock = window.FMStock || {};
window.FMStock.utils = window.FMStock.utils || {};

(function () {
  'use strict';

  function parseTimeInput(input) {
    if (typeof input === 'number') return Math.floor(input);
    if (typeof input !== 'string') return 0;
    var trimmed = input.trim();
    if (!trimmed) return 0;
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    var parts = trimmed.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  function formatTime(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) return '00:00';
    var totalSec = Math.floor(seconds);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function daysBetween(d1, d2) {
    var date1 = (typeof d1 === 'string') ? new Date(d1) : d1;
    var date2 = (typeof d2 === 'string') ? new Date(d2) : d2;
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
    var diffMs = Math.abs(date2 - date1);
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  function monthsBetween(d1, d2) {
    var date1 = (typeof d1 === 'string') ? new Date(d1) : d1;
    var date2 = (typeof d2 === 'string') ? new Date(d2) : d2;
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
    var start, end;
    if (date1 <= date2) { start = date1; end = date2; }
    else { start = date2; end = date1; }
    var months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) months--;
    return Math.max(0, months);
  }

  window.FMStock.utils.date = {
    parseTimeInput: parseTimeInput,
    formatTime: formatTime,
    daysBetween: daysBetween,
    monthsBetween: monthsBetween
  };
})();
