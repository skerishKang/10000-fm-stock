(function () {
  'use strict';

  function getBasePath() {
    return window.location.pathname.indexOf('/pages/') !== -1 ? '../' : '';
  }

  var DATA_BASE = getBasePath() + 'data/';
  var DATA_FILES = [
    { name: 'experts', url: DATA_BASE + 'experts.json' },
    { name: 'sources', url: DATA_BASE + 'sources.json' },
    { name: 'segments', url: DATA_BASE + 'segments.json' },
    { name: 'claims', url: DATA_BASE + 'claims.json' },
    { name: 'evaluations', url: DATA_BASE + 'evaluations.json' },
    { name: 'knowledgeNotes', url: DATA_BASE + 'knowledge_notes.json' }
  ];
  var cache = null;

  async function fetchOne(name, url) {
    try {
      var resp = await fetch(url);
      if (!resp.ok) {
        console.warn('[data-loader] ' + name + ' returned ' + resp.status);
        return [];
      }
      var data = await resp.json();
      return Array.isArray(data) ? data : (data.data || data);
    } catch (err) {
      console.warn('[data-loader] Failed to load ' + name + ':', err.message);
      return [];
    }
  }

  async function loadAllData() {
    if (cache) return cache;
    var results = await Promise.all(DATA_FILES.map(function (df) {
      return fetchOne(df.name, df.url);
    }));
    cache = {};
    DATA_FILES.forEach(function (df, i) {
      cache[df.name] = results[i];
    });
    return cache;
  }

  function getData(name) {
    if (!cache) return null;
    return cache[name] || null;
  }

  function clearCache() {
    cache = null;
  }

  window.DataLoader = {
    loadAllData: loadAllData,
    getData: getData,
    clearCache: clearCache,
    getBasePath: getBasePath
  };
})();
