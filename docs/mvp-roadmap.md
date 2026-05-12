# MVP 구현 로드맵

> **이슈:** #16  
> **목표:** 10000-fm-stock 프로젝트의 1차 MVP(Minimum Viable Product) 전체 구현 순서 설계  
> **범위:** 로그인, DB, Supabase, Firebase, 서버 API, 자동 수집, 실제 가격 API는 포함하지 않음

---

## 개요

본 문서는 10000-fm-stock의 첫 번째 MVP(Minimum Viable Product)를 구현하기 위한 전체 단계별 로드맵이다.  
각 단계는 선행 조건이 충족되어야 다음 단계로 진행할 수 있도록 설계되었으며, 정적 프론트엔드 기반으로 동작한다.

---

## Step 1. 제품 문서 작성

MVP의 전체적인 방향과 규칙을 정의하는 문서들을 먼저 작성한다.

| 문서 | 파일명 | 설명 |
|------|--------|------|
| 제품 정의 | `product-definition.md` | 제품의 목적, 대상 사용자, 핵심 기능, 제약 조건 정의 |
| 데이터 스키마 | `data-schema.md` | 모든 데이터 모델(Stock, Claim, Expert, Source 등)의 구조 정의 |
| 수집 정책 | `collection-policy.md` | 데이터 수집 기준, 제외 조건, 업데이트 주기 정책 |
| 개발 규칙 | `development-rules.md` | 코딩 컨벤션, 브랜치 전략, 커밋 메시지 규칙, PR 템플릿 |
| 평가 지표 | `evaluation-metrics.md` | 정확도, 수익률, 랭킹 등 품질 평가 기준 정의 |

**산출물:** `docs/product-definition.md`, `docs/data-schema.md`, `docs/collection-policy.md`, `docs/development-rules.md`, `docs/evaluation-metrics.md`

---

## Step 2. 정적 프로젝트 골격

HTML/CSS/JS 기반의 정적 프로젝트 폴더 구조를 생성하고 기초 설정을 완료한다.

```
fm-stock/
├── index.html              # 진입점 / 대시보드
├── css/
│   └── style.css           # 공통 스타일
├── js/
│   ├── app.js              # 앱 초기화, 라우팅
│   ├── loader.js           # 공통 데이터 로더 (fetch 기반)
│   ├── utils.js            # 유틸리티 함수
│   ├── dashboard.js        # 대시보드 뷰
│   ├── claims.js           # Claims 목록/상세 뷰
│   ├── experts.js          # Experts 목록/상세 뷰
│   ├── knowledge.js        # Knowledge 뷰
│   ├── sources.js          # Sources 뷰
│   └── ingest.js           # Ingest/Review 뷰
├── data/
│   ├── stocks.json         # 주식 목록
│   ├── claims.json         # 클레임 데이터
│   ├── experts.json        # 전문가 데이터
│   ├── knowledge.json      # 지식/팩트 데이터
│   └── sources.json        # 출처 데이터
└── docs/                   # 문서 디렉토리 (Step 1 산출물)
```

**산출물:** 위 디렉토리 구조와 빈 파일들

---

## Step 3. 샘플 데이터 생성

실제 서비스처럼 보이는 가짜 데이터를 생성한다.

- **stocks.json:** 종목코드, 종목명, 섹터, 시가총액 등 기본 정보 (약 20~30개 종목)
- **claims.json:** 전문가별 클레임 (날짜, 주장 내용, 근거, 신뢰도 점수)
- **experts.json:** 전문가 정보 (이름, 소속, 전문 분야, 실적 요약)
- **knowledge.json:** 검증된 팩트/지식 데이터
- **sources.json:** 출처 정보 (기사 URL, 발행일, 매체)

**데이터 요구사항:**
- 모든 JSON 파일은 유효한 JSON 형식
- 각 데이터는 `data-schema.md`에서 정의한 스키마를 따라야 함
- Claims와 Experts는 서로 참조 관계(foreign key)를 가져야 함
- 자연스러운 한글 데이터 사용

**산출물:** `data/*.json` 샘플 데이터 파일들

---

## Step 4. 공통 데이터 로더 (fetch 기반)

모든 뷰에서 사용할 공통 데이터 로더를 구현한다.

**구현 내용:**
- `js/loader.js` — `fetch()` 기반 JSON 데이터 로딩 유틸리티
- 캐싱 지원 (메모리 캐시, 중복 요청 방지)
- 에러 처리 (네트워크 오류, 파싱 오류 → 사용자 피드백)
- 로딩 상태 표시를 위한 Promise 기반 인터페이스
- 크로스-데이터 참조 해결 (Expert의 Claims, Source의 Claims 등)

**API 예시:**
```javascript
// 기본 사용법
const stocks = await DataLoader.load('stocks');
const claims = await DataLoader.load('claims', { expertId: 'exp-001' });

// 관계형 로드
const expert = await DataLoader.load('experts', { id: 'exp-001' });
const expertClaims = await DataLoader.getClaimsForExpert('exp-001');
```

**산출물:** `js/loader.js` 완성

---

## Step 5. 대시보드 (Dashboard)

프로젝트의 메인 진입점이 되는 대시보드 페이지를 구현한다.

**기능:**
- 전체 통계 요약 (총 전문가 수, 총 클레임 수, 검증된 클레임 비율 등)
- 최근 클레임 목록 (최신순 5~10개)
- 랭킹 TOP 전문가 위젯 (수익률 기준 상위 5명)
- 섹터별 분포 차트 (간단한 CSS/Canvas 차트 또는 HTML로 구현)
- 빠른 검색 바 (종목명/전문가명 검색)

**기술 포인트:**
- `index.html`을 대시보드로 구성
- 차트는 외부 라이브러리 없이 HTML/CSS/Canvas로만 구현 (추후 고도화)
- 반응형 레이아웃

**산출물:** `index.html` (대시보드), `js/dashboard.js`

---

## Step 6. Claims 목록/상세

전문가들의 클레임(주장/예측)을 조회하는 페이지.

**Claims 목록 기능:**
- 전체 클레임 목록 (테이블/카드 뷰)
- 필터링: 전문가별, 종목별, 기간별, 신뢰도별
- 정렬: 날짜순, 신뢰도순, 최신순
- 페이지네이션 (클라이언트 사이드, 20개 단위)

**Claims 상세 기능:**
- 클레임 원문 및 요약
- 해당 전문가 정보 링크
- 관련 Knowledge 팩트 연결
- 출처(Source) 목록
- 검증 상태 표시 (Verified/Pending/Disputed)

**산출물:** HTML 내 Claims 섹션, `js/claims.js`

---

## Step 7. Experts 목록/상세

전문가 프로필 및 실적을 조회하는 페이지.

**Experts 목록 기능:**
- 전체 전문가 목록 (카드/리스트 뷰)
- 필터링: 분야별, 소속별
- 정렬: 이름, 수익률, 클레임 수
- 검색

**Experts 상세 기능:**
- 프로필 정보 (이름, 소속, 소개)
- 통계 (전체 클레임 수, 정확률, 수익률)
- 클레임 목록 (해당 전문가의 모든 클레임, Step 6 컴포넌트 재사용)
- 시간에 따른 성과 추이 (간단한 차트)

**산출물:** HTML 내 Experts 섹션, `js/experts.js`

---

## Step 8. Knowledge

검증된 팩트/지식 데이터베이스를 조회하는 페이지.

**기능:**
- 전체 Knowledge 항목 목록
- 카테고리/태그별 필터링
- 관련 Claims 연결 표시
- 관련 종목 연결 표시
- 검색 기능

**산출물:** HTML 내 Knowledge 섹션, `js/knowledge.js`

---

## Step 9. Sources

출처(뉴스 기사, 보고서, 공시 등)를 조회하는 페이지.

**기능:**
- 전체 출처 목록
- 매체별 필터링
- 기간별 필터링
- 관련 Claims 연결 표시
- 외부 링크 (새 탭에서 열기)

**산출물:** HTML 내 Sources 섹션, `js/sources.js`

---

## Step 10. Ingest / Review

데이터 수집 및 검토를 위한 인터페이스 (관리자 기능).

**Ingest 기능:**
- 새 클레임 입력 폼 (전문가 선택, 종목 선택, 내용 입력, 출처 입력)
- 새 전문가 등록 폼
- 새 출처 추가 폼
- (향후) 대량 업로드 지원 기반

**Review 기능:**
- 미검증 클레임 목록 (Pending 상태)
- 승인/반려 액션 버튼
- 검증 코멘트 입력

**참고:** 실제 저장은 로컬 스토리지 또는 세션 스토리지에 임시 저장 (서버 API 없음)

**산출물:** HTML 내 Ingest/Review 섹션, `js/ingest.js`

---

## Step 11. 수익률 / 랭킹 계산 로직

전문가들의 성과를 평가하는 핵심 계산 모듈.

**수익률 계산:**
- 클레임 기반 가상 수익률 산출
- 검증된 클레임만 집계
- 시간 가중 수익률 (Time-Weighted Return)
- 샤프 비율 (위험 조정 수익률)

**랭킹 계산:**
- 종합 랭킹 (수익률 + 정확률 + 클레임 수 복합 점수)
- 기간별 랭킹 (최근 1개월/3개월/6개월/1년)
- 섹터별 랭킹

**구현 위치:** `js/ranking.js` (신규 생성)

**산출물:** `js/ranking.js`, Experts 뷰에 랭킹 반영

---

## 제외 사항 (MVP 이후)

다음 기능은 이번 MVP에서 **구현하지 않는다:**

| 기능 | 이유 |
|------|------|
| 로그인 / 인증 | 서버 API 필요 |
| 데이터베이스 (DB) | 정적 JSON 파일로 충분 |
| Supabase / Firebase | 서버리스 백엔드, MVP 이후 고려 |
| 서버 API | 백엔드 개발 별도 필요 |
| 자동 데이터 수집 | 크롤링/스크래핑 별도 모듈 |
| 실제 가격 API | 외부 API 연동, MVP 이후 |
| 외부 차트 라이브러리 | Canvas/HTML로 먼저 구현 |
| 단위 테스트 | 기능 완성 후 추가 |

---

## 의존성 그래프

```
Step 1 (문서) ──→ Step 2 (골격)
                     │
                     ↓
                  Step 3 (샘플 데이터)
                     │
                     ↓
                  Step 4 (데이터 로더)
                     │
            ┌────────┼────────┐
            ↓        ↓        ↓
      Step 5(Dash) Step 6(Claims) Step 7(Experts)
            │        │            │
            └────────┼────────────┘
                     ↓
            Step 8(Knowledge) Step 9(Sources)
                     │            │
                     └─────┬──────┘
                           ↓
                     Step 10(Ingest/Review)
                           ↓
                     Step 11(수익률/랭킹)
```

---

## 일정 (참고)

| Step | 예상 시간 | 비고 |
|------|-----------|------|
| Step 1 | 1~2일 | 문서 중심, 병렬 가능 |
| Step 2 | 0.5일 | 폴더 구조 + 기본 HTML |
| Step 3 | 1~2일 | 데이터 정확성 중요 |
| Step 4 | 1일 | 로더 유틸리티 |
| Step 5~7 | 3~4일 | 메인 뷰 3개 |
| Step 8~9 | 1~2일 | 부가 뷰 2개 |
| Step 10 | 1~2일 | 입력/검토 UI |
| Step 11 | 1일 | 계산 로직 |
| **합계** | **~14일** | |

---

## 완료 조건

모든 Step 완료 후 MVP가 충족해야 할 조건:

1. ✅ `index.html` 하나로 전체 앱이 동작 (SPA 개념)
2. ✅ 모든 데이터는 `data/*.json`에서 로드
3. ✅ 필터링, 정렬, 검색이 모든 리스트 뷰에서 동작
4. ✅ 전문가 랭킹과 수익률이 계산되어 표시됨
5. ✅ Ingest 폼에서 입력한 데이터가 세션 내에서 조회 가능
6. ✅ 단 하나의 서버 요청 없이 브라우저만으로 실행 가능
7. ✅ 문서 5종이 `docs/`에 완비
