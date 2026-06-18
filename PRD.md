# 프리다이빙 폼 코치 — 기획서

**프로젝트 코드명:** Descent
**문서 버전:** v1.0
**작성 목적:** Claude Code 작업용 사양서 (PRD + 기술 스펙 + 작업 가이드)

---

## 0. 한 줄 요약

측면에서 촬영한 다이빙 클립을 올리면 프레임을 추출해 Claude 비전으로 폼(유선형·핀킥·입수·이완 등)을 평가하고, **블로그·쇼츠에 바로 옮길 수 있는 코칭 카드**로 돌려주는 웹 앱. 회차를 쌓아 변화 추이까지 본다.

---

## 1. 배경 & 목적

- **누구를 위한 것인가:** 1차 사용자는 본인(AIDA 강사 준비/활동). 강사 여정을 기록하는 **콘텐츠·포트폴리오 자산**이 핵심 목적이다. 외부 판매용 SaaS가 아니다.
- **왜 만드는가:**
  1. 분석 결과물 자체가 네이버 블로그 글 / 인스타 카루셀 / 유튜브 쇼츠 소재가 된다.
  2. "AIDA 강사인데 이런 도구를 직접 만든다"가 한 화면에서 증명되는 포트폴리오가 된다.
- **차별점(해자):** 모델은 누구나 부르지만, AIDA 기준에 기반한 **코칭 루브릭**은 본인만 만들 수 있다. 이 루브릭이 제품의 핵심 가치이며, 노출되지 않게 서버에 둔다.

---

## 2. 목표 / 비목표 (scope guardrails)

작게 시작하기 위해 v1 범위를 명확히 고정한다.

**v1 목표 (In scope)**
- 영상 업로드 → 프레임 추출 → 코칭 카드 출력
- 종목 선택(최소 CWT/콘스턴트 웨이트부터)에 따라 루브릭이 분기
- 회차 로컬 저장 및 목록 보기
- 결과를 마크다운 텍스트로 복사(콘텐츠 워크플로)

**v1 비목표 (Out of scope, 이후 단계로 미룸)**
- 수중 포즈 추정(MediaPipe) 기반 정량 지표 — 수중 정확도 한계로 측면 클립 한정 후속 단계
- 계정/로그인/결제 — 1인 도구이므로 불필요
- 클라우드 DB / 멀티 유저 — 로컬(IndexedDB)로 충분
- 실시간 영상 스트리밍 분석

> 판단 기준: "이게 콘텐츠/포트폴리오를 더 좋게 만드는가?"가 아니면 v1에 넣지 않는다.

---

## 3. 핵심 사용자 흐름

1. 종목 선택 (예: CWT)
2. 측면에서 찍은 다이빙 클립 업로드 (실제 다이브 타임 ~1분 30초 기준, 길이 제한 없음)
3. 분석 모드 선택: **전체 다이브 개요**(기본) 또는 **구간 집중**(in/out 지정)
4. 브라우저에서 프레임 추출 — 길이에 따라 장수 자동 결정(§6.5)
5. 프레임 + 종목 + 모드를 백엔드로 전송 → 백엔드가 루브릭으로 프롬프트 구성 → Claude 비전 호출
6. 항목별 점수·관찰·개선팁 + 총평 + 콘텐츠 후킹 카피가 카드로 표시
7. 결과를 저장 / 마크다운 복사 / 회차 비교

---

## 4. 기능 요구사항

### v1 (MVP)
- **FR-1 종목 선택기:** 종목 목록에서 하나 선택. v1은 CWT부터, 이후 CNF·FIM 추가.
- **FR-2 영상 업로드:** 로컬 파일 선택 + 드래그앤드롭. video/* 만 허용. **길이 제한 없음**(실제 다이브 ~1분 30초 기준). 영상은 브라우저 밖으로 나가지 않음(프레임만 전송).
- **FR-3 적응형 프레임 추출:** `<video>` + `<canvas>`로 균등 간격 캡처, 긴 변 720px 다운스케일, JPEG 0.78. **프레임 수는 영상(또는 선택 구간) 길이에 따라 자동 결정, 상한 12장**(§6.5).
- **FR-3.5 분석 모드:**
  - **전체 다이브 개요(기본):** 클립 전체를 적응형 샘플링. 하강·프리폴·턴·상승의 흐름 위주로 코멘트.
  - **구간 집중:** 사용자가 타임라인에서 시작/끝(in/out)을 지정 → 그 구간만 조밀 샘플링. 특정 기술(핀킥·턴 등)에 대한 상세 피드백. 전후 비교 콘텐츠에 적합.
  - 30초를 넘겨도 거부하지 않는다. 너무 길어 흐름이 흩어지면 "구간을 좁히면 더 정확해요" 안내만 노출.
- **FR-4 분석 요청:** 프레임(base64) + 종목 id를 백엔드 `/api/analyze`로 POST.
- **FR-5 결과 카드:** 총평 / 항목별(점수 1~5, 0.5 단위 · 관찰 · 개선팁) / 콘텐츠 후킹 카피.
- **FR-6 회차 저장:** IndexedDB에 세션 저장(종목, 날짜, 결과, 썸네일 1장).
- **FR-7 회차 목록:** 저장된 세션 리스트 + 상세 보기.
- **FR-8 콘텐츠 내보내기:** 결과를 블로그용 마크다운으로 클립보드 복사.

### v1.5 ~ 이후
- **FR-9 회차 비교:** 같은 종목의 항목별 점수 추이 그래프("4주 핀킥 변화").
- **FR-10 카드 이미지 내보내기:** 결과 카드를 PNG로 저장(쇼츠/인스타용).
- **FR-11 종목 확장:** CNF, FIM, DYN 등 루브릭 추가.
- **FR-12 정량 지표(실험):** 측면 클립 한정 MediaPipe로 킥 빈도·몸 각도 수치화.

---

## 5. 기술 스택 & 아키텍처

### 스택
- **프론트엔드:** Vite + React + TypeScript, 스타일은 Tailwind CSS
- **백엔드:** 서버리스 함수(Vercel Functions 권장) — `/api/*`
- **LLM:** Anthropic Messages API, 모델 `claude-sonnet-4-6` (기본값)
  - 비용 절감 옵션: `claude-haiku-4-5`
  - 최고 품질 옵션: `claude-opus-4-8`
  - 세 모델 모두 이미지 입력 지원. 환경변수로 교체 가능하게 한다.
- **로컬 저장:** IndexedDB (Dexie.js 래퍼)
- **배포:** Vercel (Hobby 티어로 시작)

### 아키텍처 핵심 원칙 (⚠️ 보안/IP)
1. **API 키는 절대 브라우저에 두지 않는다.** 키는 백엔드 환경변수(`ANTHROPIC_API_KEY`)에만 존재하고, 브라우저는 자체 백엔드(`/api/analyze`)만 호출한다.
2. **코칭 루브릭(프롬프트)은 서버에만 둔다.** 클라이언트 번들에 노출되면 해자가 사라진다. 클라이언트는 종목 id와 라벨만 안다.
3. **영상 원본은 서버로 보내지 않는다.** 추출된 프레임(이미지)만 전송한다.

### 데이터 흐름
```
[브라우저]
  영상 선택 → 프레임 추출(canvas) → base64[]
        │  POST /api/analyze { discipline, frames }
        ▼
[서버리스 /api/analyze]
  종목 → 루브릭 조회 → 프롬프트 구성
        │  Anthropic Messages API (이미지 + 텍스트)
        ▼
  JSON 파싱 → { overall, categories, hook } 반환
        │
        ▼
[브라우저] 카드 렌더 → IndexedDB 저장
```

---

## 6. 데이터 모델

```ts
// shared/types.ts
export type DisciplineId = 'CWT' | 'CNF' | 'FIM' | 'DYN' | 'STA';

export interface CategoryResult {
  name: string;      // 예: "유선형"
  score: number;     // 1~5, 0.5 단위
  note: string;      // 보이는 것에 대한 관찰
  tip: string;       // 개선 팁
}

export interface AnalysisResult {
  overall: string;
  categories: CategoryResult[];
  hook: string;      // 블로그/쇼츠 후킹 카피
}

export interface Session {
  id: string;            // uuid
  createdAt: number;     // epoch ms
  discipline: DisciplineId;
  mode: 'overview' | 'segment';
  segment?: { startSec: number; endSec: number }; // mode==='segment'일 때만
  videoName: string;
  durationSec: number;   // 원본 영상 길이
  frameCount: number;    // 실제 추출한 장수
  thumbnail?: string;    // base64 썸네일 1장 (목록용)
  result: AnalysisResult;
}
```

---

## 6.5 프레임 샘플링 정책

실제 다이브 타임이 보통 1분 30초 내외라, 고정 5장 균등 샘플링으로는 하강·프리폴·턴·상승이 한두 장씩만 잡혀 어느 구간도 제대로 못 본다. 그렇다고 무작정 장수를 늘리면 비용·지연·출력 토큰이 함께 커진다. 그래서 **길이 적응형 샘플링 + 구간 집중 모드**를 함께 쓴다.

### 길이별 프레임 수 (상한 12장)
전체 개요 모드는 영상 전체 길이, 구간 집중 모드는 선택 구간 길이를 기준으로 적용한다.

| 길이 | 프레임 수 |
|---|---|
| ≤ 30초 | 5 |
| 30–60초 | 8 |
| 60–120초 | 10 |
| > 120초 | 12 (상한) + "구간을 좁히면 더 정확해요" 안내 |

```ts
// src/lib/frames.ts
function frameCountFor(durationSec: number): number {
  if (durationSec <= 30) return 5;
  if (durationSec <= 60) return 8;
  if (durationSec <= 120) return 10;
  return 12; // 비용/지연/품질 상한
}
```

### 샘플링 규칙
- 균등 간격, 양 끝은 살짝 안쪽에서 시작/종료(첫·마지막 순간의 흐릿한 프레임 회피).
- **전체 개요:** `[0, duration]` 구간을 `frameCountFor(duration)`장으로 균등 샘플링.
- **구간 집중:** `[in, out]` 구간을 `max(5, frameCountFor(out - in))`장으로 균등 샘플링(짧아도 최소 5장).

### 모드별 프롬프트 차이 (서버)
- **전체 개요:** "이 프레임들은 한 번의 다이브 전체를 시간순으로 추출한 것이다. 가능하면 구간(하강/프리폴/턴/상승)별 흐름을 짚어라."
- **구간 집중:** "이 프레임들은 다이브의 한 구간을 조밀하게 추출한 것이다. 해당 구간의 기술을 집중적으로 평가하라." (어떤 구간인지는 추정하지 말고 보이는 것 기준)

### 상한을 두는 이유
12장으로 캡을 두는 건 회당 비용·지연과, 비슷비슷한 프레임이 많을 때 모델이 핵심을 흐리는 걸 막기 위함이다. 더 깊이 보고 싶으면 장수를 늘리는 대신 **구간 집중 모드로 범위를 좁히는 것**을 기본 전략으로 안내한다.

---

## 7. 코칭 루브릭 설계 (서버 전용)

루브릭은 **데이터로** 관리한다. 종목 추가 = 코드 수정이 아니라 config 객체 추가가 되도록 한다. 이게 확장성과 포트폴리오 완성도를 동시에 올린다. **이 파일은 서버에서만 import 한다.**

```ts
// shared/rubrics.ts  (server-only)
export interface RubricCategory {
  id: string;
  label: string;     // 예: "핀 킥"
  criteria: string;  // 프롬프트에 들어갈 평가 기준
}

export interface Rubric {
  id: DisciplineId;
  label: string;       // UI 표시명
  context: string;     // 종목 전반 코칭 맥락
  categories: RubricCategory[];
}

export const RUBRICS: Record<DisciplineId, Rubric> = {
  CWT: {
    id: 'CWT',
    label: '콘스턴트 웨이트 (CWT)',
    context: 'AIDA 기준 핀 착용 수직 다이빙. 프레임에서 보이는 것만 평가하고, 이퀄라이징·컨트랙션·내성처럼 영상으로 판단 불가한 것은 평가에서 뺀다.',
    categories: [
      { id: 'streamline', label: '유선형',
        criteria: '머리 중립(턱 살짝 당김), 양팔을 뻗어 상완이 귀를 감싸는지, 몸이 일직선인지, 불필요한 아치/꺾임.' },
      { id: 'finning', label: '핀 킥',
        criteria: '고관절에서 시작하는 길고 부드러운 킥 vs 무릎 위주 자전거 킥, 발목 신전(포인 발), 진폭·리듬, 좌우 대칭.' },
      { id: 'entry', label: '입수·자세',
        criteria: '덕다이브의 몸 접기와 다리 수직 정렬, 또는 하강/프리폴 자세와 라인 정렬.' },
      { id: 'relax', label: '이완',
        criteria: '어깨·목·손·얼굴의 긴장 신호와 전반적인 평온함.' },
    ],
  },
  // CNF, FIM, DYN, STA 는 이후 단계에서 같은 형태로 추가
} as Record<DisciplineId, Rubric>;
```

서버는 이 루브릭으로 프롬프트를 구성한다:
- 시스템/지시문: "AIDA 기준에 정통한 프리다이빙 코치. 프레임에서 보이는 것만 근거로, AIDA 강사처럼 한국어로 평가. JSON만 출력."
- 각 카테고리의 `criteria`를 평가 항목으로 나열
- 출력 스키마(위 `AnalysisResult`)를 명시하고 코드펜스 금지

---

## 8. API 설계

### `POST /api/analyze`
**요청**
```json
{
  "discipline": "CWT",
  "mode": "overview",
  "segment": { "startSec": 12.0, "endSec": 38.5 },
  "frames": ["<base64-jpeg>", "..."]
}
```
`mode`는 `"overview"` | `"segment"`. `segment`는 `mode==="segment"`일 때만 포함(서버는 프롬프트 톤 조정용으로만 사용, 좌표 신뢰 아님).

**응답 (200)**
```json
{
  "overall": "…",
  "categories": [
    { "name": "유선형", "score": 4, "note": "…", "tip": "…" }
  ],
  "hook": "…"
}
```

**에러 (4xx/5xx)**
```json
{ "error": "메시지" }
```

**서버 처리 순서**
1. `discipline`·`mode` 유효성 검사 → `RUBRICS[discipline]` 조회
2. 프레임 개수/크기 검증(최대 12장, 각 ~1.5MB 이하)
3. 프롬프트 구성(루브릭 + 모드별 지시문(§6.5) + 출력 스키마)
4. Anthropic Messages API 호출: `model: 'claude-sonnet-4-6'`, `max_tokens: 1500`, content = 이미지 블록들 + 지시 텍스트
5. 응답에서 `type === 'text'` 블록만 모아 코드펜스 제거 후 `JSON.parse`
6. 스키마 검증 후 반환. 파싱 실패 시 1회 재시도 → 그래도 실패면 `{ error }`

> Anthropic API/모델/가격 최신값은 docs에서 확인: https://docs.claude.com/en/api/overview

---

## 9. 화면 / 컴포넌트 구성

- **AppShell** — 헤더(Descent), 라우팅(분석 / 기록)
- **AnalyzeView**
  - `DisciplineSelect` — 종목 선택
  - `VideoDropzone` — 업로드 + 미리보기
  - `ModeToggle` — 전체 개요 / 구간 집중 선택
  - `SegmentTrimmer` — 구간 집중일 때 타임라인에서 in/out 핸들 지정
  - `FrameStrip` — 추출 프레임 썸네일
  - `LoadingState` — 하강 모티프 로딩
  - `ResultCard` — 총평 + 항목별 스톱(점수 미터) + 후킹 + 복사 버튼
- **HistoryView**
  - `SessionList` — 저장된 회차 목록(종목/날짜/총점)
  - `SessionDetail` — 과거 결과 카드
  - `ComparisonChart` (v1.5) — 항목별 점수 추이

디자인 방향: 하강(descent)을 모티프로, 가이드 라인(로프)을 따라 항목이 "뎁스 스톱"처럼 배치되고 점수는 다이브 컴퓨터 판독 느낌. 기존 프로토타입(`freedive-coach.html`)의 팔레트/톤을 그대로 계승.

---

## 10. 개발 로드맵 (Claude Code 마일스톤)

각 마일스톤을 하나의 작업 단위로 Claude Code에 맡긴다.

- **M0 — 스캐폴드:** Vite+React+TS+Tailwind 셋업, Vercel 설정, `.env.local`에 `ANTHROPIC_API_KEY`, 기본 폴더 구조와 타입 정의.
- **M1 — 프로토타입 이식:** 업로드 → **적응형 프레임 추출(§6.5)** → `/api/analyze`(CWT 단일 루브릭, 전체 개요 모드) → ResultCard. 키는 서버에만.
- **M2 — 분석 모드:** `ModeToggle` + `SegmentTrimmer`(in/out 지정) + 구간 집중 샘플링, 서버 모드별 프롬프트.
- **M3 — 종목/루브릭 분기:** `DisciplineSelect` + config 기반 루브릭, 서버 프롬프트 구성 로직.
- **M4 — 로컬 기록:** Dexie로 세션 저장/목록/상세.
- **M5 — 회차 비교:** 같은 종목 점수 추이 차트.
- **M6 — 콘텐츠 내보내기:** 마크다운 복사 + 카드 PNG 저장.
- **M7 (선택) — 정량 지표:** 측면 클립 한정 MediaPipe 킥 빈도/몸 각도.

---

## 11. Claude Code 작업 가이드

### 권장 리포 구조
```
descent/
  src/
    components/      # AnalyzeView, ResultCard, ...
    lib/
      frames.ts      # 프레임 추출
      api.ts         # /api/analyze 클라이언트
      storage.ts     # Dexie 래퍼
    disciplines.ts   # 클라이언트용 종목 id+label만 (criteria 없음)
    App.tsx
  api/
    analyze.ts       # 서버리스 함수
  shared/
    types.ts
    rubrics.ts       # 서버에서만 import (criteria 포함)
  CLAUDE.md
  .env.local         # gitignore
```

### 시작 시 권장 CLAUDE.md (그대로 복붙해서 사용)
```md
# Descent — 프리다이빙 폼 코치

## 개요
측면 다이빙 클립을 프레임 추출해 Claude 비전으로 폼을 코칭하는 웹 앱.
1차 사용자는 본인(AIDA 강사). 콘텐츠/포트폴리오 목적. 외부 SaaS 아님.

## 스택
Vite + React + TypeScript + Tailwind / Vercel 서버리스 / Anthropic Messages API / IndexedDB(Dexie)

## 절대 규칙
- ANTHROPIC_API_KEY는 서버 환경변수에만. 브라우저/번들에 절대 노출 금지.
- 코칭 루브릭(shared/rubrics.ts)은 서버에서만 import. 클라이언트는 종목 라벨만.
- 영상 원본은 서버로 보내지 않는다. 추출된 프레임(이미지)만 전송.
- 프레임은 긴 변 720px, JPEG 0.78로 다운스케일. 장수는 길이 적응형(§6.5), 상한 12장.
- 영상 길이 제한 없음(다이브 ~1분 30초 기준). 30초 초과해도 거부하지 말 것.

## 모델
기본 claude-sonnet-4-6. 환경변수 MODEL로 교체 가능(haiku-4-5 / opus-4-8).

## 명령어
- 개발: npm run dev
- 빌드: npm run build
- 배포: vercel

## 코드 컨벤션
- 타입은 shared/types.ts에 집중. any 지양.
- API 응답은 항상 스키마 검증 후 사용.
```

---

## 12. 리스크 & 결정 필요 사항

- **API 키 보안:** 반드시 백엔드 프록시 경유. (결정됨)
- **회당 비용:** 이미지 5장 + 출력 ~1.5k 토큰 수준. 정확한 단가는 docs Pricing 확인 후, 필요하면 Haiku로 전환. 프레임 수/해상도가 비용에 직접 영향.
- **영상 길이:** 실제 다이브가 ~1분 30초이므로 길이 제한을 두지 않는다. 대신 길이 적응형 샘플링(상한 12장)으로 비용을 잡고, 더 깊은 분석은 구간 집중 모드로 유도한다(§6.5). 긴 영상은 추출 시간이 늘 수 있어 클라이언트 다운스케일은 유지.
- **수중 분석 정확도:** 탁도·조명·웻슈트·핀으로 인식 저하. 측면·고대비 클립 권장 가이드를 UI에 명시. 정량 지표는 후속.
- **프레임 5장의 한계:** 동작 흐름(킥 사이클)은 부분만 포착. 흐름 분석이 필요하면 샘플링 옵션 추가 검토.
- **개인정보:** 영상은 로컬에만, 프레임만 외부(자체 백엔드→Anthropic) 전송됨을 사용자(본인)에게 명확히. 저장은 썸네일 1장만.

---

## 13. 다음 액션

1. M0 스캐폴드를 Claude Code에 의뢰
2. Anthropic API 키 발급 → `.env.local`에 입력 (본인 직접)
3. M1까지 돌려보고, 가장 먼저 다듬을 종목 루브릭(CNF? FIM?) 결정
