# Evaluation Methodology

## Version History
- **v0 (Legacy)**: 초기 수동 평가. 자동화된 상태 추적 없음.
- **v1 (Authoritative)**: 정식 평가 프레임워크. 아래 FSM(Finite State Machine)과 심사 기준 적용.

## State Machine (v1)
| 상태 | 설명 | 전이 조건 |
| :--- | :--- | :--- |
| `not_due` | 평가 대상 날짜(targetDate)가 미래임 | 시간 경과 → `pending_data` |
| `pending_data` | 마켓 데이터 빌드가 아직 실행되지 않음 | 빌더 실행 완료 → `ready_for_evaluation` |
| `ready_for_evaluation` | 평가기(Builder)가 실행 가능한 상태 | 빌더 픽업 → `under_review` |
| `under_review` | 평가 진행 중 (수동/자동) | 평가 완료 → `evaluated` / `invalid` / `unverifiable` / `insufficient_data` |
| `evaluated` | **최종 검증 완료. 랭킹 노출 가능.** | 정책 변경 시 → `superseded` |
| `invalid` | 주장 자체가 논리적/구조적 오류 | (터미널 상태) |
| `unverifiable` | 외부 데이터 부재로 검증 불가 | (터미널 상태) |
| `insufficient_data` | 데이터는 있으나 판단 기준 미달 | (터미널 상태) |
| `superseded` | 새 정책(v2 등)으로 대체됨 | (터미널 상태) |

## Verdict Definitions
- **TRUE**: 조건을 완전히 충족함.
- **FALSE**: 조건을 충족하지 못함.
- **INSUFFICIENT_DATA**: 데이터가 모호하거나 판단 기준치 미달.
- **UNVERIFIABLE**: 필요한 원본 링크/데이터가 존재하지 않음.

## Security & UI Rule
- 랭킹(`ranked.html`)에는 `status == "evaluated"`이고 `policyVersion == active(policy.json)`인 레코드만 노출합니다.
- 모든 계산은 빌더에서 수행되며, 브라우저(JS)는 오직 렌더링만 합니다.
