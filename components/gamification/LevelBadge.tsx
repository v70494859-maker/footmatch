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
    return "bg-gradient-to-br from-amber-500 to-red-500 text-white";
  }
  if (level >= 6) {
    return "bg-amber-500 text-surface-950";
  }
  if (level >= 4) {
    return "bg-pitch-500 text-white";
  }
  return "bg-surface-600 text-surface-100";
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
