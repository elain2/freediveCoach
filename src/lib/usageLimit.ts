const STORAGE_KEY = 'descent_usage';
const FREE_LIMIT = 2;

interface UsageData {
  date: string;
  count: number;
  unlocked: boolean; // 후원 후 당일 무제한
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): UsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today(), count: 0, unlocked: false };
    const data = JSON.parse(raw) as UsageData;
    // 날짜 바뀌면 리셋
    if (data.date !== today()) {
      return { date: today(), count: 0, unlocked: false };
    }
    return data;
  } catch {
    return { date: today(), count: 0, unlocked: false };
  }
}

function save(data: UsageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getUsage(): { count: number; limit: number; remaining: number; unlocked: boolean } {
  const data = load();
  return {
    count: data.count,
    limit: FREE_LIMIT,
    remaining: data.unlocked ? Infinity : Math.max(0, FREE_LIMIT - data.count),
    unlocked: data.unlocked,
  };
}

export function canAnalyze(): boolean {
  const { remaining, unlocked } = getUsage();
  return unlocked || remaining > 0;
}

export function incrementUsage(): void {
  const data = load();
  data.count += 1;
  save(data);
}

export function unlockToday(): void {
  const data = load();
  data.unlocked = true;
  save(data);
}
