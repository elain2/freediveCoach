// SERVER ONLY. Never import from client code — this is the coaching moat.

export type DisciplineId = 'CWT' | 'CNF' | 'FIM' | 'DYN' | 'STA';

export interface RubricCategory {
  id: string;
  label: string;
  criteria: string;
}

export interface Rubric {
  id: DisciplineId;
  label: string;
  context: string;
  categories: RubricCategory[];
}

export const RUBRICS: Partial<Record<DisciplineId, Rubric>> = {
  CWT: {
    id: 'CWT',
    label: '콘스턴트 웨이트 (CWT)',
    context:
      'AIDA 기준 핀 착용 수직 다이빙. 프레임에서 실제로 보이는 것만 근거로 삼고, 이퀄라이징·컨트랙션·내성처럼 영상으로 판단 불가한 것은 점수에 반영하지 말고 평가에서 뺀다.',
    categories: [
      {
        id: 'streamline',
        label: '유선형',
        criteria:
          '머리 중립(턱 살짝 당김), 양팔을 뻗어 상완이 귀를 감싸는지, 몸이 일직선인지, 불필요한 아치나 꺾임.',
      },
      {
        id: 'finning',
        label: '핀 킥',
        criteria:
          '고관절에서 시작하는 길고 부드러운 킥 vs 무릎 위주 자전거 킥, 발목 신전(포인 발), 진폭·리듬, 좌우 대칭.',
      },
      {
        id: 'entry',
        label: '입수·자세',
        criteria: '덕다이브의 몸 접기와 다리 수직 정렬, 또는 하강/프리폴 자세와 라인 정렬.',
      },
      {
        id: 'relax',
        label: '이완',
        criteria: '어깨·목·손·얼굴의 긴장 신호와 전반적인 평온함.',
      },
    ],
  },
  FIM: {
    id: 'FIM',
    label: '프리 이머전 (FIM)',
    context:
      'AIDA 기준 로프를 잡고 당겨서 하강·상승하는 수직 다이빙. 핀을 사용하지 않음. 프레임에서 실제로 보이는 것만 근거로 삼고, 이퀄라이징·컨트랙션·내성처럼 영상으로 판단 불가한 것은 점수에 반영하지 말고 평가에서 뺀다.',
    categories: [
      {
        id: 'streamline',
        label: '유선형',
        criteria:
          '머리 중립(턱 살짝 당김), 몸이 로프와 일직선인지, 다리가 정렬되어 있는지, 불필요한 아치나 꺾임.',
      },
      {
        id: 'pulling',
        label: '풀링 테크닉',
        criteria:
          '한 손씩 번갈아 당기는 리듬과 효율, 팔 동작의 부드러움, 로프를 놓는 타이밍, 몸 흔들림 최소화.',
      },
      {
        id: 'entry',
        label: '입수·자세',
        criteria: '덕다이브의 몸 접기와 다리 수직 정렬, 로프를 잡는 첫 동작의 매끄러움.',
      },
      {
        id: 'legs',
        label: '다리 자세',
        criteria: '다리가 모여 있고 발끝이 펴져 있는지, 불필요한 킥이나 움직임 없이 안정적인지.',
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
    context:
      'AIDA 기준 핀 없이 맨발로 수영하는 수직 다이빙. 프레임에서 실제로 보이는 것만 근거로 삼고, 이퀄라이징·컨트랙션·내성처럼 영상으로 판단 불가한 것은 점수에 반영하지 말고 평가에서 뺀다.',
    categories: [
      {
        id: 'streamline',
        label: '유선형',
        criteria:
          '머리 중립(턱 살짝 당김), 양팔을 뻗어 상완이 귀를 감싸는지, 몸이 일직선인지, 불필요한 아치나 꺾임.',
      },
      {
        id: 'kick',
        label: '킥',
        criteria:
          '평영 킥(브레스트 킥) 또는 돌핀 킥의 효율성, 무릎 굽힘 각도, 발목 유연성, 추진력 대비 에너지 소모.',
      },
      {
        id: 'stroke',
        label: '스트로크',
        criteria:
          '팔 동작의 타이밍과 효율, 물 잡기(캐치)의 정확성, 리커버리 동작의 매끄러움, 킥과의 조화.',
      },
      {
        id: 'entry',
        label: '입수·자세',
        criteria: '덕다이브의 몸 접기와 다리 수직 정렬, 하강 시작 자세.',
      },
      {
        id: 'relax',
        label: '이완',
        criteria: '어깨·목·손·얼굴의 긴장 신호와 전반적인 평온함.',
      },
    ],
  },
};
