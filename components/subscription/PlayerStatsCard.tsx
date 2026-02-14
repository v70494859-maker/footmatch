"use client";

import type { PlayerCareerStats } from "@/types";
import { formatAttendanceRate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface PlayerStatsCardProps {
  stats: PlayerCareerStats | null;
}

export default function PlayerStatsCard({ stats }: PlayerStatsCardProps) {
  const { t } = useTranslation();

  if (!stats || stats.total_matches === 0) {
    return (
      <div className="rounded-2xl border border-surface-800 bg-surface-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-800 mb-3">
            <svg
              className="w-6 h-6 text-surface-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </div>
          <p className="text-sm text-surface-400">
            {t.subscription.playFirstMatch}
          </p>
        </div>
      </div>
    );
  }

  const winRate =
    stats.total_matches > 0
      ? Math.round((stats.win_count / stats.total_matches) * 100)
      : 0;

  const totalWDL = stats.win_count + stats.draw_count + stats.loss_count;
  const winPct = totalWDL > 0 ? (stats.win_count / totalWDL) * 100 : 0;
  const drawPct = totalWDL > 0 ? (stats.draw_count / totalWDL) * 100 : 0;
  const lossPct = totalWDL > 0 ? (stats.loss_count / totalWDL) * 100 : 0;

  const statItems = [
    { label: t.common.goals, value: stats.total_goals },
    { label: t.common.assists, value: stats.total_assists },
    { label: t.common.mvp, value: stats.total_mvp },
    { label: t.common.wins, value: `${winRate}%` },
    { label: t.reliability.presence, value: formatAttendanceRate(stats.attendance_rate) },
    { label: t.reliability.lateCancels, value: stats.late_cancel_count ?? 0 },
    { label: t.reliability.noShow, value: stats.no_show_count ?? 0 },
    { label: t.common.matches, value: stats.total_matches },
  ];

  return (
    <div className="rounded-2xl border border-surface-800 bg-surface-900 p-6">
      <h3 className="text-sm font-semibold text-foreground mb-5">
        {t.subscription.yourStats}
      </h3>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs text-surface-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* W/D/L stacked bar */}
      {totalWDL > 0 && (
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pitch-400" />
                <span className="text-surface-400">{t.common.win} {stats.win_count}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-surface-500" />
                <span className="text-surface-400">{t.common.drawAbbr} {stats.draw_count}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-surface-400">{t.common.loss} {stats.loss_count}</span>
              </span>
            </div>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {winPct > 0 && (
              <div
                className="bg-pitch-400 rounded-full transition-all duration-500"
                style={{ width: `${winPct}%` }}
              />
            )}
            {drawPct > 0 && (
              <div
                className="bg-surface-500 rounded-full transition-all duration-500"
                style={{ width: `${drawPct}%` }}
              />
            )}
            {lossPct > 0 && (
              <div
                className="bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${lossPct}%` }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
