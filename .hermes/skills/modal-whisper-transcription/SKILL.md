---
name: modal-whisper-transcription
description: Modal T4 GPU에서 Whisper 전사 실행 - 로컬 yt-dlp + Modal Mount 패턴 (10000-fm-stock 프로젝트용)
triggers: [modal, whisper, transcription, youtube, yt-dlp, asr]
---

# Modal Whisper 전사 가이드

YouTube 영상을 Modal T4 GPU에서 Whisper large-v3로 전사하는 안정적인 패턴입니다.

## 문제와 해결책

| 문제 | 해결책 |
|------|--------|
| Modal 클라우드 IP에서 YouTube 봇 차단 | 로컬 yt-dlp → Modal Mount |
| API 변경 (container_idle_timeout → scaledown_window) | 최신 Modal 문서 참조 |
| Volume 마운트 충돌 | `/root/.cache` 분리, 별도 경로 사용 |
| Import 에러 | 단일 파일 통합, Modal 패턴 따르기 |

## 실행 시간 (42초 테스트 영상 기준)

| 단계 | 시간 |
|------|------|
| Whisper 모델 다운로드 (첫 실행) | 41초 (2.88GB) |
| 모델 로딩 + 전사 | 2-3초 |
| 로컬 yt-dlp 다운로드 | <1초 |
| **총 소요 (첫 실행)** | ~44초 |
| **총 소요 (이후 실행)** | 2-3초 |

## 패턴: 로컬 yt-dlp + Modal Mount

1. 로컬 WSL에서 yt-dlp로 오디오 다운로드
2. Modal Mount로 파일 전달
3. Modal T4 GPU에서 Whisper large-v3 전사

## 프로젝트 특화 설정

- 캐시 경로: 프로젝트 내 `.cache/` 디렉토리 사용
- 출력: `candidate/transcript.json` 형식
- 다음 단계: Laguna/DeepSeek 분석 (CTO 라우팅)
