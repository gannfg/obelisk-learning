const XP_KEY = "obelisk_xp_total";

export function getTotalXP(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(XP_KEY);
  return raw ? Number.parseInt(raw, 10) || 0 : 0;
}

export function setTotalXP(xp: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(XP_KEY, String(Math.max(0, xp)));
}

export function addXP(amount: number): number {
  const current = getTotalXP();
  const next = current + amount;
  setTotalXP(next);
  return next;
}

export function getLevel(totalXP: number = getTotalXP()): number {
  return Math.floor(totalXP / 500) + 1;
}

export function getNextLevelXP(level: number): number {
  return (level - 1 + 1) * 500;
}

export function getProgressToNextLevel(totalXP: number = getTotalXP()) {
  const level = getLevel(totalXP);
  const currentLevelBase = (level - 1) * 500;
  const nextLevelBase = level * 500;
  const current = totalXP - currentLevelBase;
  const needed = nextLevelBase - currentLevelBase;
  const progress = needed > 0 ? current / needed : 1;

  return {
    level,
    totalXP,
    currentInLevel: current,
    neededForNext: needed,
    progress: Math.max(0, Math.min(1, progress)),
  };
}


