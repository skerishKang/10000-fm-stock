window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.sourceHub = window.FMStock.ui.sourceHub || {};

(function () {
  'use strict';

  var SourceHub = window.FMStock.ui.sourceHub;
  var activeCategory = 'all';

  var CATEGORY_LABELS = {
    all: '전체',
    youtube: '유튜브',
    broker: '증권사',
    report_aggregator: '리포트 모음',
    article_broadcast: '기사·방송',
    market_data: '시장 데이터'
  };

  function init(sourceLinks) {
    bindFilters(sourceLinks || []);
    render(sourceLinks || []);
  }

  function bindFilters(sourceLinks) {
    var tabs = document.querySelectorAll('[data-source-category]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        activeCategory = tab.getAttribute('data-source-category') || 'all';
        tabs.forEach(function (item) { item.classList.remove('active'); });
        tab.classList.add('active');
        render(sourceLinks);
      });
    });
  }

  function render(sourceLinks) {
    var container = document.getElementById('source-link-list');
    if (!container) return;

    var filtered = filterByCategory(sourceLinks || [], activeCategory);
    if (filtered.length === 0) {
      container.innerHTML = '<div class="card"><div class="card-body">표시할 출처 링크가 없습니다.</div></div>';
      return;
    }

    container.innerHTML = filtered.map(renderCard).join('');
  }

  function filterByCategory(sourceLinks, category) {
    if (category === 'all') return sourceLinks;
    if (category === 'broker') {
      return sourceLinks.filter(function (item) {
        return item.category === 'broker' || item.type === 'broker_research' || item.type === 'broker_report';
      });
    }
    return sourceLinks.filter(function (item) { return item.category === category; });
  }

  function renderCard(item) {
    return [
      '<article class="card source-link-card">',
      '  <div class="card-header">',
      '    <h3 class="card-title">' + escapeHtml(item.name || item.title || item.id) + '</h3>',
      '    <span class="badge ' + priorityClass(item.priority) + '">' + escapeHtml(item.priority || 'candidate') + '</span>',
      '  </div>',
      '  <div class="card-body">',
      '    <p class="text-small text-muted">' + escapeHtml(typeLabel(item)) + '</p>',
      '    <p>' + escapeHtml(item.notes || '후보 출처입니다. 수동 검토 후 구조화 데이터로 승격하세요.') + '</p>',
      renderTags(item.tags),
      '    <a class="btn btn-secondary btn-sm" href="' + escapeAttr(safeExternalUrl(item.url)) + '" target="_blank" rel="noopener noreferrer">외부 링크 열기</a>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function renderTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return '';
    return '<p class="source-tags">' + tags.map(function (tag) {
      return '<span class="badge badge-neutral">' + escapeHtml(tag) + '</span>';
    }).join(' ') + '</p>';
  }

  function typeLabel(item) {
    var category = CATEGORY_LABELS[item.category] || item.category || '기타';
    return category + ' · ' + (item.type || 'source');
  }

  function priorityClass(priority) {
    if (priority === 'high') return 'badge-hit';
    if (priority === 'medium') return 'badge-pending';
    return 'badge-neutral';
  }

  function safeExternalUrl(value) {
    try {
      var url = new URL(String(value || ''), window.location.href);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.href;
      }
    } catch (err) {
      // Fall through to safe fallback.
    }
    return '#';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  SourceHub.list = {
    init: init,
    render: render
  };
})();
