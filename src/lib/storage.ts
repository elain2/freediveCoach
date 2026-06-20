import Dexie, { type Table } from 'dexie';
import type { Session } from './types';

class DescentDB extends Dexie {
  sessions!: Table<Session, string>;
  constructor() {
    super('descent');
    this.version(1).stores({ sessions: 'id, createdAt, discipline' });
  }
}

const db = new DescentDB();

export async function saveSession(s: Session): Promise<void> {
  await db.sessions.put(s);
}

export async function listSessions(): Promise<Session[]> {
  return db.sessions.orderBy('createdAt').reverse().toArray();
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}
