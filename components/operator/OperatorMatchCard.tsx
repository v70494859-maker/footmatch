"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { Match, MatchStatus, TerrainType } from "@/types";
import { MATCH_STATUS_LABELS, TERRAIN_TYPE_LABELS } from "@/types";
import {
  formatDate,
  formatTime,
  formatDuration,
  formatSpots,
} from "@/lib/format";

interface OperatorMatchCardProps {
  match: Match;
}

const STATUS_STYLES: Record<MatchStatus, string> = {
  upcoming: "bg-pitch-500/10 text-pitch-400 ring-pitch-500/20",
  full: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  completed: "bg-surface-600/20 text-surface-400 ring-surface-600/20",
  canceled: "bg-danger-500/10 text-danger-500 ring-danger-500/20",
};

const TERRAIN_STYLES: Record<TerrainType, string> = {
  indoor: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  outdoor: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  covered: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
};

function getMatchFormat(capacity: number): string {
  const perTeam = Math.round(capacity / 2);
  return `${perTeam}v${perTeam}`;
}

export default function OperatorMatchCard({ match }: OperatorMatchCardProps) {
  const { t } = useTranslation();
  const fillPercent = match.capacity > 0
    ? Math.min(Math.round((match.registered_count / match.capacity) * 100), 100)
    : 0;
  const isAlmostFull = fillPercent > 80 && match.status !== "full" && match.status !== "canceled";
  const isFull = match.registered_count >= match.capacity;

  return (
    <Link
      href={`/operator/matches/${match.id}`}
      className="block bg-surface-900 rounded-2xl border border-surface-800 p-5 hover:border-surface-700 hover:bg-surface-900/80 transition-all duration-200 group"
    >
      {/* Title */}
      <h3 className="text-[15px] font-semibold text-foreground line-clamp-1 group-hover:text-pitch-400 transition-colors">
        {match.title}
      </h3>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        {/* Status badge */}
        <span
          className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-0.5 ring-1 ring-inset ${STATUS_STYLES[match.status]}`}
        >
          {MATCH_STATUS_LABELS[match.status]}
        </span>

        {/* Terrain type badge */}
        <span
          className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-0.5 ring-1 ring-inset ${TERRAIN_STYLES[match.terrain_type]}`}
        >
          {TERRAIN_TYPE_LABELS[match.terrain_type]}
        </span>

        {/* Format badge */}
        <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-surface-800/60 text-surface-300 ring-1 ring-inset ring-surface-700/40">
          {getMatchFormat(match.capacity)}
        </span>

        {/* Almost full badge */}
        {isAlmostFull && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20 animate-pulse">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {t.common.almostFull}
          </span>
        )}
      </div>

      {/* Date / time / duration row */}
      <div className="flex items-center gap-2 mt-3.5">
        <svg
          className="w-4 h-4 text-surface-500 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
        <span className="text-sm">
          <span className="text-foreground font-medium">{formatDate(match.date)}</span>
          <span className="text-surface-500 mx-1.5">&middot;</span>
          <span className="text-surface-400">{formatTime(match.start_time)}</span>
          <span className="text-surface-500 mx-1.5">&middot;</span>
          <span className="text-surface-400">{formatDuration(match.duration_minutes)}</span>
        </span>
      </div>

      {/* Location block */}
      <div className="mt-3 rounded-xl bg-surface-800/40 px-3.5 py-2.5">
        <div className="flex items-start gap-2.5">
          <svg
            className="w-4 h-4 text-pitch-400 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {match.city}
            </p>
            <p className="text-xs text-surface-400 truncate mt-0.5">
              {match.venue_name}
            </p>
            <p className="text-xs text-surface-500 truncate mt-0.5">
              {match.venue_address}
            </p>
          </div>
        </div>
      </div>

      {/* Description preview */}
      {match.description && (
        <p className="text-xs text-surface-400 line-clamp-1 mt-2.5 leading-relaxed">
          {match.description}
        </p>
      )}

      {/* Spots section */}
      <div className="mt-3.5 pt-3.5 border-t border-surface-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-surface-400">
            Inscrits : <span className="text-foreground font-medium">{formatSpots(match.registered_count, match.capacity)}</span>
          </span>
          <span
            className={`text-xs font-semibold tabular-nums ${
              isFull
                ? "text-amber-500"
                : fillPercent > 80
                  ? "text-amber-400"
                  : "text-pitch-400"
            }`}
          >
            {fillPercent}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isFull
                ? "bg-amber-500"
                : fillPercent > 80
                  ? "bg-gradient-to-r from-amber-500/80 to-amber-500"
                  : "bg-gradient-to-r from-pitch-500/80 to-pitch-400"
            }`}
            style={{
              width: `${fillPercent}%`,
            }}
          />
        </div>
      </div>
    </Link>
  );
}
