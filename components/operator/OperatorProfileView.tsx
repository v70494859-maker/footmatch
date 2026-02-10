"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { OperatorWithProfile, Match, TerrainType } from "@/types";
import { MATCH_STATUS_LABELS, MATCH_STATUS_STYLES, TERRAIN_TYPE_LABELS } from "@/types";
import { getFlagForCountry } from "@/lib/cities";
import { getClubBySlug, getClubLogo } from "@/lib/clubs";
import { formatDate, formatTime, formatDuration, formatTerrainType } from "@/lib/format";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

interface OperatorStats {
  completedMatches: number;
  canceledMatches: number;
  totalParticipants: number;
  fillRate: number;
  reliability: number;
  avgPlayerRating: number;
  totalRatings: number;
  avgPlayersPerMatch: number;
  terrainCounts: { indoor: number; outdoor: number; covered: number };
}

interface OperatorProfileViewProps {
  operator: OperatorWithProfile;
  stats: OperatorStats;
  upcomingMatches: Match[];
  recentMatches: (Match & { match_results: unknown })[];
}

export default function OperatorProfileView({
  operator,
  stats,
  upcomingMatches,
  recentMatches,
}: OperatorProfileViewProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const profile = operator.profile;
  const [tab, setTab] = useState<"upcoming" | "recent">("upcoming");

  const favoriteClub = profile.favorite_club
    ? getClubBySlug(profile.favorite_club)
    : null;

  const memberSince = new Date(profile.created_at);
  const daysSince = Math.floor(
    (Date.now() - memberSince.getTime()) / 86400000
  );
  const memberLabel =
    daysSince < 30
      ? `${daysSince}j`
      : daysSince < 365
        ? `${Math.floor(daysSince / 30)} mois`
        : `${Math.floor(daysSince / 365)} an${Math.floor(daysSince / 365) > 1 ? "s" : ""}`;

  const totalTerrain =
    stats.terrainCounts.indoor +
    stats.terrainCounts.outdoor +
    stats.terrainCounts.covered;

  return (
    <div className="pb-24 lg:pb-8">
      {/* Back link */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t.common.back}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-4">
          <ProfileAvatar
            firstName={profile.first_name}
            lastName={profile.last_name}
            country={profile.origin_country}
            clubSlug={profile.favorite_club}
            size="lg"
          />

          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-foreground">
              {profile.first_name} {profile.last_name}
            </h1>

            {(profile.city || profile.origin_country) && (
              <p className="text-surface-400 text-sm">
                {profile.city && <span>{profile.city}</span>}
                {profile.city && profile.origin_country && <span> &middot; </span>}
                {profile.origin_country && (
                  <span>
                    {getFlagForCountry(profile.origin_country)}{" "}
                    {profile.origin_country}
                  </span>
                )}
              </p>
            )}

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-400/15 text-amber-400 border-amber-400/30">
                Organisateur
              </span>
              {favoriteClub && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-surface-800/60 text-surface-300 border-surface-700">
                  <Image
                    src={getClubLogo(favoriteClub.slug)}
                    alt={favoriteClub.name}
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                  />
                  {favoriteClub.name}
                </span>
              )}
              <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full border bg-surface-800/60 text-surface-300 border-surface-700">
                {memberLabel} membre
              </span>
            </div>

            {/* Star rating */}
            {stats.avgPlayerRating > 0 && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      viewBox="0 0 20 20"
                      className={`w-5 h-5 ${star <= Math.round(stats.avgPlayerRating) ? "text-amber-400" : "text-surface-700"}`}
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">
                  {stats.avgPlayerRating.toFixed(1)}
                </span>
                <span className="text-xs text-surface-500">
                  ({stats.totalRatings} avis)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-pitch-400">
              {stats.completedMatches}
            </p>
            <p className="text-[10px] text-surface-500">{t.operator.completedMatches}</p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">
              {stats.totalParticipants}
            </p>
            <p className="text-[10px] text-surface-500">{t.common.participants}</p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">
              {stats.fillRate}%
            </p>
            <p className="text-[10px] text-surface-500">{t.common.fillRate}</p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className={`text-lg font-bold ${stats.reliability >= 90 ? "text-pitch-400" : stats.reliability >= 70 ? "text-amber-500" : "text-danger-500"}`}>
              {stats.reliability}%
            </p>
            <p className="text-[10px] text-surface-500">{t.common.reliability}</p>
          </div>
        </div>

        {/* Performances */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-bold text-foreground">
                {stats.avgPlayersPerMatch > 0 ? stats.avgPlayersPerMatch : "—"}
              </p>
              <p className="text-[10px] text-surface-500">{t.common.players} / {t.common.match}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {stats.completedMatches + stats.canceledMatches + upcomingMatches.length}
              </p>
              <p className="text-[10px] text-surface-500">{t.common.organized} {t.common.totalPlayed}</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${stats.canceledMatches === 0 ? "text-foreground" : "text-danger-500"}`}>
                {stats.canceledMatches}
              </p>
              <p className="text-[10px] text-surface-500">{t.common.canceled}</p>
            </div>
          </div>

          {/* Terrain distribution */}
          {totalTerrain > 0 && (
            <div className="border-t border-surface-800 mt-3 pt-3">
              <p className="text-[10px] text-surface-500 mb-2">Terrains utilisés</p>
              <div className="flex items-center gap-2 flex-wrap">
                {(
                  Object.entries(stats.terrainCounts) as [TerrainType, number][]
                )
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <span
                      key={type}
                      className="text-[10px] font-semibold uppercase tracking-wide bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5"
                    >
                      {TERRAIN_TYPE_LABELS[type]} {count}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        {operator.bio && (
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-surface-300 mb-2">
              {t.common.about}
            </h3>
            <p className="text-sm text-surface-400 whitespace-pre-wrap">
              {operator.bio}
            </p>
          </div>
        )}

        {/* Matches tabs */}
        <div>
          <div className="flex gap-1 bg-surface-900 border border-surface-800 rounded-xl p-1 mb-4">
            <button
              type="button"
              onClick={() => setTab("upcoming")}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
                tab === "upcoming"
                  ? "bg-surface-800 text-foreground"
                  : "text-surface-500 hover:text-surface-300"
              }`}
            >
              {t.common.upcoming} ({upcomingMatches.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("recent")}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
                tab === "recent"
                  ? "bg-surface-800 text-foreground"
                  : "text-surface-500 hover:text-surface-300"
              }`}
            >
              {t.common.history} ({recentMatches.length})
            </button>
          </div>

          {tab === "upcoming" ? (
            upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.map((match) => {
                  const fillPct =
                    match.capacity > 0
                      ? Math.min(Math.round((match.registered_count / match.capacity) * 100), 100)
                      : 0;
                  const isFull = match.registered_count >= match.capacity;
                  const isAlmostFull = match.capacity > 0 && match.registered_count / match.capacity > 0.8;
                  const format = `${Math.floor(match.capacity / 2)}v${Math.floor(match.capacity / 2)}`;

                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="block bg-surface-900 rounded-2xl border border-surface-800 p-4 hover:border-surface-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                          {match.title}
                        </h3>
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 shrink-0 ${
                            MATCH_STATUS_STYLES[match.status as keyof typeof MATCH_STATUS_STYLES] ?? "bg-surface-800 text-surface-400"
                          }`}
                        >
                          {MATCH_STATUS_LABELS[match.status as keyof typeof MATCH_STATUS_LABELS]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-2">
                        <svg className="w-4 h-4 text-surface-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-surface-400">
                          {formatDate(match.date)} &middot; {formatTime(match.start_time)} &middot; {formatDuration(match.duration_minutes)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <svg className="w-4 h-4 text-pitch-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span className="text-sm text-foreground truncate">{match.venue_name}</span>
                        <span className="text-xs text-surface-500 truncate">{match.city}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-700/50 text-surface-300">
                          {formatTerrainType(match.terrain_type as TerrainType)}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                          {format}
                        </span>
                        {isAlmostFull && !isFull && (
                          <span className="text-[10px] font-medium text-amber-500">
                            {t.common.almostFull}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-surface-800">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-surface-400">
                            {match.registered_count}/{match.capacity} joueurs
                          </span>
                          <span className={`text-xs font-medium ${isFull ? "text-amber-500" : "text-pitch-400"}`}>
                            {fillPct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${isFull ? "bg-amber-500" : "bg-pitch-400"}`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 text-center">
                <p className="text-sm text-surface-400">{t.operator.noMatches}</p>
              </div>
            )
          ) : recentMatches.length > 0 ? (
            <div className="space-y-3">
              {recentMatches.map((match) => {
                const rawResult = match.match_results;
                const result = Array.isArray(rawResult) ? rawResult[0] : rawResult;
                const hasResult = !!result;
                const format = `${Math.floor(match.capacity / 2)}v${Math.floor(match.capacity / 2)}`;

                return (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="block bg-surface-900 rounded-2xl border border-surface-800 p-4 hover:border-surface-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                        {match.title}
                      </h3>
                      {hasResult ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-sm font-bold text-foreground">
                            {(result as { score_team_a: number }).score_team_a}
                          </span>
                          <span className="text-xs text-surface-500">-</span>
                          <span className="text-sm font-bold text-foreground">
                            {(result as { score_team_b: number }).score_team_b}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 shrink-0 bg-surface-600/20 text-surface-400">
                          {MATCH_STATUS_LABELS[match.status as keyof typeof MATCH_STATUS_LABELS]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <svg className="w-4 h-4 text-surface-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-surface-400">
                        {formatDate(match.date)} &middot; {formatTime(match.start_time)} &middot; {formatDuration(match.duration_minutes)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      <svg className="w-4 h-4 text-pitch-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <span className="text-sm text-foreground truncate">{match.venue_name}</span>
                      <span className="text-xs text-surface-500 truncate">{match.city}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-700/50 text-surface-300">
                        {formatTerrainType(match.terrain_type as TerrainType)}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                        {format}
                      </span>
                      <span className="text-xs text-surface-400">
                        {match.registered_count}/{match.capacity}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 text-center">
              <p className="text-sm text-surface-400">{t.operator.noMatches}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
