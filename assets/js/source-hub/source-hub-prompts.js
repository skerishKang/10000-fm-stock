window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.sourceHub = window.FMStock.ui.sourceHub || {};

(function () {
  'use strict';

  var SourceHub = window.FMStock.ui.sourceHub;

  var PROMPTS = {
    youtube: [
      'Role: You are a stock statement data curator for FM-Stock.',
      '',
      'Input:',
      '- Expert/speaker name:',
      '- Channel/source name:',
      '- Video URL:',
      '- Published date:',
      '- Segment start/end:',
      '- Transcript excerpt or manual summary:',
      '',
      'Task:',
      '1. Decide whether the segment contains verifiable investment-related claims.',
      '2. Separate ticker/company claims, industry claims, macro/market claims, and educational knowledge.',
      '3. Extract only claims that can later be evaluated by price/benchmark movement or clearly defined factual outcome.',
      '4. Put educational explanations into knowledge_note candidates.',
      '5. Do not copy long source text. Use only timestamp and short paraphrased rationale.',
      '6. Mark uncertain items with review warnings.',
      '',
      'Output JSON:',
      '{ "sourceCandidate": {}, "segmentCandidate": {}, "claimCandidates": [], "knowledgeNoteCandidates": [], "reviewWarnings": [] }'
    ].join('\n'),
    report: [
      'Role: You are a brokerage report data curator for FM-Stock.',
      '',
      'Input:',
      '- Report URL:',
      '- Provider/aggregator:',
      '- Brokerage firm:',
      '- Analyst:',
      '- Report title:',
      '- Published date:',
      '- Report type:',
      '- Page/section:',
      '- Short excerpt or manual summary:',
      '',
      'Task:',
      '1. Identify verifiable company, industry, strategy, or macro claims.',
      '2. Separate price/return-verifiable claims from educational knowledge.',
      '3. Record target company/ticker, industry, direction, base date, and suggested horizon when inferable.',
      '4. Preserve source reference as URL + page/section only.',
      '5. Do not reproduce long report text.',
      '6. Add review warnings for ambiguity, unclear horizon, unverifiable claim, or possible duplicate.',
      '',
      'Output JSON:',
      '{ "sourceCandidate": {}, "claimCandidates": [], "knowledgeNoteCandidates": [], "reviewWarnings": [] }'
    ].join('\n')
  };

  function init() {
    setPromptText('prompt-youtube', PROMPTS.youtube);
    setPromptText('prompt-report', PROMPTS.report);

    document.querySelectorAll('[data-copy-prompt]').forEach(function (button) {
      button.addEventListener('click', function () {
        var key = button.getAttribute('data-copy-prompt');
        copyPrompt(key);
      });
    });
  }

  function setPromptText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function copyPrompt(key) {
    var text = PROMPTS[key] || '';
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus(key, '복사 완료');
      }).catch(function () {
        fallbackCopy(key, text);
      });
      return;
    }

    fallbackCopy(key, text);
  }

  function fallbackCopy(key, text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setStatus(key, '복사 완료');
    } catch (err) {
      setStatus(key, '복사 실패');
    }
    document.body.removeChild(textarea);
  }

  function setStatus(key, message) {
    var el = document.getElementById('prompt-status-' + key);
    if (el) el.textContent = message;
  }

  SourceHub.prompts = {
    init: init,
    PROMPTS: PROMPTS
  };
})();
