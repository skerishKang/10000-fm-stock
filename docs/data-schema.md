# Data Schema — FM Stock 데이터 모델

> **이슈:** #2
> **목적:** 6개 핵심 엔티티(expert, source, segment, claim, evaluation, knowledge_note)의 데이터 모델 정의
> **형태:** JSON 기반 (초기 MVP), 향후 DB 이전 가능
> **버전:** 1.0.0

---

## 목차

1. [개요](#1-개요)
2. [Experts](#2-experts)
3. [Sources](#3-sources)
4. [Segments](#4-segments)
5. [Claims](#5-claims)
6. [Evaluations](#6-evaluations)
7. [KnowledgeNotes](#7-knowledgenotes)
8. [관계 정의](#8-관계-정의)
9. [데이터 파일 구조](#9-데이터-파일-구조)
10. [향후 마이그레이션 계획](#10-향후-마이그레이션-계획)

---

## 1. 개요

FM Stock 시스템은 전문가들의 금융 시장 발언(Claim)을 수집, 분석, 평가하기 위한
데이터 파이프라인입니다. 초기 MVP는 JSON 파일 기반으로 동작하며, 추후
관계형 데이터베이스(RDBMS)로의 이전을 고려하여 설계되었습니다.

### 1.1 엔티티 관계 다이어그램 (개요)

```
Expert ──1:N──> Claim ──1:N──> Evaluation
Source ──1:N──> Segment ──1:N──> Claim
                  │
                  └──1:N──> KnowledgeNote
```

### 1.2 공통 필드 규칙

| 규칙 | 내용 |
|------|------|
| ID 포맷 | `${entity_type}_${uuid_short}` (예: `exp_a1b2c3d4`) |
| 날짜 포맷 | ISO 8601: `YYYY-MM-DDTHH:mm:ssZ` |
| 가격/수익률 | Float64, 소수점 4자리까지 허용 |
| null 허용 | 필수가 아닌 필드는 생략 또는 null |
| snake_case | 모든 필드는 snake_case 사용 |

---

## 2. Experts

전문가(Expert)는 금융 시장에 대한 의견을 제시하는 개인 또는 기관입니다.
애널리스트, 유튜버, 방송 패널, 투자자, 보고서 저자 등 다양한 유형을 포괄합니다.

### 2.1 필드 정의

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | Y | 고유 식별자 (`exp_` 접두사) |
| name | string | Y | 이름 (한글/영문) |
| displayName | string | N | 화면 표시용 이름 (name과 다를 경우) |
| type | enum | Y | 전문가 유형 |
| organization | string | N | 소속 기관 |
| channelName | string | N | 채널명 (유튜버 방송인 경우) |
| profileUrl | string | N | 프로필 이미지/페이지 URL |
| bio | string | N | 약력/소개 |
| mainIndustries | string[] | N | 주요 관심 산업 리스트 |
| mainCompanies | string[] | N | 주요 관심 종목 리스트 |
| country | string | N | 국가 코드 (ISO 3166-1 alpha-2) |
| memo | string | N | 내부 메모 |

### 2.2 type enum 값

| 값 | 설명 |
|------|------|
| analyst | 증권사/리서치 애널리스트 |
| youtuber | 유튜브 크리에이터 |
| broadcast_guest | 방송 패널/출연자 |
| investor | 개인/기관 투자자 |
| report_author | 독립 보고서 저자 |
| organization | 기관/법인 |
| other | 기타 |

### 2.3 예시 JSON

```json
{
  "id": "exp_f3a2b1c0",
  "name": "김유튜버",
  "displayName": "김유튜버의 주식TV",
  "type": "youtuber",
  "organization": null,
  "channelName": "김유튜버의 주식TV",
  "profileUrl": "https://youtube.com/@kimstocktv",
  "bio": "10년차 개인투자자. 가치투자와 성장주 분석 위주로 콘텐츠 제작.",
  "mainIndustries": ["반도체", "2차전지", "AI"],
  "mainCompanies": ["삼성전자", "SK하이닉스", "LG에너지솔루션"],
  "country": "KR",
  "memo": "유튜브 구독자 10만, 매주 월/수/금 라이브 방송"
}
```

```json
{
  "id": "exp_b2c3d4e5",
  "name": "John Smith",
  "displayName": null,
  "type": "analyst",
  "organization": "Goldman Sachs",
  "channelName": null,
  "profileUrl": "https://goldmansachs.com/research/john-smith",
  "bio": "Senior Equity Analyst covering US Tech and Semiconductors.",
  "mainIndustries": ["Technology", "Semiconductors"],
  "mainCompanies": ["AAPL", "NVDA", "AMD", "INTC"],
  "country": "US",
  "memo": "Goldman Tech weekly report 발간"
}
```

---

## 3. Sources

Source는 전문가의 발언이 포함된 원본 콘텐츠(영상, 보고서, 방송, 뉴스 등)를 의미합니다.

### 3.1 필드 정의

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | Y | 고유 식별자 (`src_` 접두사) |
| type | enum | Y | 소스 유형 |
| title | string | Y | 제목 |
| url | string | Y | 원본 URL |
| privatePath | string | N | 로컬/비공개 파일 경로 |
| publisher | string | N | 발행자/채널명 |
| publishedAt | datetime | Y | 발행일시 |
| addedAt | datetime | Y | 시스템 추가일시 |
| visibility | enum | Y | 공개 범위 |
| memo | string | N | 내부 메모 |

### 3.2 type enum 값

| 값 | 설명 |
|------|------|
| youtube | 유튜브 영상 |
| report | 증권사/리서치 보고서 |
| broadcast | TV/라디오 방송 |
| news | 뉴스 기사 |
| filing | 공시/분기보고서 |
| ir | IR 자료 |
| other | 기타 |

### 3.3 visibility enum 값

| 값 | 설명 |
|------|------|
| public | 누구나 접근 가능 |
| private | 시스템 내부 전용 |

### 3.4 예시 JSON

```json
{
  "id": "src_9a8b7c6d",
  "type": "youtube",
  "title": "[주식급등주] 2024년 2차전지 대장주 분석! LG에너지솔루션 목표가",
  "url": "https://youtube.com/watch?v=abc123xyz",
  "privatePath": null,
  "publisher": "김유튜버의 주식TV",
  "publishedAt": "2024-01-15T14:30:00Z",
  "addedAt": "2024-01-15T15:00:00Z",
  "visibility": "public",
  "memo": "영상 길이 32분, 조회수 5만"
}
```

```json
{
  "id": "src_1a2b3c4d",
  "type": "report",
  "title": "SK하이닉스 — HBM3E 수혜 지속, 목표가 상향",
  "url": "https://example.com/reports/skhynix-hbm3e-2024.pdf",
  "privatePath": "/data/reports/skhynix-hbm3e-2024-raw.pdf",
  "publisher": "Goldman Sachs",
  "publishedAt": "2024-03-01T09:00:00Z",
  "addedAt": "2024-03-01T09:30:00Z",
  "visibility": "private",
  "memo": "골드만삭스 보고서, 라이선스 제한으로 비공개"
}
```

---

## 4. Segments

Segment는 Source 내에서 특정 전문가가 발언한 연속된 구간입니다.
영상의 경우 시작/종료 시간(초)으로, 보고서의 경우 페이지 번호로 식별합니다.

### 4.1 필드 정의

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | Y | 고유 식별자 (`seg_` 접두사) |
| sourceId | string | Y | 부모 Source ID |
| startTime | float | N | 시작 시간 (초 단위, 영상형 소스) |
| endTime | float | N | 종료 시간 (초 단위, 영상형 소스) |
| page | int | N | 페이지 번호 (문서형 소스) |
| title | string | N | 구간 제목 |
| summary | string | Y | 구간 요약/내용 |

> **참고:** `startTime/endTime`과 `page`는 소스 유형에 따라 선택적으로 사용합니다.
> 영상 유튜브 → `startTime/endTime`, PDF 보고서 → `page`.

### 4.2 예시 JSON

```json
{
  "id": "seg_5e6f7g8h",
  "sourceId": "src_9a8b7c6d",
  "startTime": 1240.5,
  "endTime": 1320.0,
  "page": null,
  "title": "LG에너지솔루션 실적 전망",
  "summary": "LG에너지솔루션의 2024년 실적에 대해 긍정적 전망 제시. 북미 공장 가동률 상승과 GM과의 합작법인(JV) 효과로 매출 성장 예상."
}
```

```json
{
  "id": "seg_6h7i8j9k",
  "sourceId": "src_1a2b3c4d",
  "startTime": null,
  "endTime": null,
  "page": 5,
  "title": "HBM3E 기술 경쟁력 분석",
  "summary": "SK하이닉스의 HBM3E가 2024년 상반기 기준 기술 리더십 유지 중. AI 반도체 시장 성장에 따라 추가 수주 가능성 높음."
}
```

---

## 5. Claims

Claim은 전문가가 특정 종목에 대해 제시한 구체적인 주장/의견입니다.
하나의 Segment에서 여러 Claim이 추출될 수 있습니다.

### 5.1 필드 정의

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | Y | 고유 식별자 (`clm_` 접두사) |
| expertId | string | Y | Expert ID |
| sourceId | string | Y | Source ID |
| segmentId | string | Y | Segment ID |
| ticker | string | Y | 종목 티커 |
| companyName | string | Y | 회사명 |
| industry | string | N | 산업 분류 |
| claimType | string | N | 주장 유형 (예: price_target, rating_change, earnings_estimate 등) |
| direction | enum | Y | 방향성 |
| claimText | string | Y | 주장 원문/요약 |
| evidence | string[] | N | 근거 리스트 |
| baseDate | date | Y | 기준일 (발언일) |
| basePrice | float | Y | 기준 가격 (발언 당시 가격) |
| targetDate | date | Y | 목표일 (평가 마감일) |
| targetPrice | float | Y | 목표 가격 |
| timeHorizon | string | N | 시간대 (short_term/long_term/unspecified) |
| status | enum | Y | 평가 상태 |

### 5.2 direction enum 값

| 값 | 설명 |
|------|------|
| bullish | 강세/매수 의견 |
| bearish | 약세/매도 의견 |
| neutral | 중립 의견 |
| mixed | 혼합 (일부 긍정, 일부 부정) |
| educational_only | 교육 목적, 방향성 없음 |

### 5.3 status enum 값

| 값 | 설명 |
|------|------|
| pending | 평가 전 (대기) |
| evaluated | 평가 완료 |
| invalid | 무효 (데이터 오류, 취소된 의견 등) |

### 5.4 예시 JSON

```json
{
  "id": "clm_7i8j9k0l",
  "expertId": "exp_f3a2b1c0",
  "sourceId": "src_9a8b7c6d",
  "segmentId": "seg_5e6f7g8h",
  "ticker": "373220",
  "companyName": "LG에너지솔루션",
  "industry": "2차전지",
  "claimType": "price_target",
  "direction": "bullish",
  "claimText": "LG에너지솔루션 목표주가 60만원 제시. 북미 공장 가동률 상승과 GM JV 효과로 2024년 매출 30조원 돌파 가능.",
  "evidence": [
    "북미 공장(오하이오, 테네시) 가동률 80% 이상",
    "GM JV 1호기 2024년 1분기 흑자 전환",
    "ESS(에너지저장장치) 수주 잔고 15조원",
    "전기차 시장 성장률 둔화에도 BMS 매출 안정적"
  ],
  "baseDate": "2024-01-15",
  "basePrice": 420000.0,
  "targetDate": "2024-12-31",
  "targetPrice": 600000.0,
  "timeHorizon": "long_term",
  "status": "pending"
}
```

```json
{
  "id": "clm_9k0l1m2n",
  "expertId": "exp_b2c3d4e5",
  "sourceId": "src_1a2b3c4d",
  "segmentId": "seg_6h7i8j9k",
  "ticker": "000660",
  "companyName": "SK하이닉스",
  "industry": "반도체",
  "claimType": "earnings_estimate",
  "direction": "bullish",
  "claimText": "SK하이닉스 2024년 영업이익 20조원 전망. HBM3E 출하량 증가로 DRAM 부문 이익률 40% 예상.",
  "evidence": [
    "HBM3E 고객사 주문량 2배 증가",
    "범용 DRAM 가격 15% 상승 전망",
    "NAND 적자 축소 중",
    "CapEx 효율화로 FCF 개선"
  ],
  "baseDate": "2024-03-01",
  "basePrice": 180000.0,
  "targetDate": "2024-12-31",
  "targetPrice": 250000.0,
  "timeHorizon": "long_term",
  "status": "pending"
}
```

---

## 6. Evaluations

Evaluation은 특정 Claim이 실제 시장에서 어떻게 평가되었는지를 측정한 결과입니다.
목표일(targetDate)이 도래한 후 실행됩니다.

### 6.1 필드 정의

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | Y | 고유 식별자 (`evl_` 접두사) |
| claimId | string | Y | 대상 Claim ID |
| evaluatedAt | date | Y | 평가 시점 (목표일 이후) |
| evaluatedPrice | float | Y | 평가 시점 가격 |
| maxPriceDuringPeriod | float | N | 목표 기간 중 최고가 |
| minPriceDuringPeriod | float | N | 목표 기간 중 최저가 |
| returnRate | float | Y | 수익률 (평가가격 / 기준가격 - 1) |
| benchmark | string | N | 벤치마크 지수 (예: KOSPI, S&P 500) |
| benchmarkReturn | float | N | 벤치마크 수익률 |
| alpha | float | N | 초과 수익률 (returnRate - benchmarkReturn) |
| result | enum | Y | 평가 결과 |
| memo | string | N | 평가 메모 |

### 6.2 result enum 값

| 값 | 설명 |
|------|------|
| hit | 목표 달성 (targetPrice 도달) |
| partial_hit | 부분 달성 (방향성은 맞았으나 목표가 미달) |
| miss | 실패 (방향성도 틀림) |
| invalid | 평가 불가 (데이터 부족, 상장폐지 등) |
| pending | 평가 전 |

### 6.3 예시 JSON

```json
{
  "id": "evl_m3n4o5p6",
  "claimId": "clm_7i8j9k0l",
  "evaluatedAt": "2025-01-02",
  "evaluatedPrice": 520000.0,
  "maxPriceDuringPeriod": 585000.0,
  "minPriceDuringPeriod": 398000.0,
  "returnRate": 0.2381,
  "benchmark": "KOSPI",
  "benchmarkReturn": 0.085,
  "alpha": 0.1531,
  "result": "partial_hit",
  "memo": "목표가 60만원에는 도달하지 못했으나 강세 전망은 유효. 52만원 마감. 기간 내 최고 58.5만원까지 상승."
}
```

```json
{
  "id": "evl_n4o5p6q7",
  "claimId": "clm_9k0l1m2n",
  "evaluatedAt": "2025-01-02",
  "evaluatedPrice": 215000.0,
  "maxPriceDuringPeriod": 240000.0,
  "minPriceDuringPeriod": 172000.0,
  "returnRate": 0.1944,
  "benchmark": "KOSPI",
  "benchmarkReturn": 0.085,
  "alpha": 0.1094,
  "result": "partial_hit",
  "memo": "영업이익 20조 전망 대비 실제는 18.5조로 소폭 하회했으나 주가 상승세는 유효. 목표가 25만원 미달."
}
```

---

## 7. KnowledgeNotes

KnowledgeNote는 특정 Segment에서 추출된 지식/인사이트 조각입니다.
Claim과 달리 방향성이나 평가 대상이 아닌, 순수한 정보성 내용을 저장합니다.

### 7.1 필드 정의

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | Y | 고유 식별자 (`kno_` 접두사) |
| sourceId | string | Y | Source ID |
| segmentId | string | Y | Segment ID |
| expertId | string | Y | Expert ID |
| industry | string | N | 산업 분류 |
| companyName | string | N | 관련 회사명 |
| topic | string | Y | 주제 |
| level | enum | Y | 난이도 |
| summary | string | Y | 요약 내용 |
| keyPoints | string[] | N | 핵심 포인트 리스트 |
| tags | string[] | N | 태그 리스트 |

### 7.2 level enum 값

| 값 | 설명 |
|------|------|
| basic | 초보자용 (기초 개념, 용어 설명) |
| intermediate | 중급 (업계 분석, 트렌드) |
| advanced | 고급 (전문적 통찰, 정량 분석) |

### 7.3 예시 JSON

```json
{
  "id": "kno_1a2b3c4d",
  "sourceId": "src_9a8b7c6d",
  "segmentId": "seg_5e6f7g8h",
  "expertId": "exp_f3a2b1c0",
  "industry": "2차전지",
  "companyName": "LG에너지솔루션",
  "topic": "GM 합작법인(JV)의 수익성 분석",
  "level": "intermediate",
  "summary": "LG에너지솔루션과 GM의 북미 합작법인(JV)은 2024년 1분기 기준 흑자 전환에 성공. 오하이오 1공장 가동률이 80%를 넘어섰으며, 테네시 2공장은 2024년 하반기 양산 예정. 두 공장의 연간 생산능력(CAPA)은 약 70GWh로 예상.",
  "keyPoints": [
    "오하이오 1공장: 2024년 1분기 흑자 전환",
    "테네시 2공장: 2024년 하반기 양산 시작",
    "두 공장 합산 CAPA 약 70GWh",
    "GM과의 수익 배분 조건: CAPEX의 50% GM 부담",
    "IRA 첨단제조세액공제(AMPC) 수혜로 추가 이익 개선 가능"
  ],
  "tags": ["LG에너지솔루션", "GM", "합작법인", "북미", "IRA", "2차전지"]
}
```

```json
{
  "id": "kno_5e6f7g8h",
  "sourceId": "src_1a2b3c4d",
  "segmentId": "seg_6h7i8j9k",
  "expertId": "exp_b2c3d4e5",
  "industry": "반도체",
  "companyName": "SK하이닉스",
  "topic": "HBM3E 기술 우위와 시장 전망",
  "level": "advanced",
  "summary": "SK하이닉스는 HBM3E(High Bandwidth Memory 4세대)에서 업계 선두 유지 중. 8단 제품은 이미 양산 중이며, 12단 제품은 2024년 하반기 양산 예정. 경쟁사 대비 6개월 이상 기술 리드. 2024년 HBM 시장 점유율 55% 전망.",
  "keyPoints": [
    "HBM3E 8단: 2024년 1분기 양산 돌입",
    "HBM3E 12단: 2024년 하반기 양산 목표",
    "HBM 시장 점유율: 55% (2024E)",
    "MR-MUF 공정 기술 독보적",
    "TC-NCF 하이브리드 본딩 기술도 개발 중",
    "고객사: NVIDIA, AMD, Intel"
  ],
  "tags": ["SK하이닉스", "HBM3E", "HBM", "AI 반도체", "NVIDIA", "DRAM"]
}
```

---

## 8. 관계 정의

### 8.1 ER 관계 요약

| 관계 | 설명 | Cardinality |
|------|------|-------------|
| Expert → Claim | 한 명의 전문가가 여러 개의 Claim을 제시 | 1:N |
| Source → Segment | 하나의 Source는 여러 Segment로 분할됨 | 1:N |
| Segment → Claim | 하나의 Segment에서 여러 Claim 추출 가능 | 1:N |
| Segment → KnowledgeNote | 하나의 Segment에서 여러 KnowledgeNote 추출 가능 | 1:N |
| Claim → Evaluation | 하나의 Claim은 여러 시점/기준으로 평가 가능 | 1:N |

### 8.2 참조 관계 예시 (연결 쿼리)

```
# 특정 Source의 모든 Segment 조회
source -> segments (sourceId 기준)

# 특정 Expert의 모든 Claim 조회
expert -> claims (expertId 기준)

# 특정 Segment의 모든 Claim 조회
segment -> claims (segmentId 기준)

# 특정 Claim의 모든 Evaluation 조회
claim -> evaluations (claimId 기준)

# 특정 Source의 모든 KnowledgeNote 조회
source -> knowledge_notes (sourceId 기준)
```

### 8.3 제약 조건

1. **참조 무결성:** `sourceId`, `expertId`, `segmentId`, `claimId`는 반드시
   존재하는 레코드를 가리켜야 합니다 (외래 키 개념).
2. **중복 방지:** 동일 전문가가 동일 종목에 대해 동일 segment 내에서
   중복 Claim을 생성할 수 없습니다 (복합 UNIQUE).
3. **단방향 참조:** KnowledgeNote는 Claim과 직접 연결되지 않습니다.
   Segment를 통해 간접적으로 연결됩니다.

---

## 9. 데이터 파일 구조

초기 MVP는 JSON 파일 기반으로 운영됩니다. 각 엔티티별로 하나의 JSON 파일을
사용하며, 내부는 배열 형태로 레코드를 저장합니다.

### 9.1 디렉토리 구조

```
data/
├── experts.json            # 모든 Expert 데이터
├── sources.json            # 모든 Source 데이터
├── segments.json           # 모든 Segment 데이터
├── claims.json             # 모든 Claim 데이터
├── evaluations.json        # 모든 Evaluation 데이터
└── knowledge_notes.json    # 모든 KnowledgeNote 데이터
```

### 9.2 파일 형식 규칙

- 각 파일은 최상위 JSON 배열 `[]`로 구성됩니다.
- 배열의 각 요소는 해당 엔티티의 JSON 객체입니다.
- 파일 인코딩은 UTF-8을 사용합니다.
- 들여쓰기는 2-space를 사용합니다.
- 파일 크기가 일정 수준(약 100MB)을 초과하면 분할 저장을 고려합니다.
- 각 파일에는 주석을 포함할 수 없습니다 (표준 JSON).

### 9.3 인덱싱 전략 (JSON 환경)

JSON 파일 기반에서는 다음 방식으로 인덱싱을 대체합니다:

```python
# 예시: JSON 파일에서 특정 Expert의 Claim 조회
import json

def get_claims_by_expert(expert_id: str) -> list[dict]:
    with open("data/claims.json", "r") as f:
        claims = json.load(f)
    return [c for c in claims if c["expertId"] == expert_id]

def get_evaluations_by_claim(claim_id: str) -> list[dict]:
    with open("data/evaluations.json", "r") as f:
        evaluations = json.load(f)
    return [e for e in evaluations if e["claimId"] == claim_id]
```

---

## 10. 향후 마이그레이션 계획

### 10.1 단계별 마이그레이션

| 단계 | 시기 | 내용 |
|------|------|------|
| Phase 0 | 초기 MVP | JSON 파일 기반 운영 |
| Phase 1 | MVP 이후 | SQLite 도입 (단일 파일 DB) |
| Phase 2 | 운영 안정화 | PostgreSQL/MySQL 도입 |
| Phase 3 | 확장 | 인덱싱, 파티셔닝, Read Replica |

### 10.2 DB 마이그레이션 시 고려사항

1. **스키마 변환:** JSON 필드 → RDBMS 컬럼 매핑
   - JSON 배열 필드 (`evidence[]`, `keyPoints[]`, `tags[]`) → 별도 조인 테이블
   - ENUM 타입 → CHECK 제약 조건 또는 별도 코드 테이블
2. **ID 전략:** UUID 문자열 유지 (JSON 시절과 호환)
3. **인덱스:** `expertId`, `sourceId`, `segmentId`, `claimId`, `ticker`에
   B-tree 인덱스 생성
4. **데이터 이관:** ETL 스크립트로 JSON 파일 → DB 마이그레이션

### 10.3 예상 테이블 스키마 (PostgreSQL)

```sql
-- Experts
CREATE TABLE experts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('analyst','youtuber','broadcast_guest','investor','report_author','organization','other')),
    organization TEXT,
    channel_name TEXT,
    profile_url TEXT,
    bio TEXT,
    main_industries TEXT[],  -- PostgreSQL array
    main_companies TEXT[],
    country TEXT,
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sources
CREATE TABLE sources (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('youtube','report','broadcast','news','filing','ir','other')),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    private_path TEXT,
    publisher TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    added_at TIMESTAMPTZ NOT NULL,
    visibility TEXT NOT NULL CHECK (visibility IN ('public','private')),
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segments
CREATE TABLE segments (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id),
    start_time DOUBLE PRECISION,
    end_time DOUBLE PRECISION,
    page INTEGER,
    title TEXT,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims
CREATE TABLE claims (
    id TEXT PRIMARY KEY,
    expert_id TEXT NOT NULL REFERENCES experts(id),
    source_id TEXT NOT NULL REFERENCES sources(id),
    segment_id TEXT NOT NULL REFERENCES segments(id),
    ticker TEXT NOT NULL,
    company_name TEXT NOT NULL,
    industry TEXT,
    claim_type TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('bullish','bearish','neutral','mixed','educational_only')),
    claim_text TEXT NOT NULL,
    evidence TEXT[],  -- PostgreSQL array
    base_date DATE NOT NULL,
    base_price DOUBLE PRECISION NOT NULL,
    target_date DATE NOT NULL,
    target_price DOUBLE PRECISION NOT NULL,
    time_horizon TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','evaluated','invalid')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluations
CREATE TABLE evaluations (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL REFERENCES claims(id),
    evaluated_at DATE NOT NULL,
    evaluated_price DOUBLE PRECISION NOT NULL,
    max_price_during_period DOUBLE PRECISION,
    min_price_during_period DOUBLE PRECISION,
    return_rate DOUBLE PRECISION NOT NULL,
    benchmark TEXT,
    benchmark_return DOUBLE PRECISION,
    alpha DOUBLE PRECISION,
    result TEXT NOT NULL CHECK (result IN ('hit','partial_hit','miss','invalid','pending')),
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Notes
CREATE TABLE knowledge_notes (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id),
    segment_id TEXT NOT NULL REFERENCES segments(id),
    expert_id TEXT NOT NULL REFERENCES experts(id),
    industry TEXT,
    company_name TEXT,
    topic TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('basic','intermediate','advanced')),
    summary TEXT NOT NULL,
    key_points TEXT[],  -- PostgreSQL array
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_claims_expert_id ON claims(expert_id);
CREATE INDEX idx_claims_source_id ON claims(source_id);
CREATE INDEX idx_claims_segment_id ON claims(segment_id);
CREATE INDEX idx_claims_ticker ON claims(ticker);
CREATE INDEX idx_segments_source_id ON segments(source_id);
CREATE INDEX idx_evaluations_claim_id ON evaluations(claim_id);
CREATE INDEX idx_knowledge_notes_source_id ON knowledge_notes(source_id);
CREATE INDEX idx_knowledge_notes_segment_id ON knowledge_notes(segment_id);
CREATE INDEX idx_knowledge_notes_expert_id ON knowledge_notes(expert_id);
```

---

> **문서 이력**
>
> | 일자 | 버전 | 변경 내용 |
> |------|------|----------|
> | 2025-05-12 | 1.0.0 | 최초 작성. 6개 엔티티 데이터 모델 정의 |
>
> **작성자:** FM Stock

