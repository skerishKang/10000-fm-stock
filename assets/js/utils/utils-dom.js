/**
 * utils-dom.js
 * DOM manipulation helpers, number/date formatting, URL params, sanitization, and debounce.
 */

(function () {
  'use strict';

  /**
   * Creates a DOM element with attributes and children.
   * @param {string} tag - HTML tag name
   * @param {Object} [attrs] - Attribute key-value pairs
   * @param {Array|string} [children] - Child elements or text content
   * @returns {HTMLElement}
   */
  function createElement(tag, attrs, children) {
    var el = document.createElement(tag);

    if (attrs) {
      for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) {
          if (key === 'className') {
            el.className = attrs[key];
          } else if (key === 'style' && typeof attrs[key] === 'object') {
            for (var sk in attrs[key]) {
              if (attrs[key].hasOwnProperty(sk)) {
                el.style[sk] = attrs[key][sk];
              }
            }
          } else if (key.startsWith('data-')) {
            el.setAttribute(key, attrs[key]);
          } else {
            el.setAttribute(key, attrs[key]);
          }
        }
      }
    }

    if (children !== undefined && children !== null) {
      if (typeof children === 'string') {
        el.textContent = children;
      } else if (Array.isArray(children)) {
        children.forEach(function (child) {
          if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
          } else if (child instanceof Node) {
            el.appendChild(child);
          }
        });
      } else if (children instanceof Node) {
        el.appendChild(children);
      }
    }

    return el;
  }

  /**
   * Formats a number with comma separators.
   * @param {number} n - Number to format
   * @returns {string} e.g. "1,000"
   */
  function formatNumber(n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    return Number(n).toLocaleString('en-US');
  }

  /**
   * Formats a value as a percentage string with sign.
   * @param {number} n - Raw percent value (e.g. 16.67 for 16.67%)
   * @returns {string} e.g. "+16.67%"
   */
  function formatPercent(n) {
    if (n === null || n === undefined || isNaN(n)) return '0.00%';
    var pct = Number(n).toFixed(2);
    var sign = pct >= 0 ? '+' : '';
    return sign + pct + '%';
  }

  /**
   * Formats a date string to YYYY.MM.DD format.
   * @param {string} dateStr - Input date string (ISO format preferred)
   * @returns {string} e.g. "2025.05.01"
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + day;
  }

  /**
   * Extracts a query parameter from the current URL.
   * @param {string} name - Parameter name
   * @returns {string|null}
   */
  function getParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /**
   * HTML-escapes a string to prevent XSS.
   * @param {string} text - Raw text
   * @returns {string} Escaped text
   */
  function sanitize(text) {
    if (typeof text !== 'string') return '';
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
  }

  /**
   * Creates a debounced version of a function.
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var ctx = this;
      var args = arguments;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
        timer = null;
      }, delay);
    };
  }

  // Export to global scope
  window.UtilsDom = {
    createElement: createElement,
    formatNumber: formatNumber,
    formatPercent: formatPercent,
    formatDate: formatDate,
    getParam: getParam,
    sanitize: sanitize,
    debounce: debounce
  };
})();
