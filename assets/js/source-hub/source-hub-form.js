window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.sourceHub = window.FMStock.ui.sourceHub || {};

(function () {
  'use strict';

  var SourceHub = window.FMStock.ui.sourceHub;

  function init() {
    var form = document.getElementById('source-candidate-form');
    if (!form) return;

    form.addEventListener('input', function () { renderPreview(form); });
    form.addEventListener('change', function () { renderPreview(form); });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      renderPreview(form);
    });

    var copyButton = document.getElementById('copy-candidate-json');
    if (copyButton) {
      copyButton.addEventListener('click', copyPreview);
    }

    renderPreview(form);
  }

  function buildCandidate(form) {
    var values = readForm(form);
    var title = values.title || values.url || values.privatePath || 'untitled-source';

    return {
      id: buildLocalId(values.type, values.publishedAt, title, values.url || values.privatePath),
      type: values.type,
      url: values.url,
      privatePath: values.privatePath,
      pageOrSection: values.pageOrSection,
      referenceMemo: values.referenceMemo,
      title: values.title,
      publisher: values.publisher,
      speakerOrAuthor: values.speakerOrAuthor,
      publishedAt: values.publishedAt || null,
      startTime: values.startTime || null,
      endTime: values.endTime || null,
      relatedTickers: splitList(values.relatedTickers),
      relatedCompanies: splitList(values.relatedCompanies),
      relatedIndustries: splitList(values.relatedIndustries),
      status: 'candidate',
      claimCandidateMemo: values.claimCandidateMemo || 'Not reviewed yet.',
      knowledgeCandidateMemo: values.knowledgeCandidateMemo || 'Not reviewed yet.',
      reviewWarnings: splitLines(values.reviewWarnings),
      createdBy: 'local_operator',
      official: false
    };
  }

  function readForm(form) {
    var data = new FormData(form);
    return {
      type: clean(data.get('type')) || 'other',
      url: clean(data.get('url')),
      privatePath: clean(data.get('privatePath')),
      pageOrSection: clean(data.get('pageOrSection')),
      referenceMemo: clean(data.get('referenceMemo')),
      title: clean(data.get('title')),
      publisher: clean(data.get('publisher')),
      speakerOrAuthor: clean(data.get('speakerOrAuthor')),
      publishedAt: clean(data.get('publishedAt')),
      startTime: clean(data.get('startTime')),
      endTime: clean(data.get('endTime')),
      relatedTickers: clean(data.get('relatedTickers')),
      relatedCompanies: clean(data.get('relatedCompanies')),
      relatedIndustries: clean(data.get('relatedIndustries')),
      claimCandidateMemo: clean(data.get('claimCandidateMemo')),
      knowledgeCandidateMemo: clean(data.get('knowledgeCandidateMemo')),
      reviewWarnings: clean(data.get('reviewWarnings'))
    };
  }

  function renderPreview(form) {
    var preview = document.getElementById('candidate-json-preview');
    if (!preview) return;
    var candidate = buildCandidate(form);
    preview.textContent = JSON.stringify(candidate, null, 2);
  }

  function copyPreview() {
    var preview = document.getElementById('candidate-json-preview');
    if (!preview) return;
    var text = preview.textContent || '';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setCopyStatus('복사 완료');
      }).catch(function () {
        fallbackCopy(text);
      });
      return;
    }

    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopyStatus('복사 완료');
    } catch (err) {
      setCopyStatus('복사 실패: 수동으로 선택해 복사하세요.');
    }
    document.body.removeChild(textarea);
  }

  function setCopyStatus(message) {
    var status = document.getElementById('copy-status');
    if (status) status.textContent = message;
  }

  function buildLocalId(type, publishedAt, title, url) {
    var seed = [type, publishedAt || 'undated', title || url || 'source'].join('-');
    var slug = seed.toLowerCase()
      .replace(/https?:\/\//g, '')
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 72);
    return 'candidate-source-' + (slug || 'local');
  }

  function splitList(value) {
    if (!value) return [];
    return value.split(/[;,\n]/).map(clean).filter(Boolean);
  }

  function splitLines(value) {
    if (!value) return [];
    return value.split(/\n/).map(clean).filter(Boolean);
  }

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  SourceHub.form = {
    init: init,
    buildCandidate: buildCandidate
  };
})();
