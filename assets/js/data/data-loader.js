(function () {
  'use strict';

  function getBasePath() {
    return window.location.pathname.indexOf('/pages/') !== -1 ? '../' : '';
  }

  function getCurrentPageName() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    if (page.indexOf('.html') === -1) page += '.html';
    return page;
  }

  var DATA_BASE = getBasePath() + 'data/';

  /** Required datasets — app cannot reliably render claim evidence without these.
   * Keep aligned with scripts/validate-data.js claim reference checks.
   */
  var REQUIRED_DATASETS = ['experts', 'sources', 'segments', 'claims', 'evaluations'];

  var PAGE_REQUIRED_DATASETS = {
    'index.html': ['experts', 'claims', 'evaluations', 'knowledgeNotes'],
    'claims.html': ['experts', 'sources', 'segments', 'claims', 'evaluations'],
    'source-hub.html': ['sourceLinks', 'candidateSources'],
    'experts.html': ['experts', 'claims', 'evaluations'],
    'experts-detail.html': ['experts', 'claims', 'evaluations'],
    'review.html': ['experts', 'claims', 'evaluations', 'knowledgeNotes'],
    'knowledge.html': ['knowledgeNotes', 'sources', 'segments', 'experts'],
    'ranking.html': ['experts', 'claims', 'evaluations'],
    'sources.html': ['sources', 'segments', 'claims']
  };

  var DATA_FILES = [
    { name: 'experts',          url: DATA_BASE + 'experts.json',                   required: true },
    { name: 'sources',          url: DATA_BASE + 'sources.json',                   required: true },
    { name: 'segments',         url: DATA_BASE + 'segments.json',                  required: true },
    { name: 'claims',           url: DATA_BASE + 'claims.json',                    required: true },
    { name: 'evaluations',      url: DATA_BASE + 'evaluations.json',               required: true },
    { name: 'knowledgeNotes',   url: DATA_BASE + 'knowledge_notes.json',           required: false },
    { name: 'sourceLinks',      url: DATA_BASE + 'source-links.json',              required: false },
    { name: 'candidateSources', url: DATA_BASE + 'candidate-sources.sample.json',  required: false }
  ];

  var cache = null;
  var loadErrors = [];
  var datasetStatus = {};

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

  function showPageDataError(pageName, missing) {
    if (!missing || !missing.length) return;
    var msg = '현재 페이지에 필요한 데이터셋이 비어 있거나 로드되지 않았습니다: ' + missing.join(', ') +
      '. 브라우저 콘솔에서 FMStock.data.getDiagnostics() 로 자세한 정보를 확인하세요.';
    showBootError(msg);
    console.error('[data-loader] Page required dataset policy failed for ' + pageName + ': ' + missing.join(', '));
  }

  function createLoadError(df, message, details) {
    var err = new Error(message);
    err.dataset = df.name;
    err.url = df.url;
    if (details) {
      if (details.status !== undefined) err.status = details.status;
      if (details.detail !== undefined) err.detail = details.detail;
    }
    return err;
  }

  /* ── Single dataset fetch ──────────────────────────────── */

  async function fetchOne(df) {
    try {
      var resp = await fetch(df.url);
      if (!resp.ok) {
        var msg = '[data-loader] ' + df.name + ' returned ' + resp.status;
        if (df.required) {
          throw createLoadError(df, msg, { status: resp.status });
        } else {
          console.warn(msg);
          throw createLoadError(df, msg, { status: resp.status });
        }
      }
      var data = await resp.json();
      var resolved = Array.isArray(data) ? data : (Array.isArray(data && data.data) ? data.data : null);
      if (resolved === null) {
        var rootType = Array.isArray(data) ? 'array' : typeof data;
        var errMsg = '[data-loader] ' + df.name + ' root is ' + rootType + ', expected array';
        if (df.required) {
          console.error(errMsg);
          throw createLoadError(df, errMsg, { detail: 'root is ' + rootType + ', expected array' });
        } else {
          console.warn(errMsg);
          throw createLoadError(df, errMsg, { detail: 'root is ' + rootType + ', expected array' });
        }
      }
      return resolved;
    } catch (err) {
      if (df.required) {
        throw err;
      } else {
        console.warn('[data-loader] Failed to load ' + df.name + ': ' + err.message);
        throw err;
      }
    }
  }

  /* ── Load all datasets ─────────────────────────────────── */

  async function loadAllData() {
    if (cache) return cache;
    loadErrors = [];
    datasetStatus = {};
    cache = {};

    // Use allSettled so we can inspect every result
    var results = await Promise.allSettled(DATA_FILES.map(function (df) {
      return fetchOne(df);
    }));

    var failedRequired = [];

    DATA_FILES.forEach(function (df, i) {
      if (results[i].status === 'fulfilled') {
        cache[df.name] = results[i].value;
        datasetStatus[df.name] = { loaded: true, failed: false, required: df.required, url: df.url };
      } else {
        datasetStatus[df.name] = { loaded: false, failed: true, required: df.required, url: df.url };
        recordLoadError(df, results[i].reason);
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

    var pagePolicy = validatePageRequiredDatasets(getCurrentPageName(), cache);
    if (!pagePolicy.ok) {
      showPageDataError(pagePolicy.page, pagePolicy.missing);
    }

    return cache;
  }

  function recordLoadError(df, reason) {
    var err = reason || {};
    var entry = {
      dataset: df.name,
      url: df.url,
      error: err.detail || err.message || String(reason)
    };
    if (err.status !== undefined) entry.status = err.status;
    loadErrors.push(entry);
  }

  function validatePageRequiredDatasets(pageName, data) {
    var page = pageName || getCurrentPageName();
    var required = PAGE_REQUIRED_DATASETS[page] || [];
    var source = data || cache || {};
    var missing = required.filter(function (name) {
      var status = datasetStatus[name];
      var value = source[name];
      if (status && status.failed) return true;
      return !Array.isArray(value);
    });
    return {
      ok: missing.length === 0,
      page: page,
      required: required.slice(),
      missing: missing
    };
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
    datasetStatus = {};
  }

  /* ── Diagnostics ───────────────────────────────────────── */

  function getDiagnostics() {
    var pageName = getCurrentPageName();
    var diag = {
      datasets: {},
      basePath: getBasePath(),
      dataBaseUrl: DATA_BASE,
      requiredDatasets: REQUIRED_DATASETS,
      pageRequiredDatasets: PAGE_REQUIRED_DATASETS,
      currentPageRequiredDatasets: PAGE_REQUIRED_DATASETS[pageName] || [],
      currentPageValidation: validatePageRequiredDatasets(pageName, cache),
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
      var status = datasetStatus[df.name] || {};
      diag.datasets[df.name] = {
        loaded: loaded,
        failed: !!status.failed,
        required: df.required,
        url: df.url,
        count: loaded && Array.isArray(value) ? value.length : 0
      };
    });
    return diag;
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
    validatePageRequiredDatasets: validatePageRequiredDatasets,
    REQUIRED_DATASETS: REQUIRED_DATASETS,
    PAGE_REQUIRED_DATASETS: PAGE_REQUIRED_DATASETS
  };

  // DataLoader — legacy compatibility
  window.DataLoader = {
    loadAllData: loadAllData,
    getData: getData,
    clearCache: clearCache,
    getBasePath: getBasePath,
    getDiagnostics: getDiagnostics,
    validatePageRequiredDatasets: validatePageRequiredDatasets,
    REQUIRED_DATASETS: REQUIRED_DATASETS,
    PAGE_REQUIRED_DATASETS: PAGE_REQUIRED_DATASETS
  };
})();