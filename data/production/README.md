# production/ — 운영 모드 데이터 (현재 비어있음)

이 디렉터리는 **승인된 운영 데이터**가 위치합니다.
- 실데이터는 자동 승격이 아닌 human review 후에만 이관
- `data/_meta.json`의 `productionApproval` 객체가 반드시 존재해야 함
- 승인 절차: `docs/dataset-mode.md` §3 참조
