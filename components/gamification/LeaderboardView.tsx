"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
} from "@/lib/gamification/leaderboard";
import PodiumDisplay from "@/components/gamification/PodiumDisplay";
import LeaderboardRow from "@/components/gamification/LeaderboardRow";

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
  currentUserRank: { rank: number; total: number } | null;
  period: LeaderboardPeriod;
  cities: string[];
}

const PERIODS: LeaderboardPeriod[] = ["weekly", "monthly", "all_time"];

export default function LeaderboardView({
  entries,
  currentUserId,
  currentUserRank,
  period,
  cities,
}: LeaderboardViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCity = searchParams.get("city") ?? "";

  const navigate = useCallback(
    (newPeriod: LeaderboardPeriod, newCity: string) => {
      const params = new URLSearchParams();
      if (newPeriod !== "weekly") params.set("period", newPeriod);
      if (newCity) params.set("city", newCity);
      const qs = params.toString();
      router.push(`/leaderboard${qs ? `?${qs}` : ""}`);
    },
    [router]
  );

  const periodLabels: Record<LeaderboardPeriod, string> = {
    weekly: t.gamification.weekly,
    monthly: t.gamification.monthly,
    all_time: t.gamification.allTime,
  };

  const podiumEntries = entries.slice(0, 3);
  const listEntries = entries.slice(3);
  const isUserInTop50 = entries.some((e) => e.userId === currentUserId);

  return (
    <div className="pb-24 lg:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <svg
            className="w-6 h-6 text-pitch-400 shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7.5 21H2V9l4-4 3.5 3V2h5v6L18 5l4 4v12h-5.5v-4h-2v4h-2v-4h-2v4H7.5z" />
          </svg>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t.gamification.leaderboard}
            </h1>
            <p className="text-sm text-surface-400">
              {t.gamification.top50}
            </p>
          </div>
        </div>

        {/* Period toggle */}
        <div className="flex gap-1 p-1 bg-surface-900 rounded-xl border border-surface-800 mb-4">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => navigate(p, currentCity)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-pitch-400/15 text-pitch-400"
                  : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* City filter */}
        {cities.length > 0 && (
          <div className="mb-6">
            <select
              value={currentCity}
              onChange={(e) => navigate(period, e.target.value)}
              className="w-full appearance-none bg-surface-900 border border-surface-800 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-pitch-400/50 focus:ring-1 focus:ring-pitch-400/30 transition-colors cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option value="">{t.gamification.allCities}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        {entries.length === 0 ? (
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-10 text-center mt-4">
            <svg
              className="w-12 h-12 mx-auto text-surface-700 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-surface-400">
              {t.gamification.noRankYet}
            </p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {podiumEntries.length > 0 && (
              <div className="bg-surface-900 rounded-2xl border border-surface-800 p-4 sm:p-6">
                <PodiumDisplay entries={podiumEntries} />
              </div>
            )}

            {/* Remaining entries (ranks 4-50) */}
            {listEntries.length > 0 && (
              <div className="mt-4 bg-surface-900 rounded-2xl border border-surface-800 p-2 sm:p-3">
                <div className="divide-y divide-surface-800/50">
                  {listEntries.map((entry) => (
                    <div key={entry.userId} className="py-0.5">
                      <LeaderboardRow
                        entry={entry}
                        isCurrentUser={entry.userId === currentUserId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky footer for user rank if not in top 50 */}
      {currentUserRank && !isUserInTop50 && (
        <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40">
          <div className="max-w-2xl mx-auto px-4 pb-3">
            <div className="bg-surface-900/95 backdrop-blur-sm border border-pitch-400/20 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg shadow-black/30">
              <span className="text-sm font-medium text-surface-400">
                {t.gamification.yourRank}
              </span>
              <span className="text-lg font-bold text-pitch-400">
                #{currentUserRank.rank}
              </span>
              <span className="text-xs text-surface-500">
                / {currentUserRank.total}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
