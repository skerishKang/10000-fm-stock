#!/usr/bin/env node
/*
 * intake-local-sources.js
 *
 * Serverless local intake helper for FM-Stock source candidates.
 * It reads a sibling local-only folder and writes candidate records outside
 * the GitHub repository.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..');
const LOCAL_ROOT = process.env.FM_STOCK_LOCAL_SOURCES || path.resolve(REPO_ROOT, '..', '10000-fm-stock-local-sources');
const INBOX_FILES = path.join(LOCAL_ROOT, 'inbox', 'files');
const LINKS_FILE = path.join(LOCAL_ROOT, 'inbox', 'links', 'links.txt');
const CANDIDATES_DIR = path.join(LOCAL_ROOT, 'candidates');
const LOGS_DIR = path.join(LOCAL_ROOT, 'logs');
const PROCESSED_DIR = path.join(LOCAL_ROOT, 'processed');
const OUTPUT_FILE = path.join(CANDIDATES_DIR, 'sources.candidate.json');
const LOG_FILE = path.join(LOGS_DIR, 'intake-log.jsonl');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function ensureLayout() {
  [INBOX_FILES, path.dirname(LINKS_FILE), CANDIDATES_DIR, LOGS_DIR, PROCESSED_DIR].forEach(ensureDir);
  if (!fs.existsSync(LINKS_FILE)) fs.writeFileSync(LINKS_FILE, '', 'utf8');
}

function moveToProcessed(sourcePath, type, candidateId, originalName) {
  const ext = path.extname(originalName);
  const baseName = slugify(originalName).replace(/_/g, '_');
  const targetDir = path.join(PROCESSED_DIR, type);
  ensureDir(targetDir);

  let targetName = `${candidateId}_${baseName}${ext}`;
  let targetPath = path.join(targetDir, targetName);
  let suffix = 1;
  while (fs.existsSync(targetPath)) {
    targetName = `${candidateId}_${baseName}_${++suffix}${ext}`;
    targetPath = path.join(targetDir, targetName);
  }

  try {
    fs.renameSync(sourcePath, targetPath);
  } catch (err) {
    if (err.code === 'EXDEV') {
      fs.copyFileSync(sourcePath, targetPath);
      fs.unlinkSync(sourcePath);
    } else {
      throw err;
    }
  }

  return path.relative(LOCAL_ROOT, targetPath).split(path.sep).join('/');
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function stableHash(input) {
  return crypto.createHash('sha1').update(String(input)).digest('hex').slice(0, 10);
}

function hashFile(filePath) {
  const hash = crypto.createHash('sha1');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9가-힣]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'untitled';
}

function classifyFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.pdf') return 'report';
  if (['.doc', '.docx', '.hwp', '.hwpx', '.txt', '.md'].includes(ext)) return 'document';
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) return 'image';
  return 'file';
}

function normalizeUrl(raw) {
  const match = String(raw || '').match(/https?:\/\/[^\s]+/i);
  if (!match) return null;
  try {
    const url = new URL(match[0]);
    url.hash = '';
    return url.toString();
  } catch (err) {
    return null;
  }
}

function classifyUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtube.com' || host === 'youtu.be' || host.endsWith('.youtube.com')) return 'youtube';
    return 'web';
  } catch (err) {
    return 'web';
  }
}

function makeId(ymd, seq) {
  return `source_${ymd}_${String(seq).padStart(3, '0')}`;
}

function readLinks() {
  if (!fs.existsSync(LINKS_FILE)) return [];
  const lines = fs.readFileSync(LINKS_FILE, 'utf8').split(/\r?\n/);
  const urls = [];
  const seen = new Set();
  lines.forEach((line) => {
    const url = normalizeUrl(line);
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push({ url, raw: line });
    }
  });
  return urls;
}

function readFiles() {
  if (!fs.existsSync(INBOX_FILES)) return [];
  return fs.readdirSync(INBOX_FILES, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const filePath = path.join(INBOX_FILES, entry.name);
      const stat = fs.statSync(filePath);
      return {
        name: entry.name,
        path: filePath,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        sha1: hashFile(filePath)
      };
    });
}

function loadExistingCandidates() {
  if (!fs.existsSync(OUTPUT_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

function extractDedupSets(candidates) {
  const fileSha1s = new Set();
  const urlHashes = new Set();
  const normalizedUrls = new Set();

  candidates.forEach((candidate) => {
    if (candidate.intake) {
      if (candidate.intake.fileSha1) fileSha1s.add(candidate.intake.fileSha1);
      if (candidate.intake.urlHash) urlHashes.add(candidate.intake.urlHash);
      if (candidate.intake.normalizedUrl) normalizedUrls.add(candidate.intake.normalizedUrl);
    }
  });

  return { fileSha1s, urlHashes, normalizedUrls };
}

function extractMaxSeq(candidates) {
  let maxSeq = 0;
  candidates.forEach((candidate) => {
    const match = String(candidate.id || '').match(/^source_\d{8}_(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxSeq) maxSeq = n;
    }
  });
  return maxSeq;
}

function buildNewCandidates(existingCandidates) {
  const ymd = todayYmd();
  const addedAt = new Date().toISOString();
  const newCandidates = [];
  const skipped = [];

  const dedup = extractDedupSets(existingCandidates);
  let seq = extractMaxSeq(existingCandidates) + 1;

  readFiles().forEach((file) => {
    if (dedup.fileSha1s.has(file.sha1)) {
      skipped.push({ kind: 'file', key: file.sha1, reason: 'duplicate fileSha1' });
      return;
    }
    dedup.fileSha1s.add(file.sha1);

    const type = classifyFile(file.name);
    const id = makeId(ymd, seq++);
    const processedPath = moveToProcessed(file.path, type, id, file.name);

    newCandidates.push({
      id,
      type,
      title: slugify(file.name).replace(/_/g, ' '),
      url: '',
      privatePath: processedPath,
      publisher: '',
      publishedAt: '',
      addedAt,
      visibility: 'private',
      memo: `Candidate generated from local file intake; sha1=${file.sha1}; size=${file.size}`,
      status: 'candidate',
      official: false,
      intake: {
        kind: 'file',
        originalFileName: file.name,
        fileSha1: file.sha1,
        fileSize: file.size,
        fileModifiedAt: file.mtime,
        processedPath
      }
    });
  });

  readLinks().forEach((link) => {
    const hash = stableHash(link.url);
    if (dedup.normalizedUrls.has(link.url) || dedup.urlHashes.has(hash)) {
      skipped.push({ kind: 'link', key: link.url, reason: 'duplicate normalizedUrl or urlHash' });
      return;
    }
    dedup.normalizedUrls.add(link.url);
    dedup.urlHashes.add(hash);

    const type = classifyUrl(link.url);
    newCandidates.push({
      id: makeId(ymd, seq++),
      type,
      title: `${type === 'youtube' ? 'YouTube' : 'Web'} source ${ymd} ${hash}`,
      url: link.url,
      privatePath: '',
      publisher: '',
      publishedAt: '',
      addedAt,
      visibility: 'public',
      memo: 'Candidate generated from local link intake',
      status: 'candidate',
      official: false,
      intake: {
        kind: 'link',
        normalizedUrl: link.url,
        urlHash: hash,
        rawLine: link.raw
      }
    });
  });

  return { newCandidates, skipped };
}

function appendLog(entry) {
  fs.appendFileSync(LOG_FILE, JSON.stringify(Object.assign({ timestamp: new Date().toISOString() }, entry)) + '\n', 'utf8');
}

function main() {
  ensureLayout();
  const existingCandidates = loadExistingCandidates();
  const { newCandidates, skipped } = buildNewCandidates(existingCandidates);
  const allCandidates = existingCandidates.concat(newCandidates);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allCandidates, null, 2) + '\n', 'utf8');

  skipped.forEach((item) => {
    appendLog({
      event: 'duplicate_skipped',
      kind: item.kind,
      key: item.key,
      reason: item.reason
    });
  });

  appendLog({
    event: 'intake_completed',
    localRoot: LOCAL_ROOT,
    outputFile: OUTPUT_FILE,
    totalCount: allCandidates.length,
    newCount: newCandidates.length,
    skippedCount: skipped.length
  });

  console.log('[intake] Local root:', LOCAL_ROOT);
  console.log('[intake] Total candidates:', allCandidates.length);
  console.log('[intake] New candidates:', newCandidates.length);
  console.log('[intake] Skipped duplicates:', skipped.length);
  console.log('[intake] Output:', OUTPUT_FILE);
  console.log('[intake] Log:', LOG_FILE);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('[intake] Failed:', err.message);
    process.exit(1);
  }
}
