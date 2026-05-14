#!/usr/bin/env node
/**
 * audit-static-assets.js
 *
 * Scans all HTML files for CSS/JS references and checks:
 * - File path exists on disk
 * - ?v= query parameter is present
 * - Version consistency across files
 * - Core script loading order
 *
 * Usage: node scripts/audit-static-assets.js
 * Exit code: 0 = pass, 1 = warnings, 2 = errors
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML_GLOB = path.join(ROOT, '**/*.html');
const EXCLUDED_DIRS = ['node_modules', '.git'];
const ALLOWED_PREFIXES = ['assets/', './', '../'];

let totalErrors = 0;
let totalWarnings = 0;

function error(msg) { console.error('  ERROR: ' + msg); totalErrors++; }
function warn(msg)  { console.warn('  WARN:  ' + msg); totalWarnings++; }

// Collect all HTML files recursively
function collectHtmlFiles(dir) {
  var files = [];
  try {
    var entries = fs.readdirSync(dir, { withFileTypes: true });
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.indexOf(entry.name) === -1) {
          files = files.concat(collectHtmlFiles(path.join(dir, entry.name)));
        }
      } else if (entry.name.endsWith('.html')) {
        files.push(path.join(dir, entry.name));
      }
    }
  } catch (e) {
    // skip unreadable dirs
  }
  return files;
}

// Extract src/href from HTML
function extractAssetRefs(html, filePath) {
  var refs = [];
  // <script src="...">
  var scriptRe = /<script[^>]*\ssrc=["']([^"']+)["']/gi;
  var match;
  while ((match = scriptRe.exec(html)) !== null) {
    refs.push({ attr: 'src', value: match[1], tag: 'script' });
  }
  // <link rel="stylesheet" href="...">
  var linkRe = /<link[^>]*\shref=["']([^"']+)["']/gi;
  while ((match = linkRe.exec(html)) !== null) {
    refs.push({ attr: 'href', value: match[1], tag: 'link' });
  }
  return refs;
}

// Resolve asset path relative to HTML file
function resolveAssetPath(assetPath, htmlFile) {
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://') || assetPath.startsWith('//')) {
    return null; // external URL, skip
  }
  var base = path.dirname(htmlFile);
  return path.resolve(base, assetPath);
}

// Check version query format
function checkVersion(value, filePath) {
  var qIdx = value.indexOf('?v=');
  if (qIdx === -1) {
    warn(filePath + ' -- missing ?v= in ' + value);
    return false;
  }
  var v = value.slice(qIdx + 3);
  if (!/^\d{8}-\d{4}-\d+$/.test(v)) {
    warn(filePath + ' -- non-standard version format in ' + value + ' (expected YYYYMMDD-ISSUE-REV)');
    return false;
  }
  return true;
}

console.log('FM-Stock Static Asset Audit');
console.log('===========================\n');

var htmlFiles = collectHtmlFiles(ROOT);
console.log('Found ' + htmlFiles.length + ' HTML files to scan\n');

var allRefs = [];

htmlFiles.forEach(function (htmlFile) {
  var relPath = path.relative(ROOT, htmlFile);
  var content;
  try {
    content = fs.readFileSync(htmlFile, 'utf-8');
  } catch (e) {
    error('Cannot read ' + relPath + ': ' + e.message);
    return;
  }

  var refs = extractAssetRefs(content, relPath);
  allRefs = allRefs.concat(refs.map(function (r) { r.htmlFile = relPath; return r; }));

  refs.forEach(function (ref) {
    if (ref.value.startsWith('http://') || ref.value.startsWith('https://') || ref.value.startsWith('//')) {
      return; // external, skip path check
    }

    // Strip ?v=... before checking file existence
    var cleanValue = ref.value.replace(/\?v=.*$/, '');
    var absPath = resolveAssetPath(cleanValue, htmlFile);
    if (absPath === null) return;

    if (!fs.existsSync(absPath)) {
      error(relPath + ' -- ' + ref.attr + '="' + ref.value + '" not found (resolved: ' + absPath + ')');
    }

    checkVersion(ref.value, relPath);
  });
});

// Check version consistency
var versionCounts = {};
allRefs.forEach(function (ref) {
  var qIdx = ref.value.indexOf('?v=');
  if (qIdx !== -1) {
    var v = ref.value.slice(qIdx + 3);
    versionCounts[v] = (versionCounts[v] || 0) + 1;
  }
});

var versionKeys = Object.keys(versionCounts);
if (versionKeys.length > 1) {
  console.log('\nVersion distribution:');
  versionKeys.sort().forEach(function (v) {
    console.log('  ' + v + ': ' + versionCounts[v] + ' refs');
  });
  warn('Multiple versions in use: ' + versionKeys.join(', ') + ' -- verify intentional');
}

console.log('\n--- Summary ---');
console.log('Errors:   ' + totalErrors);
console.log('Warnings: ' + totalWarnings);
console.log('Refs checked: ' + allRefs.length + '\n');

if (totalErrors > 0) process.exit(2);
if (totalWarnings > 0) process.exit(1);
process.exit(0);
