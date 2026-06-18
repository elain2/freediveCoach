// src/disciplines.ts
// 클라이언트용 종목 정보 (id + label만, criteria는 서버에만)

import type { DisciplineId } from '../shared/types';

export interface DisciplineInfo {
  id: DisciplineId;
  label: string;
  description: string;
  available: boolean;  // 현재 사용 가능 여부
}

export const DISCIPLINES: DisciplineInfo[] = [
  {
    id: 'CWT',
    label: '콘스턴트 웨이트',
    description: '핀을 착용하고 수직으로 하강하는 종목',
    available: true,
  },
  {
    id: 'CNF',
    label: '콘스턴트 노핀',
    description: '핀 없이 맨몸으로 하강하는 종목',
    available: true,
  },
  {
    id: 'FIM',
    label: '프리 이머젼',
    description: '로프를 잡고 팔로 당기며 하강하는 종목',
    available: true,
  },
  {
    id: 'DYN',
    label: '다이나믹',
    description: '수평으로 거리를 이동하는 종목',
    available: false,
  },
  {
    id: 'STA',
    label: '스태틱',
    description: '수면에서 숨 참기 종목',
    available: false,
  },
];

// 사용 가능한 종목만 필터링
export const AVAILABLE_DISCIPLINES = DISCIPLINES.filter(d => d.available);

// ID로 종목 정보 조회
export function getDiscipline(id: DisciplineId): DisciplineInfo | undefined {
  return DISCIPLINES.find(d => d.id === id);
}
