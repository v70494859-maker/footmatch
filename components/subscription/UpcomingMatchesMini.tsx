"use client";

import Link from "next/link";
import type { Match } from "@/types";
import { formatTime, formatTerrainType, formatSpots } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface UpcomingMatchesMiniProps {
  matches: Match[];
  chatCounts?: Record<string, number>;
}

function getCountdownLabel(dateStr: string, todayLabel: string, tomorrowLabel: string): { text: string; urgent: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const matchDate = new Date(dateStr + "T00:00:00");
  matchDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (matchDate.getTime() - today.getTime()) / 86400000
  );

  if (diffDays === 0) return { text: todayLabel, urgent: true };
  if (diffDays === 1) return { text: tomorrowLabel, urgent: true };
  if (diffDays <= 3) return { text: `J-${diffDays}`, urgent: true };
  return { text: `J-${diffDays}`, urgent: false };
}

export default function UpcomingMatchesMini({
  matches,
  chatCounts,
}: UpcomingMatchesMiniProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-surface-800 bg-surface-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {t.subscription.upcomingMatches}
        </h3>
        {matches.length > 0 && (
          <Link
            href="/my-matches"
            className="text-xs text-pitch-400 hover:text-pitch-300 font-medium"
          >
            {t.common.viewAll}
          </Link>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-surface-400 mb-3">
            {t.subscription.noRecentResults}
          </p>
          <Link
            href="/matches"
            className="text-sm text-pitch-400 hover:text-pitch-300 font-medium"
          >
            {t.subscription.findMatch}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const countdown = getCountdownLabel(match.date, t.common.today, t.common.tomorrow);
            const fillPercent =
              match.capacity > 0
                ? Math.min(
                    (match.registered_count / match.capacity) * 100,
                    100
                  )
                : 0;
            const isFull = match.registered_count >= match.capacity;
            const chatCount = chatCounts?.[match.id] ?? 0;

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="block rounded-xl bg-surface-800/50 px-4 py-3 hover:bg-surface-800 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Date badge */}
                  <div className="shrink-0 text-center min-w-[3rem]">
                    <p className="text-xs font-semibold text-pitch-400 uppercase">
                      {new Date(match.date + "T00:00:00").toLocaleDateString(
                        "fr-FR",
                        { weekday: "short" }
                      )}
                    </p>
                    <p className="text-lg font-bold text-foreground leading-tight">
                      {new Date(match.date + "T00:00:00").getDate()}
                    </p>
                    <p className="text-[10px] text-surface-400 uppercase">
                      {new Date(match.date + "T00:00:00").toLocaleDateString(
                        "fr-FR",
                        { month: "short" }
                      )}
                    </p>
                  </div>

                  {/* Match info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {match.title}
                      </p>
                      {/* Countdown badge */}
                      <span
                        className={`shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                          countdown.urgent
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-surface-700 text-surface-400"
                        }`}
                      >
                        {countdown.text}
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 truncate mt-0.5">
                      {match.venue_name} — {match.city}
                    </p>

                    {/* Bottom row: time + terrain + chat + spots */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-surface-500">
                        {formatTime(match.start_time)}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-700 text-surface-300 rounded-full px-2 py-0.5">
                        {formatTerrainType(match.terrain_type)}
                      </span>
                      {chatCount > 0 && (
                        <span className="text-[10px] font-medium bg-surface-700 text-surface-300 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                            />
                          </svg>
                          {chatCount}
                        </span>
                      )}
                      <span className="text-[10px] text-surface-500 ml-auto">
                        {formatSpots(match.registered_count, match.capacity)}
                      </span>
                    </div>

                    {/* Fill bar */}
                    <div className="mt-2">
                      <div className="w-full h-1 bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFull ? "bg-amber-500" : "bg-pitch-400"
                          }`}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
