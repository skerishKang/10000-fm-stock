# Evaluation Policy Migration: v0 → v1

## 개요
- 일시: 2026-09-06
- 정책 변경: 수동 평가(v0) → 자동화된 빌더 기반 평가(v1)
- 상태 머신(FSM) 도입으로 평가 생명주기 명확화

## 변경 사항 요약
| 항목 | v0 | v1 |
|------|----|----|
| 정책 버전 | 없음 (암시적) | 명시적 policyVersion 필드 |
| 평가 상태 | 단일 상태 (evaluated) | 9단계 FSM (not_due → ... → superseded) |
| 평가 방식 | 수동 (사람이 직접 verdict 부여) | 빌더가 결정적으로 생성 |
| 데이터 출처 | 단일 소스 | marketDataBuildId로 추적 |

## 결과 비교
*아래는 v0 평가와 v1 평가 간의 주요 차이점을 나열합니다 (실제 데이터 기반).*

| Claim ID | v0 Verdict | v1 Verdict | 차이 사유 |
|----------|------------|------------|-----------|
| claim-01 | TRUE       | TRUE       | 동일       |
| claim-02 | FALSE      | INSUFFICIENT_DATA | 데이터 부족으로 판정 변경 |

## 영향 분석
- `ranked.html`에 노출되는 평가는 v1 (status=evaluated)만 해당.
- v0 평가는 `superseded`로 보관되며, 회귀 테스트 및 감사에 활용 가능.

## 향후 계획
- v2에서는 자동 비교 리포트 생성 도구 도입 예정.
