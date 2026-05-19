# DOM Safety Policy

## Core Rules

1. **Use `textContent` for plain text** from JSON, source, claim, segment, knowledge note, or user-entered draft values.
2. **Use `innerHTML` / `insertAdjacentHTML` only for:**
   - Fixed templates (no data-derived content)
   - Already escaped content (via `escapeHtml()` or equivalent)
3. **Source-derived strings must be routed through an escape helper** before HTML insertion.
4. **Prefer DOM creation helpers** for mixed markup + text.

## Classification

| Category | Risk | Action |
|----------|------|--------|
| Fixed template only | Low | Allowed, add comment |
| `escapeHtml()` applied | Medium | Allowed, verify escape is correct |
| Data-derived raw string in `innerHTML` | High | Must escape or use `textContent` |

## Audit Results (2026-05-19)

### High-Risk Sites (data-derived raw HTML insertion)

The following sites insert data-derived strings directly into HTML without escaping:

- `claims-list.js` — speaker, ticker, industry names in filter options
- `experts-list.js` — expert names in list cards
- `experts-render.js` — expert names, claim titles, sector names
- `source-hub-list.js` — source link names
- `sources-list.js` — source names
- `knowledge-list.js` — knowledge note titles

**Note:** These are curated JSON data files, not user input. Risk is lower than user-generated content but still present if data files are compromised.

### Fixed Sites (PR #168)

- `review-claims.js` — converted to DOM creation
- `review-knowledge.js` — converted to DOM creation

Remaining non-review rendering sites are tracked separately in #169.

### Allowed Sites (fixed template or escaped)

- `app-main.js` — boot error with `escapeHtml()`
- `data-loader.js` — boot error with `escapeHtml()`
- `dashboard-render.js` — `escapeHtml()` used for trending stocks/sectors
- Fixed error messages — no data content

## Recommendations

1. For new code, always use `textContent` for data-derived strings.
2. For existing code, prioritize escaping in `claims-list.js` and `experts-render.js`.
3. Consider adding a centralized `renderSafeHTML(template, data)` helper for future use.
4. Remaining non-review rendering sites are tracked separately in #169.
