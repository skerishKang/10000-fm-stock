window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.sourceHub = window.FMStock.ui.sourceHub || {};

(function () {
  'use strict';

  var SourceHub = window.FMStock.ui.sourceHub;

  function initSourceHubPage(data) {
    data = data || {};
    renderOverview(data);

    if (SourceHub.list && typeof SourceHub.list.init === 'function') {
      SourceHub.list.init(data.sourceLinks || []);
    }

    if (SourceHub.form && typeof SourceHub.form.init === 'function') {
      SourceHub.form.init();
    }

    if (SourceHub.prompts && typeof SourceHub.prompts.init === 'function') {
      SourceHub.prompts.init();
    }
  }

  function renderOverview(data) {
    setText('source-link-count', count(data.sourceLinks));
    setText('candidate-source-count', count(data.candidateSources));
    setText('official-source-count', count(data.sources));
    setText('claim-count', count(data.claims));
  }

  function count(value) {
    return Array.isArray(value) ? value.length : 0;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  SourceHub.main = {
    initSourceHubPage: initSourceHubPage
  };
})();
