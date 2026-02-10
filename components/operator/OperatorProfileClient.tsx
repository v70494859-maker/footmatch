"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { Profile, Operator, Match, TerrainType } from "@/types";
import { MATCH_STATUS_LABELS, MATCH_STATUS_STYLES, TERRAIN_TYPE_LABELS } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getFlagForCountry } from "@/lib/cities";
import { getClubBySlug, getClubLogo } from "@/lib/clubs";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import Button from "@/components/ui/Button";
import { formatDate, formatTime, formatDuration, formatTerrainType } from "@/lib/format";

interface OperatorStats {
  completedMatches: number;
  canceledMatches: number;
  totalRegistrations: number;
  fillRate: number;
  totalRevenue: number;
  reliability: number;
  avgPlayersPerMatch: number;
  avgPlayerRating: number;
  totalRatings: number;
  terrainCounts: { indoor: number; outdoor: number; covered: number };
}

interface OperatorProfileClientProps {
  profile: Profile;
  operator: Operator;
  stats: OperatorStats;
  upcomingMatches: Match[];
  recentMatches: (Match & { match_results: unknown })[];
}

export default function OperatorProfileClient({
  profile: initialProfile,
  operator,
  stats,
  upcomingMatches,
  recentMatches,
}: OperatorProfileClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = createClient();
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  function handleSave(updated: Profile) {
    setProfile(updated);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">
          {t.common.edit} {t.operator.profile}
        </h2>
        <ProfileEditForm
          profile={profile}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

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
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
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
              {operator.stripe_onboarded ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-pitch-400/15 text-pitch-400 border-pitch-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-pitch-400" />
                  {t.operator.stripeConnected}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-400/15 text-amber-400 border-amber-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {t.operator.stripeNotConnected}
                </span>
              )}
            </div>
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
              {stats.totalRegistrations}
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
            {stats.avgPlayerRating > 0 ? (
              <>
                <div className="flex items-center justify-center gap-1">
                  <p className="text-lg font-bold text-amber-400">
                    {stats.avgPlayerRating.toFixed(1)}
                  </p>
                  <svg viewBox="0 0 20 20" className="w-4 h-4 text-amber-400" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-[10px] text-surface-500">
                  {stats.totalRatings} note{stats.totalRatings > 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-surface-500">N/A</p>
                <p className="text-[10px] text-surface-500">{t.common.rating}</p>
              </>
            )}
          </div>
        </div>

        {/* Performances */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-surface-300 mb-3">
            {t.common.statistics}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-surface-500">{t.operator.netAmount}</p>
              <p className="text-sm font-bold text-pitch-400 mt-0.5">
                {stats.totalRevenue.toFixed(2)} &euro;
              </p>
            </div>
            <div>
              <p className="text-xs text-surface-500">{t.common.players} / {t.common.match}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {stats.avgPlayersPerMatch > 0 ? stats.avgPlayersPerMatch : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-surface-500">{t.common.reliability}</p>
              <p className={`text-sm font-bold mt-0.5 ${stats.reliability >= 90 ? "text-pitch-400" : stats.reliability >= 70 ? "text-amber-500" : "text-danger-500"}`}>
                {stats.reliability}%
              </p>
            </div>
            <div>
              <p className="text-xs text-surface-500">{t.common.canceled}</p>
              <p className={`text-sm font-bold mt-0.5 ${stats.canceledMatches === 0 ? "text-foreground" : "text-danger-500"}`}>
                {stats.canceledMatches}
              </p>
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

        {/* Prochains matchs */}
        {upcomingMatches.length > 0 && (
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-surface-300">
                {t.common.upcoming} {t.common.matchPlural}
              </h3>
              <Link
                href="/operator/matches"
                className="text-xs text-pitch-400 hover:text-pitch-300 font-medium"
              >
                {t.common.viewAll}
              </Link>
            </div>
            <div className="space-y-2.5">
              {upcomingMatches.map((match) => {
                const fillPct =
                  match.capacity > 0
                    ? Math.min(Math.round((match.registered_count / match.capacity) * 100), 100)
                    : 0;
                const isFull = match.registered_count >= match.capacity;
                const format = `${Math.floor(match.capacity / 2)}v${Math.floor(match.capacity / 2)}`;

                return (
                  <Link
                    key={match.id}
                    href={`/operator/matches/${match.id}`}
                    className="flex items-center gap-3 rounded-lg bg-surface-800/50 px-3 py-2.5 hover:bg-surface-800 transition-colors"
                  >
                    <div className="shrink-0 text-center min-w-[2.5rem]">
                      <p className="text-xs font-semibold text-pitch-400 uppercase">
                        {new Date(match.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short" })}
                      </p>
                      <p className="text-base font-bold text-foreground leading-tight">
                        {new Date(match.date + "T00:00:00").getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">
                          {match.title}
                        </p>
                        <span
                          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                            MATCH_STATUS_STYLES[match.status as keyof typeof MATCH_STATUS_STYLES]
                          }`}
                        >
                          {MATCH_STATUS_LABELS[match.status as keyof typeof MATCH_STATUS_LABELS]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-surface-400 truncate">
                          {match.venue_name}
                        </span>
                        <span className="text-xs text-surface-500">
                          {formatTime(match.start_time)}
                        </span>
                        <span className="text-[10px] font-medium bg-surface-700 text-surface-300 rounded-full px-1.5 py-0.5">
                          {format}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <div className="w-full h-1 bg-surface-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isFull ? "bg-amber-500" : "bg-pitch-400"}`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-surface-500">
                      {match.registered_count}/{match.capacity}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Matchs récents */}
        {recentMatches.length > 0 && (
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-surface-300">
                {t.operator.completedMatches}
              </h3>
              <Link
                href="/operator"
                className="text-xs text-pitch-400 hover:text-pitch-300 font-medium"
              >
                {t.common.history}
              </Link>
            </div>
            <div className="space-y-2.5">
              {recentMatches.map((match) => {
                const rawResult = match.match_results;
                const result = Array.isArray(rawResult) ? rawResult[0] : rawResult;
                const hasResult = !!result;
                const format = `${Math.floor(match.capacity / 2)}v${Math.floor(match.capacity / 2)}`;

                return (
                  <Link
                    key={match.id}
                    href={`/operator/matches/${match.id}`}
                    className="flex items-center gap-3 rounded-lg bg-surface-800/50 px-3 py-2.5 hover:bg-surface-800 transition-colors"
                  >
                    <div className="shrink-0 text-center min-w-[2.5rem]">
                      <p className="text-xs font-semibold text-surface-500 uppercase">
                        {new Date(match.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short" })}
                      </p>
                      <p className="text-base font-bold text-foreground leading-tight">
                        {new Date(match.date + "T00:00:00").getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {match.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-surface-400">
                          {formatDate(match.date)}
                        </span>
                        <span className="text-[10px] font-medium bg-surface-700 text-surface-300 rounded-full px-1.5 py-0.5">
                          {formatTerrainType(match.terrain_type as TerrainType)}
                        </span>
                        <span className="text-[10px] font-medium bg-blue-500/10 text-blue-400 rounded-full px-1.5 py-0.5">
                          {format}
                        </span>
                        <span className="text-xs text-surface-500">
                          {match.registered_count}/{match.capacity}
                        </span>
                      </div>
                    </div>
                    {hasResult ? (
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">
                          {(result as { score_team_a: number }).score_team_a}
                        </span>
                        <span className="text-xs text-surface-500">-</span>
                        <span className="text-sm font-bold text-foreground">
                          {(result as { score_team_b: number }).score_team_b}
                        </span>
                      </div>
                    ) : (
                      <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-danger-500/10 text-danger-500">
                        À saisir
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Informations du compte */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-surface-300">
            {t.operator.profile}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {profile.email && (
              <div>
                <p className="text-xs text-surface-500">Email</p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {profile.email}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-surface-500">Membre depuis</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {memberSince.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Stripe Connect</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    operator.stripe_onboarded ? "bg-pitch-400" : "bg-amber-400"
                  }`}
                />
                <span className="text-sm font-medium text-foreground">
                  {operator.stripe_onboarded ? t.operator.stripeConnected : t.operator.stripeNotConnected}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-surface-500">ID Opérateur</p>
              <p className="text-sm font-medium text-surface-400 mt-0.5 font-mono text-xs truncate">
                {operator.id.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>

        {/* Link to public profile */}
        <Link
          href={`/operators/${operator.id}`}
          className="flex items-center justify-center gap-2 w-full bg-surface-900 border border-surface-800 hover:border-surface-700 rounded-xl px-4 py-3 transition-colors"
        >
          <svg
            className="w-4 h-4 text-pitch-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
          <span className="text-sm font-medium text-pitch-400">
            {t.operator.profile}
          </span>
        </Link>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button fullWidth onClick={() => setEditing(true)}>
            {t.common.edit} {t.operator.profile}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={handleLogout}
            loading={loggingOut}
          >
            {t.nav.logout}
          </Button>
        </div>
      </div>
    </div>
  );
}
