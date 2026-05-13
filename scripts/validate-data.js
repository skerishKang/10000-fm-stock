#!/usr/bin/env node
/*
 * FM-Stock local JSON contract validator.
 *
 * Scope:
 * - Static MVP data only.
 * - Research workspace JSON templates.
 * - No network access.
 * - No external dependencies.
 * - Does not print raw source payloads.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

const DATASETS = {
  experts: 'experts.json',
  sources: 'sources.json',
  segments: 'segments.json',
  claims: 'claims.json',
  evaluations: 'evaluations.json',
  knowledgeNotes: 'knowledge_notes.json',
  sourceLinks: 'source-links.json',
  candidateSources: 'candidate-sources.sample.json'
};

const WORKSPACE_TEMPLATES = {
  candidateSourceTemplate: path.join('research-workspace', 'exports', 'candidate-sources.template.json'),
  claimCandidateTemplate: path.join('research-workspace', 'exports', 'claim-candidates.template.json'),
  knowledgeNoteCandidateTemplate: path.join('research-workspace', 'exports', 'knowledge-note-candidates.template.json')
};

const ENUMS = {
  expertType: new Set(['analyst', 'broadcast_guest', 'youtuber', 'investor', 'report_author', 'organization']),
  sourceType: new Set(['youtube', 'report', 'ir']),
  candidateSourceType: new Set([
    'youtube_video',
    'youtube_channel',
    'broker_research',
    'broker_report',
    'report_aggregator',
    'article',
    'broadcast',
    'other'
  ]),
  claimType: new Set(['stock_forecast', 'market_forecast', 'earnings_estimate', 'other']),
  direction: new Set(['bullish', 'bearish', 'neutral', 'educational_only']),
  claimStatus: new Set(['evaluated', 'invalid', 'candidate', 'pending']),
  evalResult: new Set(['hit', 'partial_hit', 'miss', 'invalid']),
  knowledgeLevel: new Set(['basic', 'intermediate', 'advanced'])
};

const state = {
  errors: [],
  warnings: []
};

function main() {
  const data = loadDatasets();
  const workspaceTemplates = loadWorkspaceTemplates();

  validateIdSet('experts', data.experts);
  validateIdSet('sources', data.sources);
  validateIdSet('segments', data.segments);
  validateIdSet('claims', data.claims);
  validateIdSet('evaluations', data.evaluations);
  validateIdSet('knowledgeNotes', data.knowledgeNotes);
  validateIdSet('sourceLinks', data.sourceLinks);
  validateIdSet('candidateSources', data.candidateSources);

  Object.entries(workspaceTemplates).forEach(([name, records]) => {
    validateIdSet(name, records);
    validateCandidateTemplateRecords(name, records);
  });

  const expertIds = toIdSet(data.experts);
  const sourceIds = toIdSet(data.sources);
  const segmentIds = toIdSet(data.segments);
  const claimIds = toIdSet(data.claims);

  validateExperts(data.experts);
  validateSources(data.sources);
  validateSegments(data.segments, sourceIds);
  validateClaims(data.claims, expertIds, sourceIds, segmentIds);
  validateEvaluations(data.evaluations, claimIds);
  validateClaimEvaluationConsistency(data.claims, data.evaluations);
  validateKnowledgeNotes(data.knowledgeNotes, expertIds, sourceIds, segmentIds);
  validateSourceLinks(data.sourceLinks);
  validateCandidateSources(data.candidateSources);

  printResult(data, workspaceTemplates);

  if (state.errors.length > 0) {
    process.exitCode = 1;
  }
}

function loadDatasets() {
  return Object.fromEntries(Object.entries(DATASETS).map(([name, filename]) => {
    return [name, loadJsonArray(name, path.join(DATA_DIR, filename), `data/${filename}`)];
  }));
}

function loadWorkspaceTemplates() {
  return Object.fromEntries(Object.entries(WORKSPACE_TEMPLATES).map(([name, relativePath]) => {
    return [name, loadJsonArray(name, path.join(ROOT, relativePath), relativePath)];
  }));
}

function loadJsonArray(datasetName, filePath, displayPath) {
  if (!fs.existsSync(filePath)) {
    fail(datasetName, '(file)', `missing file: ${displayPath}`);
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(parsed)) {
      fail(datasetName, '(root)', 'dataset must be a JSON array');
      return [];
    }
    return parsed;
  } catch (err) {
    fail(datasetName, '(parse)', `invalid JSON: ${err.message}`);
    return [];
  }
}

function validateIdSet(datasetName, items) {
  const seen = new Set();
  items.forEach((item, index) => {
    if (!isObject(item)) {
      fail(datasetName, `index:${index}`, 'item must be an object');
      return;
    }

    if (!nonEmptyString(item.id)) {
      fail(datasetName, `index:${index}`, 'missing non-empty id');
      return;
    }

    if (seen.has(item.id)) {
      fail(datasetName, item.id, 'duplicate id');
      return;
    }

    seen.add(item.id);
  });
}

function validateCandidateTemplateRecords(datasetName, records) {
  records.forEach((record) => {
    requireFields(datasetName, record, ['id', 'status', 'official']);

    if (record.status !== 'candidate') {
      fail(datasetName, record.id || '(unknown)', 'status must be candidate');
    }

    if (record.official !== false) {
      fail(datasetName, record.id || '(unknown)', 'official must be false');
    }

    if ('promotionReview' in record && !isObject(record.promotionReview)) {
      fail(datasetName, record.id || '(unknown)', 'promotionReview must be an object when present');
    }

    if ('sourceReference' in record && !isObject(record.sourceReference)) {
      fail(datasetName, record.id || '(unknown)', 'sourceReference must be an object when present');
    }
  });
}

function validateExperts(experts) {
  experts.forEach((expert) => {
    requireFields('experts', expert, ['id', 'name', 'displayName', 'type']);
    enumValue('experts', expert, 'type', ENUMS.expertType);
    arrayField('experts', expert, 'mainIndustries');
    arrayField('experts', expert, 'mainCompanies');
  });
}

function validateSources(sources) {
  sources.forEach((source) => {
    requireFields('sources', source, ['id', 'type', 'title', 'publisher', 'publishedAt']);
    enumValue('sources', source, 'type', ENUMS.sourceType);
    dateLike('sources', source, 'publishedAt');
  });
}

function validateSegments(segments, sourceIds) {
  segments.forEach((segment) => {
    requireFields('segments', segment, ['id', 'sourceId', 'title', 'summary']);
    refExists('segments', segment, 'sourceId', sourceIds, 'sources');
    nullableNumber('segments', segment, 'startTime');
    nullableNumber('segments', segment, 'endTime');
    nullableNumber('segments', segment, 'page');

    if (Number.isFinite(segment.startTime) && Number.isFinite(segment.endTime) && segment.endTime < segment.startTime) {
      fail('segments', segment.id, 'endTime must be greater than or equal to startTime');
    }
  });
}

function validateClaims(claims, expertIds, sourceIds, segmentIds) {
  claims.forEach((claim) => {
    requireFields('claims', claim, [
      'id',
      'expertId',
      'sourceId',
      'segmentId',
      'companyName',
      'claimType',
      'direction',
      'claimText',
      'baseDate',
      'targetDate',
      'status'
    ]);
    refExists('claims', claim, 'expertId', expertIds, 'experts');
    refExists('claims', claim, 'sourceId', sourceIds, 'sources');
    refExists('claims', claim, 'segmentId', segmentIds, 'segments');
    enumValue('claims', claim, 'claimType', ENUMS.claimType);
    enumValue('claims', claim, 'direction', ENUMS.direction);
    enumValue('claims', claim, 'status', ENUMS.claimStatus);
    arrayField('claims', claim, 'evidence');
    dateOnly('claims', claim, 'baseDate');
    dateOnly('claims', claim, 'targetDate');
    dateOrder('claims', claim, 'baseDate', 'targetDate');
    numberField('claims', claim, 'basePrice');
    numberField('claims', claim, 'targetPrice');
  });
}

function validateEvaluations(evaluations, claimIds) {
  evaluations.forEach((evaluation) => {
    requireFields('evaluations', evaluation, ['id', 'claimId', 'evaluatedAt', 'returnRate', 'alpha', 'result']);
    refExists('evaluations', evaluation, 'claimId', claimIds, 'claims');
    dateOnly('evaluations', evaluation, 'evaluatedAt');
    enumValue('evaluations', evaluation, 'result', ENUMS.evalResult);
    numberField('evaluations', evaluation, 'evaluatedPrice');
    numberField('evaluations', evaluation, 'returnRate');
    numberField('evaluations', evaluation, 'benchmarkReturn');
    numberField('evaluations', evaluation, 'alpha');
    optionalNumberField('evaluations', evaluation, 'maxPriceDuringPeriod');
    optionalNumberField('evaluations', evaluation, 'minPriceDuringPeriod');
  });
}

function validateClaimEvaluationConsistency(claims, evaluations) {
  const claimStatusById = new Map();
  const claimBaseDateById = new Map();
  claims.forEach((claim) => {
    if (nonEmptyString(claim.id)) {
      claimStatusById.set(claim.id, claim.status);
    }
    if (nonEmptyString(claim.id) && isDateOnlyString(claim.baseDate)) {
      claimBaseDateById.set(claim.id, claim.baseDate);
    }
  });

  const evaluationIdsByClaimId = new Map();
  evaluations.forEach((evaluation) => {
    if (!nonEmptyString(evaluation.claimId)) return;
    if (!evaluationIdsByClaimId.has(evaluation.claimId)) {
      evaluationIdsByClaimId.set(evaluation.claimId, []);
    }
    evaluationIdsByClaimId.get(evaluation.claimId).push(evaluation.id || '(unknown)');
  });

  evaluationIdsByClaimId.forEach((evaluationIds, claimId) => {
    if (evaluationIds.length > 1) {
      fail('evaluations', claimId, `multiple evaluations reference this claim: ${evaluationIds.join(', ')}`);
    }
  });

  claims.forEach((claim) => {
    if (!nonEmptyString(claim.id)) return;
    const evaluationCount = (evaluationIdsByClaimId.get(claim.id) || []).length;

    if (claim.status === 'evaluated' && evaluationCount === 0) {
      fail('claims', claim.id, 'status is evaluated but no evaluation record references this claim');
    }
  });

  evaluations.forEach((evaluation) => {
    if (!nonEmptyString(evaluation.claimId)) return;
    const claimStatus = claimStatusById.get(evaluation.claimId);

    if (claimStatus === 'invalid' && evaluation.result !== 'invalid') {
      warn('evaluations', evaluation.id || '(unknown)', `references invalid claim ${evaluation.claimId} but result is ${String(evaluation.result)}`);
    } else if (claimStatus && claimStatus !== 'evaluated' && claimStatus !== 'invalid') {
      warn('evaluations', evaluation.id || '(unknown)', `references claim ${evaluation.claimId} with non-evaluated status: ${claimStatus}`);
    }

    const claimBaseDate = claimBaseDateById.get(evaluation.claimId);
    if (claimBaseDate && isDateOnlyString(evaluation.evaluatedAt)) {
      if (String(evaluation.evaluatedAt) < String(claimBaseDate)) {
        fail('evaluations', evaluation.id || '(unknown)', `evaluatedAt must be greater than or equal to referenced claim baseDate (${claimBaseDate})`);
      }
    }
  });
}

function validateKnowledgeNotes(notes, expertIds, sourceIds, segmentIds) {
  notes.forEach((note) => {
    requireFields('knowledgeNotes', note, ['id', 'sourceId', 'segmentId', 'expertId', 'topic', 'level', 'summary']);
    refExists('knowledgeNotes', note, 'expertId', expertIds, 'experts');
    refExists('knowledgeNotes', note, 'sourceId', sourceIds, 'sources');
    refExists('knowledgeNotes', note, 'segmentId', segmentIds, 'segments');
    enumValue('knowledgeNotes', note, 'level', ENUMS.knowledgeLevel);
    arrayField('knowledgeNotes', note, 'keyPoints');
    arrayField('knowledgeNotes', note, 'tags');
  });
}

function validateSourceLinks(sourceLinks) {
  sourceLinks.forEach((link) => {
    requireFields('sourceLinks', link, ['id', 'type', 'name', 'url', 'category', 'priority']);
    arrayField('sourceLinks', link, 'tags');
  });
}

function validateCandidateSources(candidateSources) {
  candidateSources.forEach((source) => {
    requireFields('candidateSources', source, ['id', 'type', 'status', 'official']);
    enumValue('candidateSources', source, 'type', ENUMS.candidateSourceType);

    if (source.status !== 'candidate') {
      fail('candidateSources', source.id, 'status must be candidate');
    }

    if (source.official !== false) {
      fail('candidateSources', source.id, 'official must be false');
    }

    if (!nonEmptyString(source.url) && !nonEmptyString(source.privatePath)) {
      warn('candidateSources', source.id, 'candidate has neither url nor privatePath');
    }

    arrayField('candidateSources', source, 'relatedTickers');
    arrayField('candidateSources', source, 'relatedCompanies');
    arrayField('candidateSources', source, 'relatedIndustries');
    arrayField('candidateSources', source, 'reviewWarnings');
  });
}

function requireFields(dataset, item, fields) {
  fields.forEach((field) => {
    if (!(field in item)) {
      fail(dataset, item.id || '(unknown)', `missing field: ${field}`);
    }
  });
}

function refExists(dataset, item, field, validIds, targetName) {
  if (!nonEmptyString(item[field])) {
    fail(dataset, item.id || '(unknown)', `missing reference: ${field}`);
    return;
  }

  if (!validIds.has(item[field])) {
    fail(dataset, item.id || '(unknown)', `${field} references missing ${targetName} id: ${item[field]}`);
  }
}

function enumValue(dataset, item, field, allowed) {
  if (!allowed.has(item[field])) {
    fail(dataset, item.id || '(unknown)', `${field} has invalid value: ${String(item[field])}`);
  }
}

function arrayField(dataset, item, field) {
  if (!Array.isArray(item[field])) {
    fail(dataset, item.id || '(unknown)', `${field} must be an array`);
  }
}

function numberField(dataset, item, field) {
  if (!Number.isFinite(item[field])) {
    fail(dataset, item.id || '(unknown)', `${field} must be a finite number`);
  }
}

function optionalNumberField(dataset, item, field) {
  if (item[field] == null) return;
  numberField(dataset, item, field);
}

function nullableNumber(dataset, item, field) {
  if (item[field] == null) return;
  numberField(dataset, item, field);
}

function dateOnly(dataset, item, field) {
  if (!isDateOnlyString(item[field])) {
    fail(dataset, item.id || '(unknown)', `${field} must use YYYY-MM-DD`);
  }
}

function dateOrder(dataset, item, startField, endField) {
  if (!isDateOnlyString(item[startField]) || !isDateOnlyString(item[endField])) return;
  if (String(item[endField]) < String(item[startField])) {
    fail(dataset, item.id || '(unknown)', `${endField} must be greater than or equal to ${startField}`);
  }
}

function dateLike(dataset, item, field) {
  const value = String(item[field] || '');
  if (!/^\d{4}-\d{2}-\d{2}(T.*Z)?$/.test(value)) {
    fail(dataset, item.id || '(unknown)', `${field} must use YYYY-MM-DD or ISO UTC format`);
  }
}

function isDateOnlyString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function toIdSet(items) {
  return new Set(items.filter(isObject).map((item) => item.id).filter(nonEmptyString));
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fail(dataset, id, message) {
  state.errors.push({ dataset, id, message });
}

function warn(dataset, id, message) {
  state.warnings.push({ dataset, id, message });
}

function printResult(data, workspaceTemplates) {
  console.log('FM-Stock data validation');
  console.log('========================');
  Object.entries(DATASETS).forEach(([name, filename]) => {
    console.log(`- data/${filename}: ${data[name].length} records`);
  });

  console.log('\nWorkspace templates');
  console.log('-------------------');
  Object.entries(WORKSPACE_TEMPLATES).forEach(([name, relativePath]) => {
    console.log(`- ${relativePath}: ${workspaceTemplates[name].length} records`);
  });

  if (state.warnings.length > 0) {
    console.log('\nWarnings:');
    state.warnings.forEach((item) => {
      console.log(`- [${item.dataset}] ${item.id}: ${item.message}`);
    });
  }

  if (state.errors.length > 0) {
    console.error('\nValidation failed:');
    state.errors.forEach((item) => {
      console.error(`- [${item.dataset}] ${item.id}: ${item.message}`);
    });
    return;
  }

  console.log('\nValidation passed.');
}

main();
