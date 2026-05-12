# Ingest 화면 설계

## 배경
첫 번째 진짜 기능 = 자료 입력 화면. 유튜브 링크/리포트 경로 입력, 구간/페이지 지정

## 유튜브 입력 모드
필드: 영상URL, 영상제목, 채널명/발행자, 발행일, 시작시간, 끝시간, 발언자이름, 종목, 산업, 메모, 자막/텍스트
시간 변환: 05:12 → 312초 (내부 저장은 초 단위)

## 리포트 입력 모드
필드: 리포트제목, 발행사, 애널리스트, 발행일, 공개URL, privatePath, 페이지번호, 섹션제목, 종목, 산업, 메모, 본문일부
리포트 원문 공개 금지, 참조 정보만 저장

## 저장 결과 JSON 예시
유튜브: {source: {type:youtube, title, url, publisher, publishedAt}, segment: {sourceId, startTime, endTime, title, summary}}
리포트: {source: {type:report, title, publisher, publishedAt, url, privatePath}, segment: {sourceId, page, title, summary}}

## 버튼: 저장만 / Review로 이동 / Claim/Knowledge 후보 만들기

## 수동 입력: AI가 없어도 전체 기능 동작 가능
