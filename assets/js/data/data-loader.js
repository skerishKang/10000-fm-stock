/**
 * data-loader.js
 * Loads all JSON data files from /data/ directory with caching.
 * Supports 6 datasets: experts, sources, segments, claims, evaluations, knowledge_notes.
 */

(function () {
  'use strict';

  const DATA_FILES = [
    { name: 'experts', url: 'data/experts.json' },
    { name: 'sources', url: 'data/sources.json' },
    { name: 'segments', url: 'data/segments.json' },
    { name: 'claims', url: 'data/claims.json' },
    { name: 'evaluations', url: 'data/evaluations.json' },
    { name: 'knowledgeNotes', url: 'data/knowledge_notes.json' }
  ];

  let cache = null;

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
