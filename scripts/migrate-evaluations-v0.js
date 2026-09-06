#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8'));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(path.join(__dirname, '..', filePath), JSON.stringify(data, null, 2));
}

function migrate() {
  console.log('[Migration] v0 → v1 평가 마이그레이션 시작...');

  // 1. 기존 평가 로드 (v0)
  const oldEvals = loadJSON('data/demo/evaluations.json');
  // 2. v1 평가 로드 (PR 2/3에서 생성된 tmp 파일)
  const v1Evals = loadJSON('data/demo/evaluations-v1.tmp.json');

  // 3. v0 평가에 superseded 상태 부여
  const migratedV0 = oldEvals.map((item) => ({
    ...item,
    policyVersion: 'v0',
    status: 'superseded',
    marketDataBuildId: 'legacy',
    supersessionMetadata: {
      supersededBy: v1Evals.find(e => e.claimId === item.claimId)?.id || 'unknown',
      supersededAt: new Date().toISOString(),
      reason: '정책 업데이트: v1 도입'
    },
    evaluatedAt: item.evaluatedAt || '2026-09-06T00:00:00Z',
    evaluator: 'legacy-manual'
  }));

  // 4. 병합: v0(superseded) + v1(evaluated)
  const merged = [...migratedV0, ...v1Evals];

  // 5. 저장 (기존 evaluations.json 덮어쓰기)
  saveJSON('data/demo/evaluations.json', merged);
  console.log(`[Migration] 완료: 총 ${merged.length}개 평가 (v0: ${migratedV0.length}, v1: ${v1Evals.length})`);

  // 6. tmp 파일 정리 (선택)
  try {
    fs.unlinkSync(path.join(__dirname, '..', 'data/demo/evaluations-v1.tmp.json'));
    console.log('[Migration] 임시 파일 삭제 완료.');
  } catch (e) {
    console.warn('[Migration] 임시 파일 삭제 실패:', e.message);
  }
}

migrate();
