/**
 * data-loader.js
 * Loads all JSON data files from /data/ directory with caching.
 * Supports 6 datasets: experts, sources, segments, claims, evaluations, knowledge_notes.
 */

(function () {
  'use strict';

  /**
   * getBasePath — Resolves the correct base path for data files
   * regardless of whether the page is served from root or a subdirectory.
   * @returns {string} '../' if in a subdirectory, empty string otherwise
   */
  function getBasePath() {
    var path = window.location.pathname;
    // Check if we're in a subdirectory (e.g., /pages/ or /some/dir/)
    var dirs = path.split('/');
    // If there are path segments after the domain root, we're in a subdirectory
    // e.g. /pages/claims.html -> dirs = ['', 'pages', 'claims.html'] -> length 3
    if (dirs.length > 2 && dirs[dirs.length - 1].indexOf('.') !== -1) {
      // Last element is a file, check if there's a directory component
      if (path.lastIndexOf('/') > 0) {
        return '../';
      }
    }
    return '';
  }

  var DATA_FILES = [
    { name: 'experts', url: getBasePath() + 'data/experts.json' },
    { name: 'sources', url: getBasePath() + 'data/sources.json' },
    { name: 'segments', url: getBasePath() + 'data/segments.json' },
    { name: 'claims', url: getBasePath() + 'data/claims.json' },
    { name: 'evaluations', url: getBasePath() + 'data/evaluations.json' },
    { name: 'knowledgeNotes', url: getBasePath() + 'data/knowledge_notes.json' }
  ];

  var cache = null;

  /**
   * Fetches a single JSON file and returns parsed data.
   * On failure, logs a warning and returns an empty array.
   * @param {string} name - Dataset name for logging
   * @param {string} url - URL to fetch
   * @returns {Promise<Array|Object>}
   */
  async function fetchOne(name, url) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        console.warn('[data-loader] ' + name + ' returned ' + resp.status);
        return [];
      }
      const data = await resp.json();
      return Array.isArray(data) ? data : (data.data || data);
    } catch (err) {
      console.warn('[data-loader] Failed to load ' + name + ':', err.message);
      return [];
    }
  }

  /**
   * Loads all 6 datasets in parallel, caches them, and returns the combined object.
   * @returns {Promise<Object>} { experts, sources, segments, claims, evaluations, knowledgeNotes }
   */
  async function loadAllData() {
    if (cache) return cache;

    const promises = DATA_FILES.map(function (df) {
      return fetchOne(df.name, df.url);
    });

    const results = await Promise.all(promises);

    cache = {};
    DATA_FILES.forEach(function (df, i) {
      cache[df.name] = results[i];
    });

    return cache;
  }

  /**
   * Returns a specific dataset by name.
   * If data has not been loaded yet, returns null.
   * @param {string} name - Dataset name (experts, sources, segments, claims, evaluations, knowledgeNotes)
   * @returns {Array|Object|null}
   */
  function getData(name) {
    if (!cache) return null;
    return cache[name] || null;
  }

  /**
   * Clears the cache so the next loadAllData() call re-fetches everything.
   */
  function clearCache() {
    cache = null;
  }

  // Export to global scope
  window.DataLoader = {
    loadAllData: loadAllData,
    getData: getData,
    clearCache: clearCache
  };
})();
