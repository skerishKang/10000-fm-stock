/**
 * utils-id.js
 * Simple unique ID generator with optional prefix.
 */

(function () {
  'use strict';

  var counters = {};

  /**
   * Generates a sequential ID with an optional prefix.
   * Format: {prefix}_{0001}
   * If prefix is omitted, returns a simple zero-padded number.
   * @param {string} [prefix] - Prefix string
   * @returns {string} Generated ID
   */
  function generateId(prefix) {
    var key = prefix || '_default';
    if (!counters[key]) {
      counters[key] = 0;
    }
    counters[key]++;
    var num = String(counters[key]).padStart(4, '0');
    return prefix ? prefix + '_' + num : num;
  }

  /**
   * Generates a timestamp-based unique ID.
   * Format: {prefix}_{timestamp}_{counter}
   * Useful when IDs need to be unique across page reloads.
   * @param {string} [prefix] - Prefix string
   * @returns {string} Timestamp-based ID
   */
  function generateTimestampId(prefix) {
    var ts = Date.now().toString(36);
    var rand = Math.random().toString(36).substring(2, 6);
    return prefix ? prefix + '_' + ts + '_' + rand : ts + '_' + rand;
  }

  /**
   * Resets the counter for a given prefix.
   * @param {string} [prefix] - Prefix to reset (resets all if omitted)
   */
  function resetCounter(prefix) {
    if (prefix) {
      delete counters[prefix];
    } else {
      counters = {};
    }
  }

  // Export to global scope
  window.UtilsId = {
    generateId: generateId,
    generateTimestampId: generateTimestampId,
    resetCounter: resetCounter
  };
})();
