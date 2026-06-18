// src/lib/api.ts
// API 클라이언트

import type { AnalyzeRequest, AnalyzeResponse, AnalyzeErrorResponse } from '../../shared/types';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * 프레임 분석 요청
 */
export async function analyzeFrames(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as AnalyzeErrorResponse;
    throw new ApiError(errorData.error || '분석 중 오류가 발생했습니다', response.status);
  }

  return data as AnalyzeResponse;
}
