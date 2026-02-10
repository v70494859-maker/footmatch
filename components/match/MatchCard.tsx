"use client";

import Link from "next/link";
import type { MatchWithOperator } from "@/types";
import { MATCH_STATUS_LABELS, MATCH_STATUS_STYLES } from "@/types";
import {
  formatDate,
  formatTime,
  formatDuration,
  formatSpots,
  formatTerrainType,
} from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import MatchCountdown from "@/components/match/MatchCountdown";

interface MatchCardProps {
  match: MatchWithOperator;
  distance?: number | null;
  isRegistered?: boolean;
  chatCount?: number;
}

export default function MatchCard({ match, distance, isRegistered, chatCount }: MatchCardProps) {
  const { t } = useTranslation();
  const spotsLeft = match.capacity - match.registered_count;
  const fillPercent =
    match.capacity > 0
      ? Math.min((match.registered_count / match.capacity) * 100, 100)
      : 0;
  const isFull = spotsLeft <= 0;
  const isAlmostFull = !isFull && fillPercent >= 80;
  const operatorName =
    match.operator?.profile?.first_name ?? "Organisateur";
  const operatorAvatar = match.operator?.profile?.avatar_url;
  const operatorRating = match.operator?.rating ?? 0;
  const operatorMatches = match.operator?.total_matches ?? 0;

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`block bg-surface-900 rounded-2xl border p-4 hover:border-surface-700 transition-colors group ${
        isRegistered ? "border-pitch-500/30" : "border-surface-800"
      }`}
    >
      {/* Top row: badges + countdown */}
      <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
        {isRegistered && (
          <span className="text-[10px] font-semibold bg-pitch-500/15 text-pitch-400 rounded-full px-2 py-0.5">
            {t.common.registered}
          </span>
        )}
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${MATCH_STATUS_STYLES[match.status]}`}
        >
          {MATCH_STATUS_LABELS[match.status]}
        </span>
        {isAlmostFull && (
          <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-500 rounded-full px-2 py-0.5">
            {t.common.almostFull}
          </span>
        )}
        {chatCount != null && chatCount > 0 && (
          <span className="text-[10px] font-medium bg-surface-800 text-surface-300 rounded-full px-2 py-0.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {chatCount}
          </span>
        )}
        {/* Inline countdown */}
        <span className="ml-auto">
          <MatchCountdown matchDate={match.date} matchTime={match.start_time} />
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground line-clamp-1">
        {match.title}
      </h3>

      {/* Date + time + duration */}
      <div className="flex items-center gap-1.5 mt-2">
        <svg
          className="w-3.5 h-3.5 text-surface-500 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-xs text-surface-400">
          {formatDate(match.date)} &middot; {formatTime(match.start_time)} &middot;{" "}
          {formatDuration(match.duration_minutes)}
        </span>
      </div>

      {/* Location block: city + distance + venue + address */}
      <div className="mt-2 rounded-lg bg-surface-800/40 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-pitch-400 shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          <span className="text-xs font-medium text-foreground">
            {match.city}
          </span>
          {distance != null && (
            <span className="text-[10px] font-bold text-pitch-400 ml-auto">
              {formatDistance(distance)}
            </span>
          )}
        </div>
        <p className="text-[11px] text-surface-400 mt-0.5 ml-5 line-clamp-1">
          {match.venue_name}
          {match.venue_address && (
            <span className="text-surface-500"> &middot; {match.venue_address}</span>
          )}
        </p>
      </div>

      {/* Description preview */}
      {match.description && (
        <p className="text-[11px] text-surface-500 mt-2 line-clamp-2 leading-relaxed">
          {match.description}
        </p>
      )}

      {/* Terrain + operator */}
      <div className="flex items-center gap-2 mt-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5">
          {formatTerrainType(match.terrain_type)}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5">
          {match.capacity}v{match.capacity}
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          {operatorAvatar ? (
            <img
              src={operatorAvatar}
              alt={operatorName}
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <span className="w-4 h-4 rounded-full bg-surface-700 flex items-center justify-center text-[8px] font-bold text-surface-400">
              {operatorName[0]}
            </span>
          )}
          <span className="text-[10px] text-surface-400 truncate max-w-[80px]">
            {operatorName}
          </span>
          {operatorRating > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
              <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {operatorRating.toFixed(1)}
            </span>
          )}
          {operatorMatches > 0 && (
            <span className="text-[9px] text-surface-500">
              ({operatorMatches})
            </span>
          )}
        </div>
      </div>

      {/* Spots progress */}
      <div className="mt-3 pt-3 border-t border-surface-800">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-surface-400">
            {isFull ? (
              <span className="text-amber-500 font-medium">{t.common.full}</span>
            ) : (
              <>
                <span className="text-pitch-400 font-medium">
                  {spotsLeft}
                </span>{" "}
                {spotsLeft === 1 ? t.common.spot : t.common.spots} {spotsLeft === 1 ? t.common.remaining : t.common.remainingPlural}
              </>
            )}
          </span>
          <span className="text-surface-500">
            {formatSpots(match.registered_count, match.capacity)}
          </span>
        </div>
        <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFull ? "bg-amber-500" : "bg-pitch-400"
            }`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
