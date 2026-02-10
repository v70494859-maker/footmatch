import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/lib/i18n/server";
import DashboardStats from "@/components/operator/DashboardStats";
import { MATCH_STATUS_LABELS, MATCH_STATUS_STYLES } from "@/types";
import type { TerrainType } from "@/types";
import { formatDate, formatTime, formatDuration, formatTerrainType } from "@/lib/format";

export default async function OperatorDashboardPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get operator record for current user
  const { data: operator } = await supabase
    .from("operators")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (!operator) redirect("/matches");

  const today = new Date().toISOString().split("T")[0];

  // Parallel fetches
  const [
    { count: completedMatches },
    { count: canceledMatches },
    { count: upcomingMatches },
    { data: operatorMatches },
    { data: payouts },
    { data: upcomingMatchesList },
    { data: allMatchesHistory },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("operator_id", operator.id)
      .eq("status", "completed"),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("operator_id", operator.id)
      .eq("status", "canceled"),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("operator_id", operator.id)
      .in("status", ["upcoming", "full"])
      .gte("date", today),
    supabase
      .from("matches")
      .select("registered_count, capacity")
      .eq("operator_id", operator.id),
    supabase
      .from("operator_payouts")
      .select("net_amount")
      .eq("operator_id", operator.id)
      .eq("status", "completed"),
    supabase
      .from("matches")
      .select("*")
      .eq("operator_id", operator.id)
      .in("status", ["upcoming", "full"])
      .gte("date", today)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(3),
    // All matches for full history
    supabase
      .from("matches")
      .select("*, match_results(*)")
      .eq("operator_id", operator.id)
      .order("date", { ascending: false })
      .order("start_time", { ascending: false }),
  ]);

  // Computed stats
  const allMatches = operatorMatches ?? [];
  const totalRegistrations = allMatches.reduce((sum, m) => sum + m.registered_count, 0);
  const avgFillRate =
    allMatches.length > 0
      ? allMatches.reduce(
          (sum, m) => sum + (m.capacity > 0 ? m.registered_count / m.capacity : 0),
          0
        ) / allMatches.length
      : 0;

  const totalRevenue = (payouts ?? []).reduce(
    (sum, p) => sum + (p.net_amount ?? 0),
    0
  );

  const completed = completedMatches ?? 0;
  const canceled = canceledMatches ?? 0;
  const reliabilityTotal = completed + canceled;
  const reliability = reliabilityTotal > 0 ? Math.round((completed / reliabilityTotal) * 100) : 100;
  const avgPlayersPerMatch = completed > 0 ? (totalRegistrations / completed).toFixed(1) : "—";

  return (
    <div className="pb-24 lg:pb-8">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t.operator.dashboard}</h1>

        <DashboardStats
          completedMatches={completed}
          upcomingMatches={upcomingMatches ?? 0}
          fillRate={Math.round(avgFillRate * 100)}
          rating={operator.rating ?? 0}
        />

        {/* Performances */}
        <div className="mt-6">
          <div className="bg-surface-900 rounded-xl border border-surface-800 p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">
                  {t.operator.netAmount}
                </p>
                <p className="text-xl font-bold text-pitch-400">
                  {totalRevenue.toFixed(2)}{" "}
                  <span className="text-sm font-normal text-surface-400">&euro;</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">
                  {t.common.players} / {t.common.match}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {avgPlayersPerMatch}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">
                  {t.common.participants}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {totalRegistrations}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">
                  {t.common.reliability}
                </p>
                <p className={`text-xl font-bold ${reliability >= 90 ? "text-pitch-400" : reliability >= 70 ? "text-amber-500" : "text-danger-500"}`}>
                  {reliability}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prochains matchs */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t.common.upcoming} {t.common.matchPlural}</h2>
          <div className="bg-surface-900 rounded-xl border border-surface-800 divide-y divide-surface-800">
            {!upcomingMatchesList || upcomingMatchesList.length === 0 ? (
              <p className="text-surface-400 text-sm text-center py-6">
                {t.operator.noMatches}
              </p>
            ) : (
              upcomingMatchesList.map((match) => {
                const fillRate = match.capacity > 0 ? match.registered_count / match.capacity : 0;
                const fillPercent = Math.round(fillRate * 100);
                const isAlmostFull = fillRate > 0.8;
                const isFull = fillRate >= 1;
                const format = `${Math.floor(match.capacity / 2)}v${Math.floor(match.capacity / 2)}`;
                return (
                  <Link
                    key={match.id}
                    href={`/operator/matches/${match.id}`}
                    className="block p-4 hover:bg-surface-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {match.title}
                          </p>
                          {isAlmostFull && !isFull && (
                            <span className="text-xs font-medium text-amber-500 whitespace-nowrap">
                              {t.common.almostFull}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-surface-400">
                          {formatDate(match.date)} à {formatTime(match.start_time)} &middot; {formatDuration(match.duration_minutes)}
                        </p>
                        <p className="text-xs text-surface-500 mt-0.5">
                          {match.venue_name} &middot; {match.city}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-700/50 text-surface-300">
                            {formatTerrainType(match.terrain_type as TerrainType)}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                            {format}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              MATCH_STATUS_STYLES[match.status as keyof typeof MATCH_STATUS_STYLES]
                            }`}
                          >
                            {MATCH_STATUS_LABELS[match.status as keyof typeof MATCH_STATUS_LABELS]}
                          </span>
                          <svg
                            className="w-4 h-4 text-surface-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 4.5l7.5 7.5-7.5 7.5"
                            />
                          </svg>
                        </div>
                        <div className="w-28">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-surface-400">
                              {match.registered_count}/{match.capacity}
                            </span>
                            <span className={`text-xs font-medium ${isFull ? "text-amber-500" : isAlmostFull ? "text-amber-500" : "text-pitch-400"}`}>
                              {fillPercent}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-surface-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isFull
                                  ? "bg-amber-500"
                                  : isAlmostFull
                                    ? "bg-amber-500"
                                    : "bg-pitch-500"
                              }`}
                              style={{ width: `${Math.min(fillPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Historique des matchs */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t.operator.matchHistory}</h2>
            <span className="text-xs text-surface-400">
              {(allMatchesHistory ?? []).length} {(allMatchesHistory ?? []).length > 1 ? t.common.matchPlural : t.common.match}
            </span>
          </div>
          <div className="bg-surface-900 rounded-xl border border-surface-800 divide-y divide-surface-800">
            {!allMatchesHistory || allMatchesHistory.length === 0 ? (
              <p className="text-surface-400 text-sm text-center py-6">
                {t.operator.noMatches}
              </p>
            ) : (
              allMatchesHistory.map((match) => {
                const result = Array.isArray(match.match_results)
                  ? match.match_results[0]
                  : match.match_results;
                const hasResult = !!result;
                const fillRate = match.capacity > 0 ? match.registered_count / match.capacity : 0;
                const fillPercent = Math.round(fillRate * 100);
                const format = `${Math.floor(match.capacity / 2)}v${Math.floor(match.capacity / 2)}`;
                return (
                  <Link
                    key={match.id}
                    href={`/operator/matches/${match.id}`}
                    className="block p-4 hover:bg-surface-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {match.title}
                          </p>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                              MATCH_STATUS_STYLES[match.status as keyof typeof MATCH_STATUS_STYLES]
                            }`}
                          >
                            {MATCH_STATUS_LABELS[match.status as keyof typeof MATCH_STATUS_LABELS]}
                          </span>
                        </div>
                        <p className="text-xs text-surface-400">
                          {formatDate(match.date)} à {formatTime(match.start_time)} &middot; {formatDuration(match.duration_minutes)}
                        </p>
                        <p className="text-xs text-surface-500 mt-0.5">
                          {match.venue_name} &middot; {match.city}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-700/50 text-surface-300">
                            {formatTerrainType(match.terrain_type as TerrainType)}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                            {format}
                          </span>
                          <span className="text-xs text-surface-400">
                            {match.registered_count}/{match.capacity} ({fillPercent}%)
                          </span>
                          {!hasResult && match.status === "completed" && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-danger-500/10 text-danger-500">
                              {t.operator.enterResults}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {hasResult ? (
                          <div className="flex items-center gap-2">
                            <div className="text-center">
                              <p className="text-[10px] uppercase tracking-wider text-surface-500 mb-0.5">
                                {t.operator.teamA}
                              </p>
                              <p className="text-lg font-bold text-foreground leading-none">
                                {result.score_team_a}
                              </p>
                            </div>
                            <span className="text-sm font-medium text-surface-500">-</span>
                            <div className="text-center">
                              <p className="text-[10px] uppercase tracking-wider text-surface-500 mb-0.5">
                                {t.operator.teamB}
                              </p>
                              <p className="text-lg font-bold text-foreground leading-none">
                                {result.score_team_b}
                              </p>
                            </div>
                          </div>
                        ) : match.status === "canceled" ? (
                          <span className="text-xs text-danger-500">{t.common.canceled}</span>
                        ) : match.status === "completed" ? (
                          <span className="text-xs text-surface-500">{t.common.none}</span>
                        ) : null}
                        <svg
                          className="w-4 h-4 text-surface-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
