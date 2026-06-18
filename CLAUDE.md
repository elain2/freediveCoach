# Descent — 프리다이빙 폼 코치

## 개요
측면 다이빙 클립을 프레임 추출해 Gemini Vision으로 폼을 코칭하는 웹 앱.
1차 사용자는 본인(AIDA 강사). 콘텐츠/포트폴리오 목적. 외부 SaaS 아님.

## 스택
Vite + React + TypeScript + Tailwind / Vercel 서버리스 / Google Gemini API / IndexedDB(Dexie)

## 절대 규칙
- GEMINI_API_KEY는 서버 환경변수에만. 브라우저/번들에 절대 노출 금지.
- 코칭 루브릭(shared/rubrics.ts)은 서버에서만 import. 클라이언트는 종목 라벨만.
- 영상 원본은 서버로 보내지 않는다. 추출된 프레임(이미지)만 전송.
- 프레임은 긴 변 720px, JPEG 0.78로 다운스케일. 장수는 길이 적응형, 상한 12장.
- 영상 길이 제한 없음(다이브 ~1분 30초 기준). 30초 초과해도 거부하지 말 것.

## 프레임 샘플링 정책
| 길이 | 프레임 수 |
|---|---|
| ≤ 30초 | 5 |
| 30–60초 | 8 |
| 60–120초 | 10 |
| > 120초 | 12 (상한) + "구간을 좁히면 더 정확해요" 안내 |

## 모델
기본 gemini-2.0-flash. 환경변수 MODEL로 교체 가능(gemini-1.5-flash / gemini-1.5-pro).

## 명령어
- 개발: npm run dev
- 빌드: npm run build
- 배포: vercel

## 코드 컨벤션
- 타입은 shared/types.ts에 집중. any 지양.
- API 응답은 항상 스키마 검증 후 사용.

## 프로젝트 구조 (목표)
```
src/
  components/      # AnalyzeView, ResultCard, ...
  lib/
    frames.ts      # 프레임 추출
    api.ts         # /api/analyze 클라이언트
    storage.ts     # Dexie 래퍼
  disciplines.ts   # 클라이언트용 종목 id+label만 (criteria 없음)
  App.tsx
api/
  analyze.ts       # 서버리스 함수 (Vercel)
shared/
  types.ts
  rubrics.ts       # 서버에서만 import (criteria 포함)
```

## 마일스톤
- **M0** 스캐폴드: Vite+React+TS+Tailwind, Vercel 설정, 폴더 구조, 타입 정의
- **M1** 프로토타입: 업로드 → 적응형 프레임 추출 → /api/analyze → ResultCard
- **M2** 분석 모드: ModeToggle + SegmentTrimmer + 구간 집중 샘플링
- **M3** 종목 분기: DisciplineSelect + config 기반 루브릭
- **M4** 로컬 기록: Dexie로 세션 저장/목록/상세
- **M5** 회차 비교: 점수 추이 차트
- **M6** 내보내기: 마크다운 복사 + 카드 PNG

## 참고 문서
- PRD.md: 전체 기획서 (상세 요구사항, 루브릭 설계, API 스펙 포함)
