# Sources 페이지 설계

> **Issue:** #12 — 영상/리포트 출처(Source) 관리 화면 설계
> **Status:** Plan / 초안
> **Last updated:** 2026-05-12

## 개요

Source는 발언과 지식이 나온 **출처**를 의미한다.
영상(youtube), 리포트(report), 방송(broadcast), 뉴스(news),
공시(filing), IR 자료(ir), 기타(other) 등 다양한 유형을 포괄한다.
원본 파일 자체를 저장하는 것이 아니라,
**참조 정보(메타데이터)만** 데이터베이스에 저장한다.

화면은 크게 두 가지로 구성된다:

1. **Source 목록 화면** — 전체 Source를 테이블/리스트로 조회
2. **Source 상세 화면** — 개별 Source의 세부 정보와 연결된 데이터 확인

---

## 1. Source 목록 화면

### 1.1 화면 구성

| 항목 | 설명 |
|------|------|
| 검색 필터 | type, 제목, 발행자/채널명, 발행일 범위, 처리상태 |
| 정렬 | 발행일순, 등록일순, 제목순, segment수순 |
| 액션 | 상세보기, 원본열기(URL이 있을 경우) |

### 1.2 목록 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| type | enum | youtube / report / broadcast / news / filing / ir / other |
| 제목 | string | Source의 제목 (영상제목, 리포트제목 등) |
| 발행자/채널명 | string | 유튜브 채널명, 증권사명, 방송국명 등 |
| 발행일 | date | YYYY-MM-DD |
| URL | string | 공개 URL (있는 경우에만 표시) |
| private | boolean | 개인 전용 여부 (privatePath 존재 여부) |
| segment수 | integer | 연결된 segment 개수 |
| claim수 | integer | 연결된 claim 개수 |
| knowledge_note수 | integer | 연결된 knowledge_note 개수 |
| 처리상태 | enum | not_started / segmented / reviewed / evaluated |

### 1.3 처리 상태

각 Source는 다음과 같은 생명주기를 가진다:

```
not_started --> segmented --> reviewed --> evaluated
```

- **not_started**: Source가 등록만 되고 아직 처리되지 않음
- **segmented**: 영상/리포트가 구간(segment)으로 분할됨
- **reviewed**: segment 검토 완료
- **evaluated**: 최종 평가 완료 (claim/knowledge_note 연결까지 완료)

처리상태는 목록 필터로 사용할 수 있으며,
각 상태별로 진행되지 않은 작업을 확인할 수 있다.

### 1.4 목록 UX

- 기본 정렬은 **발행일 내림차순** (최신 등록순)
- type 필드는 아이콘 + 레이블로 표시 (예: YouTube, Report)
- 처리상태는 컬러 배지로 표시
  - not_started: 회색
  - segmented: 파랑
  - reviewed: 초록
  - evaluated: 보라
- private Source는 자물쇠 아이콘 + 흐린 배경으로 구분
- 페이지네이션: 20개 / 페이지

---

## 2. Source 상세 화면

### 2.1 공통 정보 영역

모든 Source 타입에 공통으로 표시되는 정보:

| 항목 | 설명 |
|------|------|
| 제목 | Source 제목 |
| 발행자 | 채널명 / 증권사 / 방송국 / 언론사 |
| 발행일 | YYYY-MM-DD |
| 타입 | youtube / report / ... |
| URL | 공개 URL (버튼으로 원본 열기) |
| privatePath | 개인 전용 경로 (개인모드에서만 표시) |
| 등록일 | 시스템 등록 일시 |
| 처리상태 | 현재 상태 + 상태 변경 이력 |
| 통계 | segment수 / claim수 / knowledge_note수 |

### 2.2 유튜브 상세 (type=youtube)

유튜브 Source 상세 화면은 다음 정보를 추가로 표시한다:

| 항목 | 설명 |
|------|------|
| 영상제목 | 유튜브 영상 제목 |
| 채널명 | 업로드 채널 |
| 발행일 | 업로드 일자 |
| URL | YouTube URL |
| 원본열기버튼 | 새 탭에서 YouTube 영상 열기 |

#### Segment 목록 (유튜브)

| 필드 | 설명 |
|------|------|
| segment ID | 고유 식별자 |
| 시작시간 | mm:ss 형식 (예: 05:12) |
| 끝시간 | mm:ss 형식 (예: 08:45) |
| 내용 | segment 텍스트 요약 |
| claim수 | 연결된 claim 개수 |
| knowledge_note수 | 연결된 knowledge_note 개수 |

**시작시간 링크**: 시작시간을 클릭하면
`?t={seconds}s` 파라미터를 포함한 YouTube URL이 열린다.
예: `https://youtube.com/watch?v=abc123&t=312s`

Segment 목록 UX:
- 각 segment는 확장 가능한 카드 형태
- 펼치면 연결된 claim과 knowledge_note 목록 표시
- claim/knowledge_note에서 다시 해당 segment로 이동 가능
- 시작시간 클릭 -> YouTube 해당 위치로 이동

### 2.3 리포트 상세 (type=report)

리포트 Source 상세 화면은 다음 정보를 추가로 표시한다:

| 항목 | 설명 |
|------|------|
| 리포트제목 | 리포트 문서 제목 |
| 발행사 | 증권사/리서치사 이름 |
| 애널리스트 | 담당 애널리스트 이름 |
| 발행일 | 리포트 발행일 |
| 공개URL | 외부 공개 URL (공시/뉴스 등) |
| privatePath | 내부 파일 경로 (개인모드 전용) |

#### Segment 목록 (리포트)

리포트는 페이지/섹션 단위로 segment가 구성된다.

| 필드 | 설명 |
|------|------|
| segment ID | 고유 식별자 |
| 위치 | 페이지 번호 또는 섹션명 (예: p.3, 2. Valuation) |
| 내용 | segment 텍스트 요약 |
| claim수 | 연결된 claim 개수 |
| knowledge_note수 | 연결된 knowledge_note 개수 |

### 2.4 방송/뉴스/공시/IR 상세

다른 타입의 Source는 공통 정보 영역 + 타입별 추가 필드로 구성된다:

| 타입 | 추가 필드 |
|------|-----------|
| broadcast | 방송국명, 프로그램명, 방송일시 |
| news | 언론사명, 기자명, 발행일 |
| filing | 공시종류(정정/수정/조회 등), 공시번호 |
| ir | IR자료명, 발행사, 이벤트일시 |
| other | (자유 형식 메모) |

---

## 3. 보안

### 3.1 privatePath 보호

- `privatePath` 필드는 **개인 모드에서만** 표시된다.
- 공개 화면/공유 화면에서는 `privatePath`가 완전히 노출되지 않는다.
- API 응답에서도 privatePath는 개인 모드 사용자에게만 포함된다.
- 공개 모드에서 private Source는
  "비공개 출처"로 표시되고 URL/경로는 가려진다.

### 3.2 역할 기반 접근 제어

| 역할 | Source 조회 | Source 생성/수정 | privatePath 조회 |
|------|------------|-----------------|-----------------|
| Admin | 전체 | 가능 | 가능 |
| Editor | 전체 | 가능 | 가능 (개인모드) |
| Viewer | 공개 Source만 | 불가능 | 불가능 |

---

## 4. 데이터 모델 (참고)

```sql
CREATE TABLE source (
  id              UUID PRIMARY KEY,
  type            VARCHAR(20) NOT NULL CHECK (type IN (
    'youtube', 'report', 'broadcast', 'news',
    'filing', 'ir', 'other'
  )),
  title           VARCHAR(500) NOT NULL,
  publisher       VARCHAR(200),
  published_at    DATE,
  url             TEXT,
  private_path    TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'not_started'
                  CHECK (status IN (
    'not_started', 'segmented', 'reviewed', 'evaluated'
  )),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE source_segment (
  id              UUID PRIMARY KEY,
  source_id       UUID NOT NULL REFERENCES source(id),
  seq             INTEGER NOT NULL,
  start_time      INTEGER,  -- seconds (youtube)
  end_time        INTEGER,  -- seconds (youtube)
  location        VARCHAR(100),  -- page/section (report)
  content         TEXT,
  summary         TEXT,
  claim_count     INTEGER NOT NULL DEFAULT 0,
  knowledge_note_count INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_source_type ON source(type);
CREATE INDEX idx_source_status ON source(status);
CREATE INDEX idx_source_published_at ON source(published_at);
CREATE INDEX idx_segment_source ON source_segment(source_id);
```

---

## 5. API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/sources | Source 목록 조회 (필터/정렬/페이지네이션) |
| GET | /api/sources/:id | Source 상세 조회 |
| POST | /api/sources | Source 생성 |
| PUT | /api/sources/:id | Source 수정 |
| DELETE | /api/sources/:id | Source 삭제 |
| GET | /api/sources/:id/segments | Source의 segment 목록 |
| PATCH | /api/sources/:id/status | Source 처리상태 변경 |

---

## 6. 화면 스케치 (텍스트 목업)

### 목록 화면

```
+-----------------------------------------------------------------+
| [필터: Type ▼] [검색어...] [발행일: ~ ] [상태: ▼] [검색]     |
+-----------------------------------------------------------------+
| ☐ | Type | 제목           | 발행자     | 발행일    | 상태     |
| ☐ | 🎬  | 2026 Q1 컨콜   | 유튜브채널A | 2026-04- | segmented|
| ☐ | 📄  | SK하이닉스 Rpt | KB증권     | 2026-04- | reviewed |
| ☐ | 📺  | 뉴스룸         | JTBC       | 2026-04- | evaluated|
| ☐ | 🔒  | 내부 IR 자료   | (비공개)   | 2026-03- | not_start|
+-----------------------------------------------------------------+
| ◀ 1 2 3 ... 10 ▶  총 187개                                  |
+-----------------------------------------------------------------+
```

### 상세 화면 (유튜브 예시)

```
+-----------------------------------------------------------------+
| ← 목록으로                                            [편집] |
+-----------------------------------------------------------------+
| 🎬 YouTube                                                  |
| # 2026 Q1 컨콜 요약                                         |
| 채널: 유튜브채널A · 2026-04-15                              |
| [🔗 원본 열기] https://youtube.com/watch?v=abc123           |
| 처리상태: ✅ segmented                                      |
| 세그먼트: 8개 · Claim: 12개 · 노트: 5개                     |
+-----------------------------------------------------------------+
| Segment 목록                                                |
| +-----------------------------------------------------------+ |
| | 01  02:15 -- 05:30  [🔗]  매출 성장률 분석   C:2 N:1   | |
| +-----------------------------------------------------------+ |
| | 02  05:30 -- 08:45  [🔗]  비용 구조 개선     C:3 N:1   | |
| +-----------------------------------------------------------+ |
| | 03  08:45 -- 12:00  [🔗]  해외 시장 전망     C:1 N:0   | |
| +-----------------------------------------------------------+ |
+-----------------------------------------------------------------+
```

---

## 7. 향후 고려 사항

- Source 간 관계 (예: 리포트가 영상을 인용)
- Source 북마크 / 즐겨찾기
- Source 태깅 / 카테고리 분류
- Source 통계 대시보드 (타입별 분포, 처리율 등)
- Source 병합 (중복 Source 통합)
- 파일 업로드 -> privatePath 자동 생성
- YouTube API 연동 (자동 메타데이터 수집)
- 리포트 OCR / PDF 파싱 연동

---

*End of document*