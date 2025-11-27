"use client";

import { GamifiedMission } from "@/data/missions";
import { Lock, Trophy } from "lucide-react";
import Link from "next/link";
import { getTotalXP, getLevel } from "@/lib/xp";

interface MissionCardGamifiedProps {
  mission: GamifiedMission;
  completed?: boolean;
}

export function MissionCardGamified({ mission, completed }: MissionCardGamifiedProps) {
  const totalXP = typeof window !== "undefined" ? getTotalXP() : 0;
  const level = getLevel(totalXP);
  const isLocked = level < mission.levelRequirement;

  const difficultyColor =
    mission.difficulty === "Easy"
      ? "from-emerald-500/80 to-emerald-400/60"
      : mission.difficulty === "Normal"
      ? "from-sky-500/80 to-sky-400/60"
      : mission.difficulty === "Hard"
      ? "from-amber-500/80 to-amber-400/60"
      : "from-rose-500/90 to-fuchsia-500/80";

  const baseCard = (
    <div
      className={`relative h-full rounded-2xl border border-zinc-800/80 bg-zinc-950/80 overflow-hidden cursor-pointer group transition-transform duration-300 ease-out ${
        isLocked ? "grayscale opacity-70" : "hover:scale-[1.03] hover:rotate-[0.5deg]"
      }`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -inset-32 bg-[conic-gradient(at_top,_rgba(56,189,248,0.2),_rgba(244,114,182,0.05),_transparent)] opacity-0 group-hover:opacity-80 transition-opacity duration-500" />
      </div>

      <div className="relative p-4 sm:p-5 flex flex-col gap-3 min-h-[180px]">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-xs font-semibold text-slate-50 shadow-lg shadow-black/40">
            {mission.xp} XP
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-50 leading-tight">
              {mission.title}
            </h3>
            <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{mission.description}</p>
          </div>
          {completed && (
            <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
              <Trophy className="h-3.5 w-3.5" />
              DONE
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-zinc-900/70 px-2 py-1 text-[11px] text-zinc-300">
            {mission.category}
          </span>
          <span
            className={`inline-flex items-center rounded-full bg-gradient-to-r ${difficultyColor} px-2 py-1 text-[11px] text-slate-50 shadow-md shadow-black/40`}
          >
            {mission.difficulty}
          </span>
        </div>

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-100">
              <Lock className="h-4 w-4" />
              Requires level {mission.levelRequirement}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isLocked) {
    return baseCard;
  }

  return (
    <Link href={`/missions/${mission.id}`} className="block">
      {baseCard}
    </Link>
  );
}


