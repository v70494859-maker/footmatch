"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

interface StreakDisplayProps {
  currentStreak: number;
  bestStreak: number;
  citiesPlayed: string[];
}

export default function StreakDisplay({ currentStreak, bestStreak, citiesPlayed }: StreakDisplayProps) {
  const { t } = useTranslation();

  const stats = [
    {
      value: currentStreak,
      label: t.gamification.currentStreak,
      suffix: currentStreak > 0 ? " \uD83D\uDD25" : "",
      sublabel: t.gamification.weeksInARow,
    },
    {
      value: bestStreak,
      label: t.gamification.bestStreak,
      suffix: "",
      sublabel: t.gamification.weeksInARow,
    },
    {
      value: citiesPlayed.length,
      label: t.gamification.citiesPlayed,
      suffix: "",
      sublabel: null,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-surface-800 bg-surface-900 p-3 text-center"
        >
          <p className="text-xl font-bold text-foreground">
            {stat.value}{stat.suffix}
          </p>
          <p className="text-xs font-medium text-surface-300 mt-1">
            {stat.label}
          </p>
          {stat.sublabel && (
            <p className="text-[10px] text-surface-500 mt-0.5">
              {stat.sublabel}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
