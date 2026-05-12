# 개발 규칙 (Development Rules)

> 프로젝트: 10000-fm-stock
> 최종 업데이트: 2026-05-12

---

## 1. 기본 기술 스택

- **HTML, CSS, Vanilla JavaScript, JSON** — 순수 웹 프론트엔드 기술만 사용
- **React, Vue, Next.js, TypeScript, Firebase, Supabase, 서버 API, 로그인, 빌드 도구** 사용 금지
- 초기 MVP 단계에서는 위 기술이 필요하지 않으며, 순수 웹 기술로 충분히 구현 가능한 범위로 제한

---

## 2. 500줄 이하 규칙

- 모든 HTML/CSS/JS 파일은 **500줄 이하**로 유지
- 파일이 500줄에 가까워지면 **기능 단위로 분할**하여 별도 파일로 추출
- 이 규칙은 코드 가독성과 유지보수성을 보장하기 위한 핵심 원칙

---

## 3. 폴더명-파일명 규칙

파일명에 **폴더명을 포함**하여 검색 편의성을 높인다.

### 좋은 예

```
claims/claims-list.js
experts/experts-detail.js
knowledge/knowledge-list.js
experts/experts-render.js
ingest/ingest-youtube.js
review/review-claims.js
```

### 나쁜 예

```
claims/list.js         → 검색 시 어떤 리스트인지 불명확
experts/detail.js      → 중복 파일명 가능성 높음
```

**원칙**: 동일한 폴더 내 파일이라도 파일명에 폴더명을 포함하여, IDE 검색이나 grep 시 출처를 즉시 파악할 수 있어야 한다.

---

## 4. 권장 폴더 구조

```
/
├── index.html              # 메인 진입점
├── ingest.html             # 데이터 수집 페이지
├── review.html             # 검수 페이지
├── experts.html            # 인물 목록 페이지
├── experts-detail.html     # 인물 상세 페이지
├── claims.html             # 클레임 목록 페이지
├── sources.html            # 출처 목록 페이지
├── knowledge.html          # 지식 노트 페이지
├── ranking.html            # 랭킹 페이지
│
├── assets/
│   ├── css/
│   │   ├── css-base.css        # 기본 리셋, 변수, 타이포그래피
│   │   ├── css-layout.css      # 레이아웃 (그리드, 플렉스, 컨테이너)
│   │   ├── css-components.css  # 공통 컴포넌트 스타일
│   │   ├── css-dashboard.css   # 대시보드 관련 스타일
│   │   └── css-forms.css       # 폼 관련 스타일
│   │
│   └── js/
│       ├── app/                # 앱 진입 및 초기화
│       ├── data/               # 데이터 로딩 및 캐싱
│       ├── ingest/             # 데이터 수집 관련 모듈
│       ├── review/             # 검수 관련 모듈
│       ├── dashboard/          # 대시보드 관련 모듈
│       ├── experts/            # 인물 관련 모듈
│       ├── claims/             # 클레임 관련 모듈
│       ├── sources/            # 출처 관련 모듈
│       ├── knowledge/          # 지식 노트 관련 모듈
│       ├── metrics/            # 통계/메트릭 계산 모듈
│       └── utils/              # 유틸리티 함수
│
├── data/
│   ├── experts.json            # 인물 데이터
│   ├── sources.json            # 출처 데이터
│   ├── segments.json           # 영상 세그먼트 데이터
│   ├── claims.json             # 클레임 데이터
│   ├── evaluations.json        # 평가 데이터
│   └── knowledge-notes.json    # 지식 노트 데이터
│
└── docs/                       # 문서
```

---

## 5. 모듈 역할 원칙

각 파일은 **한 가지 역할만** 담당하며, 이름이 그 역할을 명확히 드러내야 한다.

| 파일명 | 역할 |
|---|---|
| `data-loader.js` | JSON 데이터 로딩 (fetch/파일 읽기) |
| `metrics-returns.js` | 수익률/알파/적중률 계산 |
| `experts-detail.js` | 인물 상세 데이터 조립 (비즈니스 로직) |
| `experts-render.js` | 인물 관련 화면 렌더링 (DOM 조작) |
| `ingest-youtube.js` | 유튜브 URL 및 시간 구간 입력 처리 |
| `review-claims.js` | 클레임 후보 검수 UI 제어 |

**분리 기준**:

- **데이터 로딩**은 `data-*.js` 계열 파일에
- **비즈니스 로직/계산**은 `metrics-*.js`, `*-detail.js` 계열 파일에
- **UI 렌더링**은 `*-render.js`, `*-list.js`, `*-form.js` 계열 파일에
- **특정 페이지 기능**은 해당 페이지명을 접두사로 (`ingest-*`, `review-*`)

---

## 6. 커밋 메시지 규칙

- 영어로 작성
- 접두사 사용: `Add`, `Fix`, `Update`, `Refactor`, `Remove`, `Docs`
- 명령형 현재형 사용
- 예: `Add development rules document`, `Fix wrong computation in metrics-returns.js`

---

## 7. 브랜치 규칙

- **기능/계획 브랜치**: `plan/issue-{번호}-{간략설명}`
- **버그 수정 브랜치**: `fix/issue-{번호}-{간략설명}`
- **기능 개발 브랜치**: `feat/issue-{번호}-{간략설명}`
- PR 생성 시 `Closes #{번호}` 본문 포함

---

## 8. PR 규칙

- PR 제목은 영어로 작성
- PR 본문에 이슈 연결 포함 (`Closes #이슈번호`)
- `--base main` 기준으로 PR 생성
- PR 리뷰어 없이 셀프 머지 가능 (단, 1인 프로젝트 기준)

---

*이 문서는 프로젝트 전반에 걸쳐 일관된 코드 품질과 구조를 유지하기 위한 기준입니다.*
