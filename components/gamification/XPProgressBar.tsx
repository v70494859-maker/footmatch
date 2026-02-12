"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";
import { computeLevel, LEVELS } from "@/lib/gamification/constants";

interface XPProgressBarProps {
  totalXp: number;
  showDetails?: boolean;
}

export default function XPProgressBar({ totalXp, showDetails = false }: XPProgressBarProps) {
  const { t } = useTranslation();
  const { level, progress, currentLevelXp, nextLevelXp } = computeLevel(totalXp);

  const currentLevelName = t.gamification.levels[level] ?? "";
  const nextLevel = LEVELS.find((l) => l.level === level + 1);
  const nextLevelName = nextLevel ? (t.gamification.levels[level + 1] ?? "") : null;

  const xpIntoLevel = totalXp - currentLevelXp;
  const xpNeeded = nextLevelXp !== null ? nextLevelXp - currentLevelXp : 0;
  const isMaxLevel = nextLevelXp === null;
  const progressPct = Math.round(progress * 100);

  return (
    <div className="w-full">
      {showDetails && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-surface-300">
            {currentLevelName}
          </span>
          {nextLevelName && (
            <span className="text-xs text-surface-500">
              {nextLevelName}
            </span>
          )}
        </div>
      )}

      <div className="h-2 w-full rounded-full bg-surface-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-pitch-400 transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {showDetails && (
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-surface-400">
            {isMaxLevel
              ? `${totalXp.toLocaleString()} ${t.gamification.xp}`
              : `${xpIntoLevel.toLocaleString()} / ${xpNeeded.toLocaleString()} ${t.gamification.xp}`}
          </span>
          <span className="text-xs font-medium text-pitch-400">
            {progressPct}%
          </span>
        </div>
      )}
    </div>
  );
}
