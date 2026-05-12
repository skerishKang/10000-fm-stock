# 대시보드 화면 설계

> **목적**: 전체 데이터 현황 — 소스, 발언, 검증, 지식 흐름을 한눈에 파악할 수 있는 대시보드
>
> **관련 이슈**: #9
>
> **작성일**: 2026-05-12

---

## 1. 개요

대시보드는 FM-Stock 시스템의 **진입점이자 컨트롤 타워** 역할을 한다.
Ingest/Review 단계를 거쳐 쌓인 데이터가 실시간으로 반영되며,
사용자는 대시보드에서 전체 현황을 조회한 후 각 도메인(소스, 발언, 검증, 지식)으로
네비게이션할 수 있다.

### 1.1 주요 기능 요약

| 기능 | 설명 |
|------|------|
| 핵심 요약 카드 | 시스템 전반의 주요 지표를 숫자로 요약 |
| 최근 검증 완료 발언 | 가장 최근에 검증이 완료된 발언 목록 |
| 수익률 상위 발언 | 수익률 기준 상위 발언 (초과수익률 함께 표시) |
| 전문가 랭킹 요약 | 검증 5건 이상 기준: 평균 초과수익률/적중률/지식 기여 상위 |
| 많이 언급된 종목/산업 | 최근 트렌드 파악을 위한 토픽 클라우드 |
| 지식 노트 피드 | 최근 생성된 Knowledge Note 실시간 스트림 |

### 1.2 사용자 흐름

1. 대시보드 진입 → 핵심 요약 카드로 전체 현황 파악
2. 최근 검증 완료 발언 스캔 → 관심 발언 클릭하여 상세 확인
3. 수익률 상위 발언 탐색 → 고수익 패턴 분석
4. 전문가 랭킹 확인 → 신뢰할 수 있는 발언자 식별
5. 많이 언급된 종목/산업 확인 → 시장 트렌드 파악
6. 지식 노트 피드 스크롤 → 최신 인사이트 습득

---

## 2. 핵심 요약 카드 (Summary Cards)

### 2.1 UI 배치

> 상단에 가로 스크롤 또는 그리드 형태로 배치 (반응형: 4열 → 2열 → 1열)

### 2.2 카드 목록

| 카드명 | 데이터 소스 | 설명 |
|--------|-----------|------|
| 전체 소스 수 | Source 테이블 | 등록된 전체 정보 소스 개수 |
| Segment 수 | Segment 테이블 | 수집된 전체 segment 개수 |
| Claim 수 | Claim 테이블 | 추출된 전체 claim 개수 |
| 검증 완료 Claim | Claim (status=verified) | 검증이 완료된 claim 수 |
| Pending Claim | Claim (status=pending) | 아직 검증되지 않은 claim 수 |
| Knowledge Note 수 | KnowledgeNote 테이블 | 생성된 전체 지식 노트 수 |
| 평균 수익률 | Claim | 검증 완료 claim의 평균 수익률 |
| 평균 초과수익률 | Claim | 검증 완료 claim의 평균 초과수익률 |
| 평균 적중률 | Claim | 검증 완료 claim의 평균 적중률 (hit/miss) |

### 2.3 상태 표시

- **Pending Claim** 수가 0보다 크면 주황색 뱃지 표시
- **검증 완료율** (= 검증 완료 / 전체 Claim) 프로그레스 바로 표시
- 전일 대비 증감 화살표 (▲ 증가 / ▼ 감소)

### 2.4 API 연동

```
GET /api/dashboard/summary
Response: {
  totalSources, totalSegments, totalClaims,
  verifiedClaims, pendingClaims, totalKnowledgeNotes,
  avgReturn, avgExcessReturn, avgHitRate
}
```

---

## 3. 최근 검증 완료 발언 (Recent Verified Claims)

### 3.1 목록 표시

| 컬럼 | 설명 |
|------|------|
| 발언자 | Speaker 이름 (링크: Speaker 상세) |
| 종목 | Stock 티커 + 이름 |
| 산업 | Industry 분류 |
| 발언일 | 원본 발언 날짜 |
| 검증일 | 검증 완료 날짜 |
| 수익률 | 실제 수익률 (%)
| 초과수익률 | 벤치마크 대비 초과 수익률 (%) |
| 판정 | hit / miss / neutral (색상 구분) |
| 출처 링크 | 원본 발언 출처 URL |

### 3.2 필터/정렬

- 기본 정렬: 검증일 기준 내림차순 (최신순)
- 필터: 판정(hit/miss/neutral/all), 산업, 종목, 발언자
- 페이지네이션: 20개씩

### 3.3 UX 상세

- **판정 뱃지**: hit=초록, miss=빨강, neutral=회색
- **행 클릭**: 해당 Claim 상세 페이지로 이동
- **출처 링크**: 새 탭에서 열기
- **hover 시**: 발언 원문 미리보기 (tooltip)

### 3.4 API 연동

```
GET /api/dashboard/recent-verified?limit=20&offset=0&verdict=&industry=&stock=&speaker=
Response: { items: [...], total: number, hasMore: boolean }
```

---

## 4. 수익률 상위 발언 (Top Returns)

### 4.1 UI 배치

> 우측 상단 영역, 작은 테이블 또는 리스트 카드 형태

### 4.2 표시 항목

| 순위 | 발언자 | 종목 | 판정 | 수익률 | 초과수익률 | 발언일 | 출처 |
|------|--------|------|------|--------|-----------|--------|------|
| 1 | ... | ... | hit | +45.2% | +32.1% | 2026-04-01 | ... |
| 2 | ... | ... | hit | +38.7% | +25.3% | 2026-03-28 | ... |
| ... | ... | ... | ... | ... | ... | ... | ... |

### 4.3 조건

- 검증 완료된 claim만 대상
- 수익률 기준 내림차순 TOP 10
- 초과수익률은 참고 정보로 함께 표시
- 동일 순위는 초과수익률 순으로 재정렬

### 4.4 시각화

- **수익률 막대**: 진행형 막대로 수익률 시각화 (양수=초록, 음수=빨강)
- **순위 변화**: 전주 대비 순위 변동 화살표 (▲▼)

### 4.5 API 연동

```
GET /api/dashboard/top-returns?limit=10
Response: { items: [{ rank, speaker, stock, verdict, return,
                      excessReturn, claimDate, sourceUrl }] }
```

---

## 5. 전문가 랭킹 요약 (Expert Rankings)

### 5.1 조건

- **최소 검증 수**: 5개 이상의 검증 완료 claim 보유
- 최소 기준 미달 시 "데이터 부족" 메시지 표시

### 5.2 랭킹 카테고리

#### 5.2.1 평균 초과수익률 상위 (Top by Avg Excess Return)

| 순위 | 발언자 | 평균 초과수익률 | 검증 수 | 평균 수익률 |
|------|--------|----------------|---------|------------|
| 1 | 김OO | +18.3% | 12 | +22.1% |
| 2 | 박OO | +15.7% | 8 | +19.5% |

#### 5.2.2 적중률 상위 (Top by Hit Rate)

| 순위 | 발언자 | 적중률 | 검증 수 | hit/miss |
|------|--------|--------|---------|----------|
| 1 | 이OO | 85.7% | 7 | 6/1 |
| 2 | 최OO | 83.3% | 6 | 5/1 |

#### 5.2.3 지식 기여 수 상위 (Top by Knowledge Contribution)

| 순위 | 발언자 | 생성 Knowledge Note 수 | 고유 종목 수 |
|------|--------|----------------------|-------------|
| 1 | 정OO | 34 | 12 |
| 2 | 한OO | 28 | 9 |

### 5.3 UX 상세

- 3개의 탭 또는 세로 분할 영역으로 표시
- 각 랭킹별로 최대 5위까지 표시
- 발언자 이름 클릭 → Speaker 상세 페이지
- 검증 수가 5개 미만인 발언자는 "데이터 부족 (N건)"으로 표시

### 5.4 API 연동

```
GET /api/dashboard/expert-rankings
Response: {
  topExcessReturn: [{ speaker, avgExcessReturn, verifiedCount, avgReturn }],
  topHitRate: [{ speaker, hitRate, verifiedCount, hits, misses }],
  topKnowledgeContributors: [{ speaker, knowledgeNoteCount, uniqueStocks }]
}
```

---

## 6. 많이 언급된 종목/산업 (Trending Topics)

### 6.1 종목 TOP 10

| 순위 | 종목 (티커) | 언급 횟수 | 최근 추가 |
|------|------------|-----------|----------|
| 1 | AAPL (Apple) | 47 | 2026-05-11 |
| 2 | TSLA (Tesla) | 42 | 2026-05-12 |
| 3 | NVDA (NVIDIA) | 38 | 2026-05-12 |
| ... | ... | ... | ... |

### 6.2 산업 TOP 10

| 순위 | 산업 | 언급 횟수 | 최근 추가 |
|------|------|-----------|----------|
| 1 | 반도체 | 89 | 2026-05-12 |
| 2 | 전기차 | 67 | 2026-05-11 |
| 3 | AI/ML | 55 | 2026-05-12 |
| ... | ... | ... | ... |

### 6.3 시각화

- **워드 클라우드** 또는 **버블 차트**로 시각화 옵션 제공
- 언급 횟수에 따라 폰트 크기/버블 크기 차등
- 최근 7일 이내 추가된 항목은 "NEW" 뱃지 표시

### 6.4 API 연동

```
GET /api/dashboard/trending?period=7d&limit=10
Response: {
  stocks: [{ ticker, name, mentionCount, lastMentioned }],
  industries: [{ industry, mentionCount, lastMentioned }]
}
```

---

## 7. 지식 노트 피드 (Knowledge Note Feed)

### 7.1 위치

> 대시보드 최하단, 전체 폭으로 배치

### 7.2 표시 항목

| 항목 | 설명 |
|------|------|
| 산업 | Knowledge Note의 산업 분류 |
| 종목 | 관련 종목 (있는 경우) |
| 주제 | Knowledge Note 제목/주제 |
| 요약 | 내용 요약 (2줄 이내) |
| 출처 | 기반이 된 Source 링크 |
| 발언자 | Knowledge Note 생성에 기여한 발언자 |
| 태그 | 관련 태그 목록 (해시태그 형태) |
| 생성일 | Knowledge Note 생성 일시 |

### 7.3 UX 상세

- **시간순 피드**: 최신순으로 무한 스크롤
- **고정 너비 카드**: 각 Knowledge Note를 하나의 카드로 표시
- **태그 색상**: 산업별 태그 색상 구분 (반도체=파랑, 전기차=초록, AI=보라)
- **요약 확장**: "더보기" 버튼으로 전체 내용 확인
- **북마크**: 별표 아이콘으로 북마크 (개인화 기능, MVP 이후)

### 7.4 UI 예시

```
┌─────────────────────────────────────────────────────┐
│ 📘 2026-05-12 14:32                                 │
│ 반도체 · NVDA                                       │
│                                                      │
│ [H100 수요 전망] 2026년 H100出货량 전년 대비 2배↑   │
│ H100의 공급 제약이 해소되면서 2026년 하반기...       │
│                                                      │
│ 출처: NVDA_earnings_call_2026Q1.mp4 · 발언자: 젠슨황 │
│ #H100 #수요전망 #데이터센터                           │
└─────────────────────────────────────────────────────┘
```

### 7.5 API 연동

```
GET /api/dashboard/knowledge-feed?limit=20&offset=0&industry=&tag=
Response: { items: [...], total: number, hasMore: boolean }
```

---

## 8. 데이터 흐름 아키텍처

### 8.1 데이터 파이프라인

```
Source (유튜브/PDF/블로그)
  │
  ▼
[Ingest] → Segment 생성
  │
  ▼
[Extract] → Claim 추출
  │
  ▼
[Review] → Claim 검증 (hit/miss/neutral)
  │
  ▼
[Knowledge] → Knowledge Note 생성
  │
  ▼
[Dashboard] → 집계/캐싱 → API 응답
```

### 8.2 데이터 집계 전략

- **실시간성**: 주요 카드 수치 (소스/segment/claim 수 등)는 DB 직접 조회
- **캐싱**: 수익률 랭킹, 전문가 랭킹은 5분 TTL 캐시 (Redis)
- **트리거**: Knowledge Note 생성 시 대시보드 피드 이벤트 발생 (WebSocket)
- **배치**: 일간/주간 통계는 별도 배치 작업으로 사전 집계

### 8.3 성능 고려사항

- 핵심 요약 카드는 단일 API 호출로 모든 카드 데이터 반환
- 목록형 API는 서버사이드 페이지네이션 (limit/offset)
- 인덱스: claim.verified_at, claim.return, knowledge_note.created_at
- WebSocket 연결 관리: 최대 1000 동시 연결, 1시간 타임아웃

---

## 9. 반응형 디자인

### 9.1 데스크탑 (≥1024px)

- 3열 레이아웃: 좌측 최근 검증 (50%) | 우측 상단 Top Returns (25%) | 우측 하단 랭킹 (25%)
- 지식 노트 피드는 하단 전체 폭

### 9.2 태블릿 (768px ~ 1023px)

- 2열 레이아웃
- 요약 카드는 2x2 그리드
- Top Returns와 랭킹은 탭 전환

### 9.3 모바일 (<768px)

- 1열 레이아웃
- 요약 카드는 가로 스크롤
- 모든 섹션 세로 배치
- 햄버거 메뉴로 네비게이션 대체

---

## 10. 향후 개선 사항 (Post-MVP)

| 항목 | 우선순위 | 설명 |
|------|----------|------|
| WebSocket 실시간 업데이트 | High | 새 검증/지식 노트 발생 시 자동 갱신 |
| 사용자 맞춤 대시보드 | Medium | 관심 종목/발언자 필터링 저장 |
| 시계열 차트 | Medium | 일별/주별 검증 추이 그래프 |
| PDF/엑셀 내보내기 | Low | 대시보드 데이터 다운로드 |
| 알림 설정 | Low | 특정 조건 (新 검증, 랭킹 변동) 알림 |
| 다크 모드 | Medium | 시스템 설정 기반 테마 전환 |

---

## 11. 기술 스택

| 계층 | 기술 |
|------|------|
| 프론트엔드 | React + TypeScript + Tailwind CSS |
| 상태 관리 | React Query (서버 상태), Zustand (로컬 상태) |
| 차트 | Recharts (막대/버블 차트) |
| API | REST (JSON) |
| WebSocket | Socket.IO (실시간 피드) |
| CSS 방법론 | Tailwind CSS utility-first |
| 반응형 | Tailwind breakpoints (sm/md/lg/xl) |

---

## 12. 페이지 라우팅

| 경로 | 설명 |
|------|------|
| `/` 또는 `/dashboard` | 대시보드 메인 |
| `/sources` | 소스 관리 페이지 |
| `/claims` | 발언/Claim 목록 |
| `/claims/:id` | Claim 상세 |
| `/knowledge` | Knowledge Note 목록 |
| `/knowledge/:id` | Knowledge Note 상세 |
| `/speakers` | 발언자 목록 |
| `/speakers/:id` | 발언자 상세 (랭킹 포함) |

---

## 13. 메타 정보

- **작성자**: Hermes Agent (자동 생성)
- **버전**: v0.1 (초안)
- **상태**: 검토 필요
- **관련 파일**:
  - `frontend/src/pages/Dashboard.tsx` (구현 예정)
  - `backend/src/routes/dashboard.ts` (API 구현 예정)
  - `backend/src/services/dashboard.ts` (비즈니스 로직)
