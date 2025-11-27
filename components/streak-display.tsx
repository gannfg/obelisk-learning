"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { StreakState, updateStreak } from "@/lib/streak";

export function StreakDisplay() {
  const [streak, setStreak] = useState<StreakState | null>(null);

  useEffect(() => {
    // touch streak whenever the board loads
    const next = updateStreak();
    setStreak(next);
  }, []);

  if (!streak) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 px-2 py-1">
      <Flame className="h-3.5 w-3.5 text-amber-400" />
      <span className="text-[11px] font-medium text-amber-50">
        {streak.count} day{streak.count === 1 ? "" : "s"} streak
      </span>
    </div>
  );
}


