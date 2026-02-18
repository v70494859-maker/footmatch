"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

function getLevelStyle(level: number): string {
  if (level >= 8) {
    return "bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-600 text-surface-950 shadow-lg shadow-amber-500/25";
  }
  if (level >= 6) {
    return "bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 text-surface-950 shadow-md shadow-amber-500/20";
  }
  if (level >= 4) {
    return "bg-gradient-to-br from-surface-300 via-surface-200 to-surface-400 text-surface-900 shadow-md shadow-surface-300/20";
  }
  return "bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 text-amber-100";
}

export default function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  const { t } = useTranslation();
  const levelName = t.gamification.levels[level] ?? "";

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <div
        className={`${sizeClasses[size]} ${getLevelStyle(level)} rounded-full font-bold flex items-center justify-center shrink-0`}
      >
        {level}
      </div>
      {size === "lg" && levelName && (
        <span className="text-[10px] font-medium text-surface-400 leading-tight text-center">
          {levelName}
        </span>
      )}
    </div>
  );
}
