import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/lib/i18n/server";
import type {
  Match,
  MatchRegistrationWithProfile,
  MatchStatus,
  MatchResult,
  MatchPlayerStatsWithProfile,
  TerrainType,
} from "@/types";
import { MATCH_STATUS_LABELS, TERRAIN_TYPE_LABELS } from "@/types";
import { formatDate, formatTime, formatDuration, formatSpots, formatTerrainType } from "@/lib/format";
import { getFlagForCountry } from "@/lib/cities";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import MatchResultsSummary from "@/components/results/MatchResultsSummary";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("title")
    .eq("id", id)
    .single();

  if (!match) {
    return { title: "Match introuvable - FootMatch Opérateur" };
  }

  return {
    title: `${match.title} - FootMatch Opérateur`,
  };
}

const STATUS_STYLES: Record<MatchStatus, string> = {
  upcoming: "bg-pitch-500/10 text-pitch-400",
  full: "bg-amber-500/10 text-amber-500",
  in_progress: "bg-blue-500/10 text-blue-400",
  completed: "bg-surface-600/20 text-surface-400",
  canceled: "bg-danger-500/10 text-danger-500",
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

export default async function OperatorMatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get operator record
  const { data: operator } = await supabase
    .from("operators")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!operator) redirect("/matches");

  // Fetch match with registrations (including player profiles)
  const { data: match } = await supabase
    .from("matches")
    .select("*, match_registrations(*, profile:profiles(*))")
    .eq("id", id)
    .eq("operator_id", operator.id)
    .single();

  if (!match) notFound();

  const typedMatch = match as Match & {
    match_registrations: MatchRegistrationWithProfile[];
  };

  const confirmedRegistrations = typedMatch.match_registrations.filter(
    (r) => r.status === "confirmed"
  );

  // Check for existing results
  let matchResult: MatchResult | null = null;
  let playerStats: MatchPlayerStatsWithProfile[] = [];

  const { data: resultData } = await supabase
    .from("match_results")
    .select("*, match_player_stats(*, profile:profiles(*))")
    .eq("match_id", id)
    .maybeSingle();

  if (resultData) {
    const { match_player_stats, ...result } = resultData as MatchResult & {
      match_player_stats: MatchPlayerStatsWithProfile[];
    };
    matchResult = result;
    playerStats = match_player_stats;
  }

  const canEnterResults =
    !matchResult &&
    confirmedRegistrations.length > 0 &&
    (typedMatch.status === "completed" || typedMatch.status === "in_progress" || typedMatch.status === "full");

  return (
    <div className="pb-24 lg:pb-8">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        {/* Match header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground">{typedMatch.title}</h1>
            <span
              className={`text-xs font-semibold uppercase tracking-wide rounded-full px-3 py-1 shrink-0 ${STATUS_STYLES[typedMatch.status]}`}
            >
              {MATCH_STATUS_LABELS[typedMatch.status]}
            </span>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span
              className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-0.5 ring-1 ring-inset ${TERRAIN_STYLES[typedMatch.terrain_type]}`}
            >
              {formatTerrainType(typedMatch.terrain_type)}
            </span>
            <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-surface-800/60 text-surface-300 ring-1 ring-inset ring-surface-700/40">
              {getMatchFormat(typedMatch.capacity)}
            </span>
            <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-surface-800/60 text-surface-300 ring-1 ring-inset ring-surface-700/40">
              {formatDuration(typedMatch.duration_minutes)}
            </span>
          </div>

          {/* Prominent date */}
          <div className="flex items-center gap-2 mt-3">
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
              <span className="text-foreground font-medium">{formatDate(typedMatch.date)}</span>
              <span className="text-surface-500 mx-1.5">&middot;</span>
              <span className="text-surface-400">{formatTime(typedMatch.start_time)}</span>
            </span>
          </div>
        </div>

        {/* Match details card */}
        {(() => {
          const fillPercent = typedMatch.capacity > 0
            ? Math.min(Math.round((typedMatch.registered_count / typedMatch.capacity) * 100), 100)
            : 0;
          const isAlmostFull = fillPercent > 80 && typedMatch.status !== "full" && typedMatch.status !== "canceled";
          const isFull = typedMatch.registered_count >= typedMatch.capacity;

          return (
            <div className="bg-surface-900 rounded-2xl border border-surface-800 p-5 space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">{t.operator.date}</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(typedMatch.date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">{t.operator.startTime}</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatTime(typedMatch.start_time)} &middot;{" "}
                    {formatDuration(typedMatch.duration_minutes)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">{t.operator.venue}</p>
                  <p className="text-sm font-medium text-foreground">
                    {typedMatch.venue_name}
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5">{typedMatch.venue_address}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">{t.operatorOnboarding.city}</p>
                  <p className="text-sm font-medium text-foreground">{typedMatch.city}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">{t.operator.terrainType}</p>
                  <p className="text-sm font-medium text-foreground">
                    {TERRAIN_TYPE_LABELS[typedMatch.terrain_type]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">{t.operator.date}</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(typedMatch.created_at)}
                  </p>
                </div>
              </div>

              {/* Fill progress bar */}
              <div className="pt-3 border-t border-surface-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-surface-400">
                    Inscrits : <span className="text-foreground font-medium">{formatSpots(typedMatch.registered_count, typedMatch.capacity)}</span>
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
                <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isFull
                        ? "bg-amber-500"
                        : fillPercent > 80
                          ? "bg-gradient-to-r from-amber-500/80 to-amber-500"
                          : "bg-gradient-to-r from-pitch-500/80 to-pitch-400"
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                {isAlmostFull && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-medium text-amber-400">{t.common.almostFull}</span>
                  </div>
                )}
              </div>

              {typedMatch.description && (
                <div className="pt-3 border-t border-surface-800">
                  <p className="text-xs text-surface-500 mb-1">{t.operator.description}</p>
                  <p className="text-sm text-surface-300">{typedMatch.description}</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Enter Results button */}
        {canEnterResults && (
          <div className="mb-6">
            <Link
              href={`/operator/matches/${id}/results`}
              className="flex items-center justify-center gap-2 w-full bg-pitch-500 hover:bg-pitch-600 text-white font-semibold rounded-xl px-5 py-3 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              {t.operator.enterResults}
            </Link>
          </div>
        )}

        {/* Match results summary */}
        {matchResult && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {t.operator.results}
            </h2>
            <MatchResultsSummary result={matchResult} playerStats={playerStats} />
          </div>
        )}

        {/* Registered players */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t.common.players} ({confirmedRegistrations.length})
          </h2>

          {confirmedRegistrations.length > 0 ? (
            <div className="space-y-2">
              {confirmedRegistrations.map((registration, index) => {
                const profile = registration.profile;
                const playerHref = `/players/${profile.id}`;
                const flag = getFlagForCountry(profile.origin_country);

                return (
                  <div
                    key={registration.id}
                    className="flex items-center gap-3 bg-surface-900 rounded-xl border border-surface-800 px-4 py-3"
                  >
                    {/* Registration order number */}
                    <span className="text-xs font-medium text-surface-500 tabular-nums w-5 text-center shrink-0">
                      #{index + 1}
                    </span>

                    <ProfileAvatar
                      firstName={profile.first_name}
                      lastName={profile.last_name}
                      country={profile.origin_country}
                      clubSlug={profile.favorite_club}
                      size="sm"
                      href={playerHref}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link href={playerHref} className="text-sm font-medium text-foreground truncate hover:text-pitch-400 transition-colors">
                          {profile.first_name} {profile.last_name}
                        </Link>
                        {flag && (
                          <span className="text-sm shrink-0" title={profile.origin_country ?? undefined}>
                            {flag}
                          </span>
                        )}
                      </div>
                      {profile.city && (
                        <p className="text-xs text-surface-500 truncate">
                          {profile.city}
                        </p>
                      )}
                    </div>

                    <span className="text-xs text-surface-500 shrink-0">
                      {new Date(registration.created_at).toLocaleDateString("fr-FR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface-900 rounded-2xl border border-surface-800 p-6 text-center">
              <svg
                className="w-8 h-8 mx-auto text-surface-700 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p className="text-sm text-surface-400">{t.common.none}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
