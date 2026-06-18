// shared/types.ts
// 클라이언트와 서버 모두에서 사용하는 타입 정의

export type DisciplineId = 'CWT' | 'CNF' | 'FIM' | 'DYN' | 'STA';

export type AnalysisMode = 'overview' | 'segment';

export interface Segment {
  startSec: number;
  endSec: number;
}

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
  mode: AnalysisMode;
  segment?: Segment;     // mode==='segment'일 때만
  videoName: string;
  durationSec: number;   // 원본 영상 길이
  frameCount: number;    // 실제 추출한 장수
  thumbnail?: string;    // base64 썸네일 1장 (목록용)
  result: AnalysisResult;
}

// API 요청/응답 타입
export interface AnalyzeRequest {
  discipline: DisciplineId;
  mode: AnalysisMode;
  segment?: Segment;
  frames: string[];  // base64 JPEG 배열
}

export interface AnalyzeResponse {
  overall: string;
  categories: CategoryResult[];
  hook: string;
}

export interface AnalyzeErrorResponse {
  error: string;
}
