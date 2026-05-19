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
    container.replaceChildren();

    var filtered = filterByCategory(sourceLinks || [], activeCategory);
    if (filtered.length === 0) {
      var card = document.createElement('div');
      card.className = 'card';
      var body = document.createElement('div');
      body.className = 'card-body';
      body.textContent = '표시할 출처 링크가 없습니다.';
      card.appendChild(body);
      container.appendChild(card);
      return;
    }

    filtered.forEach(function(item) { container.appendChild(renderCardElement(item)); });
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

  function renderCardElement(item) {
    var article = document.createElement('article');
    article.className = 'card source-link-card';

    var header = document.createElement('div');
    header.className = 'card-header';
    var h3 = document.createElement('h3');
    h3.className = 'card-title';
    h3.textContent = item.name || item.title || item.id || '';
    header.appendChild(h3);
    var badge = document.createElement('span');
    badge.className = 'badge ' + priorityClass(item.priority);
    badge.textContent = item.priority || 'candidate';
    header.appendChild(badge);
    article.appendChild(header);

    var body = document.createElement('div');
    body.className = 'card-body';
    var p1 = document.createElement('p');
    p1.className = 'text-small text-muted';
    p1.textContent = typeLabel(item);
    body.appendChild(p1);
    var p2 = document.createElement('p');
    p2.textContent = item.notes || '후보 출처입니다. 수동 검토 후 구조화 데이터로 승격하세요.';
    body.appendChild(p2);
    renderTagsElement(item.tags, body);

    var safeUrl = safeExternalUrl(item.url);
    var link = document.createElement('a');
    if (safeUrl) {
      link.href = safeUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'btn btn-secondary btn-sm';
      link.textContent = '외부 링크 열기';
    } else {
      link.className = 'btn btn-secondary btn-sm disabled';
      link.textContent = '비허용 URL';
      link.title = '안전하지 않은 URL입니다';
      link.setAttribute('aria-disabled', 'true');
    }
    body.appendChild(link);
    article.appendChild(body);

    return article;
  }

  function renderTagsElement(tags, container) {
    if (!Array.isArray(tags) || tags.length === 0) return;
    var p = document.createElement('p');
    p.className = 'source-tags';
    tags.forEach(function(tag) {
      var span = document.createElement('span');
      span.className = 'badge badge-neutral';
      span.textContent = tag;
      p.appendChild(span);
    });
    container.appendChild(p);
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
    return null;
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
