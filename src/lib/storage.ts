// src/lib/storage.ts
// IndexedDB 저장소 (Dexie 래퍼)

import Dexie, { type EntityTable } from 'dexie';
import type { Session, DisciplineId } from '../../shared/types';

// Dexie 데이터베이스 정의
const db = new Dexie('DescentDB') as Dexie & {
  sessions: EntityTable<Session, 'id'>;
};

// 스키마 정의
db.version(1).stores({
  sessions: 'id, createdAt, discipline, mode',
});

/**
 * 세션 저장
 */
export async function saveSession(session: Session): Promise<void> {
  await db.sessions.put(session);
}

/**
 * 세션 조회
 */
export async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id);
}

/**
 * 모든 세션 조회 (최신순)
 */
export async function getAllSessions(): Promise<Session[]> {
  return db.sessions.orderBy('createdAt').reverse().toArray();
}

/**
 * 종목별 세션 조회 (최신순)
 */
export async function getSessionsByDiscipline(discipline: DisciplineId): Promise<Session[]> {
  return db.sessions
    .where('discipline')
    .equals(discipline)
    .reverse()
    .sortBy('createdAt');
}

/**
 * 세션 삭제
 */
export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}

/**
 * 모든 세션 삭제
 */
export async function clearAllSessions(): Promise<void> {
  await db.sessions.clear();
}

/**
 * 세션 개수 조회
 */
export async function getSessionCount(): Promise<number> {
  return db.sessions.count();
}

/**
 * UUID 생성
 */
export function generateId(): string {
  return crypto.randomUUID();
}
