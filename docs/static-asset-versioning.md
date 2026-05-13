# Static Asset Versioning Policy

## Purpose

This project is a static HTML/CSS/Vanilla JS/JSON MVP. Because the app does not currently use a build pipeline, template compiler, runtime server, or service worker cache strategy, CSS and JavaScript cache busting is handled with explicit manual version query tags on entry assets loaded by HTML.

This policy prevents inconsistent cache-busting patterns such as arbitrary `?v=1` additions, repository-wide query churn, or deployment-level cache changes inside unrelated feature or fix PRs.

## Required format

Use this format for version query tags:

```text
?v=YYYYMMDD-ISSUE-REV
```

Example:

```html
<script src="../assets/js/source-hub/source-hub-main.js?v=20260513-0063-1"></script>
<link rel="stylesheet" href="../assets/css/source-hub.css?v=20260513-0063-1">
```

Where:

- `YYYYMMDD` is the date of the relevant PR or change.
- `ISSUE` is the related GitHub issue number.
- `REV` is the revision number for repeated bumps under the same issue and date.

## Rules

1. If a modified CSS or JavaScript file is directly loaded by an HTML page, bump that file's query version in the relevant HTML file.
2. If a modified lower-level file is imported, required, or otherwise loaded through an entry CSS/JS asset, bump only the upper entry asset that the HTML loads.
3. Do not add arbitrary numeric versions such as `?v=1`.
4. Do not perform repository-wide version query changes.
5. Do not bump unrelated assets.
6. Do not introduce automatic timestamp cache busting in ordinary feature or fix PRs.
7. Do not add or modify `_headers`, service worker logic, or broader `Cache-Control` strategy inside ordinary feature or fix PRs.
8. Handle Cloudflare Pages cache policy as a separate operations issue if needed.
9. Keep path rules separate from cache busting. Root-relative paths such as `/pages/...` remain prohibited because GitHub Pages repository-subpath deployment can break.
10. Version query changes must be small, reviewable, and tied to the asset actually affected by the PR.

## Direct entry asset rule

An entry asset is a CSS or JavaScript file that an HTML page loads directly with `<link>` or `<script>`.

Examples:

```html
<link rel="stylesheet" href="../assets/css/css-components.css?v=20260513-0064-1">
<script src="../assets/js/claims/claims-main.js?v=20260513-0064-1"></script>
```

If the PR changes one of these directly loaded files, bump that asset's query string in the affected HTML page.

If the PR changes a file that is not directly loaded by HTML but is loaded through an entry file, bump the entry file reference instead of unrelated files.

## Good examples

Only `assets/js/source-hub/source-hub-main.js` changed, and `pages/source-hub.html` loads it directly:

```html
<script src="../assets/js/source-hub/source-hub-main.js?v=20260513-0063-1"></script>
```

Only a shared component stylesheet changed and multiple pages load it directly. In that case, either:

- bump the direct references in the pages affected by the change, or
- bump all direct references to that shared stylesheet if the change must invalidate all pages using it.

The PR description should explain which choice was made.

## Bad examples

Do not add arbitrary numeric versions:

```html
<script src="../assets/js/source-hub/source-hub-main.js?v=1"></script>
```

Do not add a query string to every CSS/JS file in the repository without relation to the current PR.

Do not mix service worker cache invalidation into a feature PR that only changes a page renderer.

Do not use root-relative paths while adding version tags:

```html
<script src="/pages/source-hub.html?v=20260513-0063-1"></script>
```

## PR checklist

When a PR modifies CSS or JavaScript, check the following before review:

- [ ] Did the PR modify a CSS/JS file directly loaded by HTML?
- [ ] If yes, did the relevant HTML reference get a scoped `?v=YYYYMMDD-ISSUE-REV` bump?
- [ ] If a lower-level file changed, was the correct HTML-loaded entry asset bumped instead?
- [ ] Did the PR avoid arbitrary `?v=1` values?
- [ ] Did the PR avoid repository-wide query churn?
- [ ] Did the PR avoid unrelated `_headers`, service worker, or Cloudflare cache policy changes?
- [ ] Did the PR avoid root-relative `/pages/...` paths?

## Deployment cache policy

This policy covers only manual asset query tags in the static MVP.

The following topics are separate operations work and must not be mixed into normal page, data, or renderer PRs:

- Cloudflare Pages `_headers`
- service worker cache versioning
- browser cache-control strategy
- build-time automatic timestamp injection
- asset fingerprinting or hashed filenames

If those become necessary, create a separate operations issue and design them as deployment policy, not as incidental feature work.

## Current decision

For the current MVP, the operating standard is:

```text
manual version query tag + changed entry asset only
```

This keeps cache behavior explicit, PR diffs small, and regressions traceable to the actual changed asset.
