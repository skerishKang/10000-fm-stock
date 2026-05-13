(function () {
  'use strict';

  function getBasePath() {
    return window.location.pathname.indexOf('/pages/') !== -1 ? '../' : '';
  }

  var DATA_BASE = getBasePath() + 'data/';

  /** Required datasets — app cannot function without these */
  var REQUIRED_DATASETS = ['experts', 'claims', 'evaluations'];

  var DATA_FILES = [
    { name: 'experts',          url: DATA_BASE + 'experts.json',                   required: true },
    { name: 'sources',          url: DATA_BASE + 'sources.json',                   required: false },
    { name: 'segments',         url: DATA_BASE + 'segments.json',                  required: false },
    { name: 'claims',           url: DATA_BASE + 'claims.json',                    required: true },
    { name: 'evaluations',      url: DATA_BASE + 'evaluations.json',               required: true },
    { name: 'knowledgeNotes',   url: DATA_BASE + 'knowledge_notes.json',           required: false },
    { name: 'sourceLinks',      url: DATA_BASE + 'source-links.json',              required: false },
    { name: 'candidateSources', url: DATA_BASE + 'candidate-sources.sample.json',  required: false }
  ];

  var cache = null;
  var loadErrors = [];

  /* ── DOM error display ─────────────────────────────────── */

  function showBootError(message) {
    var container = document.getElementById('error-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'error-container';
      var target = document.querySelector('.app-main') || document.body;
      target.insertBefore(container, target.firstChild);
    }
    container.innerHTML = '<div class="alert alert-error" role="alert" style="padding:1em;margin-bottom:1em;border:2px solid #c00;background:#fee;color:#c00;border-radius:6px;font-weight:bold">' +
      escapeHtml(message) + '</div>';
  }

  /* ── Single dataset fetch ──────────────────────────────── */

  async function fetchOne(df) {
    try {
      var resp = await fetch(df.url);
      if (!resp.ok) {
        var msg = '[data-loader] ' + df.name + ' returned ' + resp.status;
        if (df.required) {
          loadErrors.push({ dataset: df.name, url: df.url, status: resp.status });
          throw new Error(msg);
        } else {
          console.warn(msg);
          return [];
        }
      }
      var data = await resp.json();
      var resolved = Array.isArray(data) ? data : (Array.isArray(data && data.data) ? data.data : null);
      if (resolved === null) {
        var rootType = Array.isArray(data) ? 'array' : typeof data;
        var errMsg = '[data-loader] ' + df.name + ' root is ' + rootType + ', expected array';
        if (df.required) {
          loadErrors.push({ dataset: df.name, url: df.url, error: 'root is ' + rootType + ', expected array' });
          console.error(errMsg);
          throw new Error(errMsg);
        } else {
          console.warn(errMsg);
          return [];
        }
      }
      return resolved;
    } catch (err) {
      if (df.required) {
        if (!hasLoadError(df.name, df.url, err.message)) {
          loadErrors.push({ dataset: df.name, url: df.url, error: err.message });
        }
        throw err;
      } else {
        console.warn('[data-loader] Failed to load ' + df.name + ': ' + err.message);
        return [];
      }
    }
  }

  /* ── Load all datasets ─────────────────────────────────── */

  async function loadAllData() {
    if (cache) return cache;
    loadErrors = [];
    cache = {};

    // Use allSettled so we can inspect every result
    var results = await Promise.allSettled(DATA_FILES.map(function (df) {
      return fetchOne(df);
    }));

    var failedRequired = [];

    DATA_FILES.forEach(function (df, i) {
      if (results[i].status === 'fulfilled') {
        cache[df.name] = results[i].value;
      } else {
        // fetchOne already pushed to loadErrors for required
        if (df.required) {
          failedRequired.push(df.name);
        }
        cache[df.name] = []; // empty array as fallback
      }
    });

    if (failedRequired.length > 0) {
      var msg = '필수 데이터셋을 불러오지 못했습니다: ' + failedRequired.join(', ') +
        '. 브라우저 콘솔에서 FMStock.data.getDiagnostics() 로 자세한 정보를 확인하세요.';
      showBootError(msg);
      throw new Error(msg);
    }

    return cache;
  }

  /* ── Data access helpers ───────────────────────────────── */

  function getData(name) {
    if (!cache) return null;
    return cache[name] || null;
  }

  function getAll() {
    return cache;
  }

  function clearCache() {
    cache = null;
    loadErrors = [];
  }

  /* ── Diagnostics ───────────────────────────────────────── */

  function getDiagnostics() {
    var diag = {
      datasets: {},
      basePath: getBasePath(),
      dataBaseUrl: DATA_BASE,
      requiredDatasets: REQUIRED_DATASETS,
      location: {
        href: window.location.href,
        pathname: window.location.pathname,
        hostname: window.location.hostname,
        origin: window.location.origin,
        protocol: window.location.protocol
      },
      loadErrors: loadErrors,
      timestamp: new Date().toISOString(),
      dataLoaded: cache !== null
    };
    DATA_FILES.forEach(function (df) {
      var loaded = cache && cache[df.name] !== undefined;
      var value = loaded ? cache[df.name] : null;
      diag.datasets[df.name] = {
        loaded: loaded,
        required: df.required,
        url: df.url,
        count: loaded && Array.isArray(value) ? value.length : 0
      };
    });
    return diag;
  }

  function hasLoadError(dataset, url, message) {
    return loadErrors.some(function (item) {
      return item.dataset === dataset && item.url === url && item.error === message;
    });
  }

  /* ── HTML escaping ─────────────────────────────────────── */

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
    });
  }

  /* ── Public API ────────────────────────────────────────── */

  // FMStock.data — primary namespace (new)
  window.FMStock = window.FMStock || {};
  window.FMStock.data = {
    loadAll: loadAllData,
    getAll: getAll,
    getDataset: getData,
    getDiagnostics: getDiagnostics,
    getBasePath: getBasePath,
    REQUIRED_DATASETS: REQUIRED_DATASETS
  };

  // DataLoader — legacy compatibility
  window.DataLoader = {
    loadAllData: loadAllData,
    getData: getData,
    clearCache: clearCache,
    getBasePath: getBasePath,
    getDiagnostics: getDiagnostics,
    REQUIRED_DATASETS: REQUIRED_DATASETS
  };
})();
