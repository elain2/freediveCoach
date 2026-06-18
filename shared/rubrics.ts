// shared/rubrics.ts
// ⚠️ 서버에서만 import 할 것! 클라이언트 번들에 포함되면 안 됨.
// 코칭 루브릭은 핵심 IP이므로 서버 사이드에서만 사용

import type { DisciplineId } from './types';

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

export const RUBRICS: Partial<Record<DisciplineId, Rubric>> = {
  CWT: {
    id: 'CWT',
    label: '콘스턴트 웨이트 (CWT)',
    context: 'AIDA 기준 핀(모노핀 또는 롱핀) 착용 수직 다이빙. 프레임에서 보이는 것만 평가하고, 이퀄라이징·컨트랙션·내성처럼 영상으로 판단 불가한 것은 평가에서 뺀다.',
    categories: [
      {
        id: 'streamline',
        label: '유선형',
        criteria: '머리 중립(턱 살짝 당김), 양팔을 뻗어 상완이 귀를 감싸는지, 몸이 일직선인지, 불필요한 아치/꺾임이 있는지.',
      },
      {
        id: 'finning',
        label: '핀 킥',
        criteria: '고관절에서 시작하는 길고 부드러운 킥 vs 무릎 위주 자전거 킥, 발목 신전(포인 발), 진폭·리듬, 좌우 대칭.',
      },
      {
        id: 'entry',
        label: '입수·덕다이브',
        criteria: '덕다이브의 몸 접기와 다리 수직 정렬, 하강/프리폴 자세와 라인 정렬.',
      },
      {
        id: 'relax',
        label: '이완',
        criteria: '어깨·목·손·얼굴의 긴장 신호와 전반적인 평온함.',
      },
    ],
  },

  CNF: {
    id: 'CNF',
    label: '콘스턴트 노핀 (CNF)',
    context: 'AIDA 기준 핀 없이 맨몸으로 수직 다이빙. 브레스트 스트로크 킥과 팔 동작의 효율이 핵심. 프레임에서 보이는 것만 평가.',
    categories: [
      {
        id: 'streamline',
        label: '유선형',
        criteria: '글라이드 구간에서의 스트림라인 유지, 머리 중립, 팔을 뻗었을 때 상완이 귀를 감싸는지, 몸이 일직선인지.',
      },
      {
        id: 'kick',
        label: '브레스트 킥',
        criteria: '무릎을 배 쪽으로 당기는 리커버리 동작의 최소화, 발목 굴곡(도르시 플렉션)으로 물을 밀어내는 효율, 양발 대칭, 킥 후 완전한 글라이드.',
      },
      {
        id: 'pull',
        label: '팔 스트로크',
        criteria: '넓은 스윕으로 물을 잡는 캐치, 몸 옆을 따라 허벅지까지 당기는 풀, 최소 저항 리커버리, 팔-킥 타이밍 조화.',
      },
      {
        id: 'relax',
        label: '이완·효율',
        criteria: '불필요한 동작 없이 효율적인 움직임, 얼굴·목·어깨의 긴장 신호, 글라이드 구간 충분히 활용.',
      },
    ],
  },

  FIM: {
    id: 'FIM',
    label: '프리 이머젼 (FIM)',
    context: 'AIDA 기준 로프를 손으로 잡고 당기며 하강/상승하는 종목. 핀과 킥 없이 팔 힘으로만 이동. 프레임에서 보이는 것만 평가.',
    categories: [
      {
        id: 'streamline',
        label: '유선형',
        criteria: '로프를 당기는 동안 몸이 일직선 유지, 다리가 흔들리지 않는지, 불필요한 몸의 회전이나 사이드 모션.',
      },
      {
        id: 'pull',
        label: '풀 테크닉',
        criteria: '팔을 완전히 뻗어서 잡고 몸 전체를 당기는 긴 스트로크 vs 짧은 스트로크, 양팔 교대 리듬, 손 릴리즈와 다음 그립 사이의 글라이드.',
      },
      {
        id: 'legs',
        label: '다리 자세',
        criteria: '다리가 모아져서 일직선을 유지하는지, 무릎이 구부러지거나 발이 벌어지는 등의 비효율.',
      },
      {
        id: 'relax',
        label: '이완',
        criteria: '어깨와 목의 긴장 최소화, 부드러운 동작, 프리폴 구간에서의 완전한 이완.',
      },
    ],
  },

  // DYN, STA는 이후 단계에서 추가
};

// 루브릭이 존재하는 종목인지 확인
export function hasRubric(discipline: DisciplineId): boolean {
  return discipline in RUBRICS;
}

// 루브릭 조회 (없으면 undefined)
export function getRubric(discipline: DisciplineId): Rubric | undefined {
  return RUBRICS[discipline];
}
