# Dataset Mode 운영 가이드

> Refs: #236

## 1. 모드 분류

| 모드 | 의미 | 용도 | UI 배너 |
|------|------|------|---------|
| `demo` | 가명·예시 데이터 | MVP 화면 검증, README/문서 데모 | 노란색, "데모 데이터" |
| `research` | 실제 수집/연구 진행 중 | FMIndex 라벨·벤치마크·집계 | 파란색, "리서치" |
| `production` | human-approved 운영 데이터 | 공개 랭킹·검증 결과 게시 | 숨김 |

## 2. 디렉터리 구조

```
data/
├── _meta.json           # 모드 + 승인 + 해시
├── demo/                # 현재 활성
├── research/            # (현재 비어있음)
└── production/          # (현재 비어있음)
```

디렉터리 이름 = 모드. 같은 PR에 두 모드 데이터를 섞지 마세요.

## 3. 모드 전환 절차

### demo → research
1. `data/research/`에 데이터 파일 추가
2. `data/_meta.json`의 `mode`를 `research`로 변경
3. `datasetHash` 재계산
4. PR 리뷰 + 머지

### research → production
위 + 아래:
5. `productionApproval` 객체 채우기:
   - `approvedBy`: GitHub 사용자명
   - `approvedAt`: ISO8601 시각
   - `commitSha`: 머지 커밋 SHA
   - `covers`: 포함된 데이터셋 배열
   - `reviewedChecks`: 통과한 CI 검사 이름 배열
6. CI가 `productionApproval` 누락 시 fail
7. main 머지 후 자동 배포 시에만 production 모드 활성화

### production → demo (롤백)
- 즉시 `data/_meta.json`의 `mode`를 `demo`로 되돌림
- incident log 작성 (PR 코멘트 또는 issue)

## 4. 금지 사항
- `production` 빌드에 demo 데이터가 빌드 경로에 포함되는 것
- `productionApproval` 없는 production 머지
- 자동화된 데이터 승격 (human review 없이)
- 다른 모드 디렉터리를 가리키는 링크/참조

## 5. 검증
```bash
node scripts/validate-data.js
python -m http.server 8000
# 브라우저에서 http://localhost:8000/ — 상단 배너 확인
```
