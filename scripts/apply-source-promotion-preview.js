#!/usr/bin/env node
/*
 * apply-source-promotion-preview.js
 *
 * Safely apply eligible records from local source promotion preview to
 * the official data/sources.json file.
 * Defaults to dry-run; use --apply to actually modify the file.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const OFFICIAL_SOURCES_FILE = path.join(REPO_ROOT, 'data', 'sources.json');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const PREVIEW_FILE = path.join(LOCAL_ROOT, 'promotions', 'source-promotions.preview.json');

const VALID_OFFICIAL_TYPES = ['youtube', 'report', 'ir'];

function isIsoDate(value) {
  if (!value) return false;
  // Support YYYY-MM-DD or ISO UTC
  return /^\d{4}-\d{2}-\d{2}(T|$)/.test(String(value));
}

function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');

  console.log('FM-Stock source promotion preview applier');
  console.log('=========================================');
  console.log(`Mode: ${isApply ? 'APPLY' : 'DRY-RUN'}`);
  if (!isApply) {
    console.log('(Use --apply to commit changes to data/sources.json)');
  }
  console.log('');

  if (!fs.existsSync(PREVIEW_FILE)) {
    console.log('Preview file not found:', PREVIEW_FILE);
    process.exit(0);
  }

  if (!fs.existsSync(OFFICIAL_SOURCES_FILE)) {
    console.error('Error: Official sources file not found:', OFFICIAL_SOURCES_FILE);
    process.exit(1);
  }

  let officialSources;
  try {
    officialSources = JSON.parse(fs.readFileSync(OFFICIAL_SOURCES_FILE, 'utf8'));
  } catch (err) {
    console.error('Error: Failed to parse official sources file:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(officialSources)) {
    console.error('Error: Official sources file root is not an array.');
    process.exit(1);
  }

  let previewRecords;
  try {
    previewRecords = JSON.parse(fs.readFileSync(PREVIEW_FILE, 'utf8'));
  } catch (err) {
    console.error('Error: Failed to parse preview file:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(previewRecords)) {
    console.error('Error: Preview file root is not an array.');
    process.exit(1);
  }

  const officialIds = new Set(officialSources.map((s) => s.id));
  const previewIds = new Set();
  const eligibleRecords = [];
  const skipped = [];

  previewRecords.forEach((record) => {
    const skip = (reason) => skipped.push({ id: (record && record.id) || '(no id)', reason });

    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      skip('preview record is not an object');
      return;
    }

    if (!record.id) {
      skip('missing id');
      return;
    }

    if (previewIds.has(record.id)) {
      console.error(`Error: Duplicate ID inside preview file: ${record.id}`);
      process.exit(1);
    }
    previewIds.add(record.id);

    if (officialIds.has(record.id)) {
      skip('id already exists in official sources');
      return;
    }

    if (!VALID_OFFICIAL_TYPES.includes(record.type)) {
      skip(`invalid type: ${record.type || '(empty)'}`);
      return;
    }

    if (!record.title) {
      skip('missing title');
      return;
    }

    if (!record.publisher) {
      skip('missing publisher');
      return;
    }

    if (!isIsoDate(record.publishedAt)) {
      skip(`missing or invalid publishedAt: ${record.publishedAt || '(empty)'}`);
      return;
    }

    const hasUrl = !!(record.url && record.url.trim());
    const hasPath = !!(record.privatePath && record.privatePath.trim());
    if (!hasUrl && !hasPath) {
      skip('missing both url and privatePath');
      return;
    }

    eligibleRecords.push(record);
  });

  console.log('Official sources count before:', officialSources.length);
  console.log('Preview records total:', previewRecords.length);
  console.log('Eligible records count:', eligibleRecords.length);
  console.log('Skipped count:', skipped.length);

  if (skipped.length > 0) {
    console.log('');
    console.log('Skipped reasons:');
    skipped.forEach((s) => console.log(`- ${s.id}: ${s.reason}`));
  }

  if (eligibleRecords.length > 0) {
    if (isApply) {
      // Preserve original file content for byte-for-byte rollback
      const originalContent = fs.readFileSync(OFFICIAL_SOURCES_FILE, 'utf8');

      const updatedSources = officialSources.concat(eligibleRecords);
      fs.writeFileSync(OFFICIAL_SOURCES_FILE, JSON.stringify(updatedSources, null, 2) + '\n', 'utf8');
      console.log('');
      console.log('Applied changes to:', OFFICIAL_SOURCES_FILE);
      console.log('Official sources count after:', updatedSources.length);

      // Run validation
      console.log('');
      console.log('Running validation...');
      const result = spawnSync('node', ['scripts/validate-data.js'], {
        cwd: REPO_ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8'
      });

      if (result.stdout) console.log(result.stdout);
      if (result.stderr) console.error(result.stderr);

      if (result.status === 0) {
        console.log('Validation PASSED. Changes retained.');
        process.exit(0);
      } else {
        // Rollback
        console.error('Validation FAILED. Rolling back...');
        fs.writeFileSync(OFFICIAL_SOURCES_FILE, originalContent, 'utf8');
        console.error('Rollback complete. data/sources.json restored to original state.');
        process.exit(1);
      }
    } else {
      console.log('');
      console.log('Dry-run complete. No changes made to official sources.');
    }
  } else {
    console.log('');
    console.log('No eligible records to apply.');
  }

  process.exit(0);
}

main();
