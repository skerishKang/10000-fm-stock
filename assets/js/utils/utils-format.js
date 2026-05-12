/**
 * utils-format.js
 * Formatting utilities for financial data display: returns, directions, results, types, industries.
 * All values are displayed in Korean per the application's locale.
 */

(function () {
  'use strict';

  /**
   * Formats a return value with colour-coding.
   * Positive returns appear in red (gain), negative in blue (loss).
   * @param {number} value - Return value (decimal, e.g. 0.05 for +5%)
   * @returns {string} HTML span with colour class
   */
  function formatReturn(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return '<span class="return-neutral">0.00%</span>';
    }

    var pct = (value * 100).toFixed(2);
    var cls, sign;

    if (value > 0) {
      cls = 'return-positive';
      sign = '+';
    } else if (value < 0) {
      cls = 'return-negative';
      sign = '';
    } else {
      cls = 'return-neutral';
      sign = '';
    }

    return '<span class="' + cls + '">' + sign + pct + '%</span>';
  }

  /**
   * Converts a direction keyword to Korean.
   * @param {string} dir - Direction key (bullish, bearish, neutral)
   * @returns {string} Korean translation
   */
  function formatDirection(dir) {
    if (!dir) return '';
    var map = {
      bullish: '상승전망',
      bearish: '하락전망',
      neutral: '중립전망',
      'bullish': '상승전망',
      'bearish': '하락전망',
      'neutral': '중립전망',
      up: '상승',
      down: '하락',
      sideways: '횡보'
    };
    return map[dir.toLowerCase()] || dir;
  }

  /**
   * Converts a result keyword to Korean.
   * @param {string} result - Result key (hit, miss, pending, partial)
   * @returns {string} Korean translation
   */
  function formatResult(result) {
    if (!result) return '';
    var map = {
      hit: '적중',
      miss: '실패',
      pending: '진행중',
      partial: '부분적중',
      correct: '정확',
      incorrect: '부정확',
      unknown: '미확인'
    };
    return map[result.toLowerCase()] || result;
  }

  /**
   * Converts a data type/entity key to Korean.
   * @param {string} type - Type key
   * @returns {string} Korean translation
   */
  function formatType(type) {
    if (!type) return '';
    var map = {
      expert: '전문가',
      source: '출처',
      segment: '구간',
      claim: '주장',
      evaluation: '평가',
      knowledge_note: '지식노트',
      video: '영상',
      transcript: '스크립트',
      analysis: '분석',
      report: '보고서'
    };
    return map[type.toLowerCase()] || type;
  }

  /**
   * Converts an industry keyword to Korean.
   * @param {string} industry - Industry key
   * @returns {string} Korean translation
   */
  function formatIndustry(industry) {
    if (!industry) return '';
    var map = {
      tech: '기술주',
      technology: '기술주',
      finance: '금융주',
      healthcare: '헬스케어',
      energy: '에너지',
      consumer: '소비재',
      'consumer goods': '소비재',
      industrials: '산업재',
      materials: '소재',
      utilities: '유틸리티',
      real_estate: '부동산',
      realestate: '부동산',
      communication: '통신',
      'communication services': '통신',
      'information technology': '정보기술',
      it: '정보기술',
      semiconductor: '반도체',
      semiconduct: '반도체',
      bio: '바이오',
      biotech: '바이오',
      'bio tech': '바이오',
      ev: '전기차',
      electric_vehicle: '전기차',
      battery: '배터리',
      '2차전지': '배터리',
      ai: '인공지능',
      'artificial intelligence': '인공지능'
    };
    return map[industry.toLowerCase()] || industry;
  }

  // Export to global scope
  window.UtilsFormat = {
    formatReturn: formatReturn,
    formatDirection: formatDirection,
    formatResult: formatResult,
    formatType: formatType,
    formatIndustry: formatIndustry
  };
})();
