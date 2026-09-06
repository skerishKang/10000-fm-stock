#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadJSON(filePath) {
  const full = path.join(__dirname, '..', filePath);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function build() {
  console.log('[Builder] 시작: v1 평가 생성...');

  // 1. 정책 로드
  const policy = loadJSON('data/policy.json');
  const activeVersion = policy.active;

  // 2. 클레임 로드
  const claims = loadJSON('data/demo/claims.json');

  // 3. 기존 평가 로드 (v0 마이그레이션 전까지는 기존 데이터를 읽어 변환)
  const oldEvals = loadJSON('data/demo/evaluations.json');

  // 4. 새 평가 레코드 생성 (v1)
  const newEvaluations = oldEvals.map((evalItem, index) => {
    // 현재는 v0 데이터를 v1 스키마로 래핑만 함
    // 추후 실제 평가 로직(verdict 재계산 등)이 들어갈 자리
    return {
      ...evalItem,
      id: evalItem.id || `eval-v1-${String(index + 1).padStart(3, '0')}`,
      policyVersion: activeVersion,
      status: 'evaluated',
      marketDataBuildId: `build-${new Date().toISOString().slice(0,10)}-demo`,
      supersessionMetadata: null,
      evaluatedAt: new Date().toISOString(),
      evaluator: 'builder-v1'
    };
  });

  // 5. 결과 저장
  const outputPath = path.join(__dirname, '..', 'data/demo/evaluations-v1.tmp.json');
  fs.writeFileSync(outputPath, JSON.stringify(newEvaluations, null, 2));
  console.log(`[Builder] 완료: ${newEvaluations.length}개 평가 생성 (${outputPath})`);
}

build();
