"use client";

import { useEffect, useState } from "react";
import { getProgressToNextLevel, getTotalXP } from "@/lib/xp";

export function XPBar() {
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    setTotalXP(getTotalXP());
  }, []);

  const { level, progress, currentInLevel, neededForNext } = getProgressToNextLevel(totalXP);

  return (
    <div className="w-full rounded-xl border border-zinc-800/60 bg-zinc-950/60 px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
          Level {level}
        </span>
        <div className="h-2.5 w-40 sm:w-56 rounded-full bg-zinc-900 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(5, progress * 100)}%` }}
          />
        </div>
        <span className="text-[10px] text-zinc-400">
          {currentInLevel} / {neededForNext} XP to next level
        </span>
      </div>
      <div className="ml-auto text-right">
        <span className="text-xs text-zinc-400">Total XP</span>
        <div className="text-sm font-semibold text-zinc-100">{totalXP}</div>
      </div>
    </div>
  );
}


