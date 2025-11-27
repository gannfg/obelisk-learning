const STREAK_KEY = "obelisk_streak_v1";

export type StreakState = {
  count: number;
  updatedAt: string;
};

function getNow(): Date {
  return new Date();
}

export function getStreak(): StreakState {
  if (typeof window === "undefined") return { count: 0, updatedAt: getNow().toISOString() };
  const raw = window.localStorage.getItem(STREAK_KEY);
  if (!raw) return { count: 0, updatedAt: getNow().toISOString() };
  try {
    const parsed = JSON.parse(raw) as StreakState;
    return parsed;
  } catch {
    return { count: 0, updatedAt: getNow().toISOString() };
  }
}

export function updateStreak(): StreakState {
  const previous = getStreak();
  const now = getNow();

  const last = new Date(previous.updatedAt);
  const diffMs = now.getTime() - last.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  let nextCount = previous.count;

  if (diffHours >= 48) {
    // streak broken
    nextCount = 1;
  } else if (diffHours >= 24) {
    // new day, increment
    nextCount = previous.count + 1 || 1;
  } else if (previous.count === 0) {
    nextCount = 1;
  }

  const next: StreakState = {
    count: nextCount,
    updatedAt: now.toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  }

  return next;
}


