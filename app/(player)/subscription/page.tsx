import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type {
  Subscription,
  PlayerCareerStats,
  Match,
  MatchRegistrationWithMatch,
  MatchResult,
  MatchPlayerStats,
} from "@/types";
import { SUBSCRIPTION_PRICE, SUBSCRIPTION_CURRENCY } from "@/lib/constants";
import { formatPrice, formatDate, formatTime, formatTerrainType, formatAttendanceRate } from "@/lib/format";
import { getTranslations } from "@/lib/i18n/server";
import SubscriptionStatus from "@/components/subscription/SubscriptionStatus";
import PlayerStatsCard from "@/components/subscription/PlayerStatsCard";
import UpcomingMatchesMini from "@/components/subscription/UpcomingMatchesMini";
import BillingPortalButton from "@/components/subscription/BillingPortalButton";
import ReferralTeaser from "@/components/subscription/ReferralTeaser";
import PricingCard from "@/components/subscription/PricingCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FootMatch - Abonnement",
  description: "Gérez votre abonnement FootMatch",
};

export default async function SubscriptionPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch the user's subscription (most recent)
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("player_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sub = subscription as Subscription | null;
  const isActive = sub?.status === "active" || sub?.status === "trialing";

  // Extra data for active subscribers
  let matchesPlayed = 0;
  let careerStats: PlayerCareerStats | null = null;
  let upcomingMatches: Match[] = [];
  let hasStripeCustomer = false;
  let memberSinceDays = 0;
  let totalMatchesAllTime = 0;
  let chatCounts: Record<string, number> = {};
  let recentMatches: MatchRegistrationWithMatch[] = [];
  let recentResults: Record<string, MatchResult> = {};
  let recentPlayerStats: Record<string, MatchPlayerStats> = {};
  let totalUpcoming = 0;
  let nextMatchCountdown = -1;

  if (isActive && sub) {
    const today = new Date().toISOString().split("T")[0];

    // Membership duration
    const createdDate = new Date(sub.created_at);
    const now = new Date();
    memberSinceDays = Math.max(
      1,
      Math.floor((now.getTime() - createdDate.getTime()) / 86400000)
    );

    // Batch 1: independent queries
    const [matchesRes, statsRes, regsRes, profileRes, totalRegsRes, recentRegsRes, upcomingCountRes] =
      await Promise.all([
        // Matches this billing period
        supabase
          .from("match_registrations")
          .select("*, match:matches!inner(date)", {
            count: "exact",
            head: true,
          })
          .eq("player_id", user.id)
          .eq("status", "confirmed")
          .gte("match.date", sub.current_period_start ?? today)
          .lte("match.date", sub.current_period_end ?? today),

        // Career stats
        supabase
          .from("player_career_stats")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),

        // Upcoming registration IDs
        supabase
          .from("match_registrations")
          .select("match_id")
          .eq("player_id", user.id)
          .eq("status", "confirmed"),

        // Profile for stripe customer
        supabase
          .from("profiles")
          .select("stripe_customer_id")
          .eq("id", user.id)
          .single(),

        // Total all-time confirmed registrations
        supabase
          .from("match_registrations")
          .select("id", { count: "exact", head: true })
          .eq("player_id", user.id)
          .eq("status", "confirmed"),

        // Recent completed match registrations (for activity feed)
        supabase
          .from("match_registrations")
          .select("*, match:matches!inner(*)")
          .eq("player_id", user.id)
          .eq("status", "confirmed")
          .eq("match.status", "completed")
          .order("created_at", { ascending: false })
          .limit(3),

        // Total upcoming registrations count
        supabase
          .from("match_registrations")
          .select("*, match:matches!inner(date, status)", {
            count: "exact",
            head: true,
          })
          .eq("player_id", user.id)
          .eq("status", "confirmed")
          .gte("match.date", today)
          .in("match.status", ["upcoming", "full"]),
      ]);

    matchesPlayed = matchesRes.count ?? 0;
    careerStats = statsRes.data as PlayerCareerStats | null;
    hasStripeCustomer = !!profileRes.data?.stripe_customer_id;
    totalMatchesAllTime = totalRegsRes.count ?? 0;
    totalUpcoming = upcomingCountRes.count ?? 0;
    recentMatches = ((recentRegsRes.data ?? []) as MatchRegistrationWithMatch[]).filter(
      (r) => r.match !== null
    );

    // Get IDs for batch 2
    const upcomingMatchIds = (regsRes.data ?? []).map(
      (r) => r.match_id as string
    );
    const recentCompletedMatchIds = recentMatches.map((r) => r.match.id);

    // Batch 2: dependent queries
    const [upcomingRes, chatMsgsRes, resultsRes, playerStatsRes] =
      await Promise.all([
        // Upcoming matches
        upcomingMatchIds.length > 0
          ? supabase
              .from("matches")
              .select("*")
              .in("id", upcomingMatchIds)
              .gte("date", today)
              .in("status", ["upcoming", "full"])
              .order("date", { ascending: true })
              .order("start_time", { ascending: true })
              .limit(3)
          : Promise.resolve({ data: [] }),

        // Chat message counts for upcoming matches
        upcomingMatchIds.length > 0
          ? supabase
              .from("match_messages")
              .select("match_id")
              .in("match_id", upcomingMatchIds)
          : Promise.resolve({ data: [] }),

        // Results for recent completed
        recentCompletedMatchIds.length > 0
          ? supabase
              .from("match_results")
              .select("*")
              .in("match_id", recentCompletedMatchIds)
          : Promise.resolve({ data: [] }),

        // Player stats for recent completed
        recentCompletedMatchIds.length > 0
          ? supabase
              .from("match_player_stats")
              .select("*")
              .eq("user_id", user.id)
              .in("match_id", recentCompletedMatchIds)
          : Promise.resolve({ data: [] }),
      ]);

    upcomingMatches = (upcomingRes.data as Match[]) ?? [];

    // Chat counts map
    for (const msg of (chatMsgsRes.data ?? []) as { match_id: string }[]) {
      chatCounts[msg.match_id] = (chatCounts[msg.match_id] ?? 0) + 1;
    }

    // Recent results map
    for (const r of (resultsRes.data ?? []) as MatchResult[]) {
      recentResults[r.match_id] = r;
    }

    // Recent player stats map
    for (const s of (playerStatsRes.data ?? []) as MatchPlayerStats[]) {
      recentPlayerStats[s.match_id] = s;
    }

    // Next match countdown
    if (upcomingMatches.length > 0) {
      const nextDate = new Date(upcomingMatches[0].date + "T00:00:00");
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      nextMatchCountdown = Math.round(
        (nextDate.getTime() - todayDate.getTime()) / 86400000
      );
    }
  }

  // Recent form (W/D/L from recentMatches)
  const recentForm: ("V" | "D" | "N" | "?")[] = recentMatches.map((reg) => {
    const result = recentResults[reg.match.id];
    const pStats = recentPlayerStats[reg.match.id];
    if (!result || !pStats?.team) return "?";
    const my = pStats.team === "A" ? result.score_team_a : result.score_team_b;
    const opp = pStats.team === "A" ? result.score_team_b : result.score_team_a;
    if (my > opp) return "V";
    if (my < opp) return "D";
    return "N";
  });

  // Goals + assists this period from recent stats
  const recentGoals = Object.values(recentPlayerStats).reduce((s, p) => s + p.goals, 0);
  const recentAssists = Object.values(recentPlayerStats).reduce((s, p) => s + p.assists, 0);
  const recentMvp = Object.values(recentPlayerStats).filter((p) => p.mvp).length;

  // Next match label
  const nextMatchLabel =
    nextMatchCountdown === 0
      ? t.common.today
      : nextMatchCountdown === 1
        ? t.common.tomorrow
        : nextMatchCountdown > 0
          ? `J-${nextMatchCountdown}`
          : "—";

  return (
    <div className="pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold text-foreground">{t.subscription.title}</h1>
        <p className="text-sm text-surface-400 mt-1">
          {t.subscription.subtitle}
        </p>

        {isActive && sub ? (
          <div className="space-y-6 mt-6">
            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-pitch-400">
                  {memberSinceDays}
                </p>
                <p className="text-[10px] text-surface-500">
                  {memberSinceDays === 1 ? t.subscription.memberDay : t.subscription.memberDays}
                </p>
              </div>
              <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-foreground">
                  {matchesPlayed}
                </p>
                <p className="text-[10px] text-surface-500">
                  {t.common.thisMonth}
                </p>
              </div>
              <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-foreground">
                  {totalMatchesAllTime}
                </p>
                <p className="text-[10px] text-surface-500">{t.common.totalPlayed}</p>
              </div>
              <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-pitch-400">
                  {nextMatchLabel}
                </p>
                <p className="text-[10px] text-surface-500">{t.subscription.nextMatch}</p>
              </div>
            </div>

            {/* Recent form + Stats grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Forme récente */}
              <div className="rounded-2xl border border-surface-800 bg-surface-900 p-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t.subscription.recentForm}
                  </h3>
                  <span className="text-[10px] text-surface-500">
                    {formatDate(sub.current_period_start ?? sub.created_at)} — {formatDate(sub.current_period_end ?? sub.created_at)}
                  </span>
                </div>
                <p className="text-xs text-surface-500 mb-5">
                  {matchesPlayed} {matchesPlayed !== 1 ? t.common.matchPlural : t.common.match} {t.common.thisMonth.toLowerCase()} &middot; {totalUpcoming} {t.common.upcoming}
                </p>

                {/* W/D/L dots */}
                {recentForm.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-[10px] text-surface-500 mr-1">{t.subscription.latest}</span>
                      {recentForm.map((r, i) => (
                        <span
                          key={i}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            r === "V"
                              ? "bg-pitch-500/20 text-pitch-400"
                              : r === "D"
                                ? "bg-danger-500/20 text-danger-500"
                                : r === "N"
                                  ? "bg-amber-500/20 text-amber-500"
                                  : "bg-surface-800 text-surface-500"
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>

                    {/* Period stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-pitch-500/10 border border-pitch-500/15 px-3 py-2.5 text-center">
                        <p className="text-xl font-bold text-pitch-400">{recentGoals}</p>
                        <p className="text-[10px] text-surface-400">{t.common.goals}</p>
                      </div>
                      <div className="rounded-xl bg-blue-500/10 border border-blue-500/15 px-3 py-2.5 text-center">
                        <p className="text-xl font-bold text-blue-400">{recentAssists}</p>
                        <p className="text-[10px] text-surface-400">{t.common.assists}</p>
                      </div>
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/15 px-3 py-2.5 text-center">
                        <p className="text-xl font-bold text-amber-400">{recentMvp}</p>
                        <p className="text-[10px] text-surface-400">{t.common.mvp}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-surface-400">
                      {t.subscription.noRecentResults}
                    </p>
                    <Link
                      href="/matches"
                      className="text-xs text-pitch-400 hover:text-pitch-300 font-medium mt-1 inline-block"
                    >
                      {t.subscription.findMatch}
                    </Link>
                  </div>
                )}
              </div>

              <PlayerStatsCard stats={careerStats} />
            </div>

            {/* Upcoming matches */}
            <UpcomingMatchesMini
              matches={upcomingMatches}
              chatCounts={chatCounts}
            />

            {/* Recent results */}
            {recentMatches.length > 0 && (
              <div className="rounded-2xl border border-surface-800 bg-surface-900 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t.subscription.recentResults}
                  </h3>
                  <Link
                    href="/my-matches"
                    className="text-xs text-pitch-400 hover:text-pitch-300 font-medium"
                  >
                    {t.subscription.fullHistory}
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentMatches.map((reg) => {
                    const match = reg.match;
                    const result = recentResults[match.id];
                    const pStats = recentPlayerStats[match.id];

                    // Determine W/D/L
                    let badge: { label: string; cls: string } | null = null;
                    if (result && pStats?.team) {
                      const myTeamScore =
                        pStats.team === "A"
                          ? result.score_team_a
                          : result.score_team_b;
                      const otherScore =
                        pStats.team === "A"
                          ? result.score_team_b
                          : result.score_team_a;
                      if (myTeamScore > otherScore)
                        badge = {
                          label: "V",
                          cls: "bg-pitch-500/15 text-pitch-400",
                        };
                      else if (myTeamScore < otherScore)
                        badge = {
                          label: "D",
                          cls: "bg-amber-500/15 text-amber-500",
                        };
                      else
                        badge = {
                          label: "N",
                          cls: "bg-surface-600/20 text-surface-400",
                        };
                    }

                    return (
                      <Link
                        key={reg.id}
                        href={`/matches/${match.id}`}
                        className="flex items-center gap-3 rounded-xl bg-surface-800/50 px-4 py-3 hover:bg-surface-800 transition-colors"
                      >
                        {/* W/D/L badge or date */}
                        {badge ? (
                          <span
                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        ) : (
                          <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-surface-700 text-surface-400">
                            ?
                          </span>
                        )}

                        {/* Match info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {match.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-surface-400">
                              {formatDate(match.date)}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-700 text-surface-300 rounded-full px-2 py-0.5">
                              {formatTerrainType(match.terrain_type)}
                            </span>
                          </div>
                        </div>

                        {/* Score */}
                        {result && (
                          <div className="shrink-0 text-center">
                            <p className="text-sm font-bold text-foreground">
                              {result.score_team_a} - {result.score_team_b}
                            </p>
                          </div>
                        )}

                        {/* Personal stats */}
                        {pStats && (pStats.goals > 0 || pStats.assists > 0 || pStats.mvp) && (
                          <div className="shrink-0 flex items-center gap-1.5">
                            {pStats.goals > 0 && (
                              <span className="text-[10px] font-semibold bg-pitch-500/15 text-pitch-400 rounded-full px-2 py-0.5">
                                {pStats.goals} {t.common.goals.toLowerCase()}
                              </span>
                            )}
                            {pStats.assists > 0 && (
                              <span className="text-[10px] font-semibold bg-surface-700 text-surface-300 rounded-full px-2 py-0.5">
                                {pStats.assists} {t.common.assists.toLowerCase()}
                              </span>
                            )}
                            {pStats.mvp && (
                              <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-500 rounded-full px-2 py-0.5">
                                MVP
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subscription status + management + billing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SubscriptionStatus subscription={sub} />
              <div className="space-y-6">
                {hasStripeCustomer && <BillingPortalButton />}

                {/* Financial summary */}
                <div className="rounded-2xl border border-surface-800 bg-surface-900 p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    {t.subscription.financialSummary}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-400">{t.subscription.title}</span>
                      <span className="text-foreground font-medium">
                        {formatPrice(SUBSCRIPTION_PRICE, SUBSCRIPTION_CURRENCY)}{t.common.perMonth}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-400">{t.subscription.monthsBilled}</span>
                      <span className="text-foreground font-medium">
                        {Math.max(1, Math.ceil(memberSinceDays / 30))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-400">{t.subscription.totalPaid}</span>
                      <span className="text-foreground font-medium">
                        {formatPrice(
                          SUBSCRIPTION_PRICE * Math.max(1, Math.ceil(memberSinceDays / 30)),
                          SUBSCRIPTION_CURRENCY
                        )}
                      </span>
                    </div>
                    {totalMatchesAllTime > 0 && (
                      <>
                        <div className="border-t border-surface-800 my-1" />
                        <div className="flex justify-between text-sm">
                          <span className="text-surface-400">{t.subscription.matchesPlayed}</span>
                          <span className="text-foreground font-medium">
                            {totalMatchesAllTime}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-surface-400">{t.subscription.costPerMatch}</span>
                          <span className="text-pitch-400 font-bold">
                            {formatPrice(
                              (SUBSCRIPTION_PRICE * Math.max(1, Math.ceil(memberSinceDays / 30))) /
                                totalMatchesAllTime,
                              SUBSCRIPTION_CURRENCY
                            )}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="border-t border-surface-800 my-1" />
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-400">{t.subscription.upcomingMatches}</span>
                      <span className="text-foreground font-medium">
                        {totalUpcoming}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Career achievements */}
            {careerStats && careerStats.total_matches > 0 && (
              <div className="rounded-2xl border border-surface-800 bg-surface-900 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t.subscription.achievements}
                  </h3>
                  <span className="text-[10px] text-surface-500">
                    {careerStats.total_matches} {careerStats.total_matches > 1 ? t.common.matchPlural : t.common.match} {t.common.totalPlayed.toLowerCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  <div className="rounded-xl bg-pitch-500/10 border border-pitch-500/15 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-pitch-400">{careerStats.total_goals}</p>
                    <p className="text-[10px] text-surface-400">{t.common.goals}</p>
                  </div>
                  <div className="rounded-xl bg-blue-500/10 border border-blue-500/15 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-blue-400">{careerStats.total_assists}</p>
                    <p className="text-[10px] text-surface-400">{t.common.assists}</p>
                  </div>
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/15 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-amber-400">{careerStats.total_mvp}</p>
                    <p className="text-[10px] text-surface-400">{t.common.mvp}</p>
                  </div>
                  <div className="rounded-xl bg-surface-800 border border-surface-700 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-foreground">{careerStats.win_count}</p>
                    <p className="text-[10px] text-surface-400">{t.common.wins}</p>
                  </div>
                  <div className="rounded-xl bg-surface-800 border border-surface-700 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-foreground">{careerStats.draw_count}</p>
                    <p className="text-[10px] text-surface-400">{t.common.draws}</p>
                  </div>
                  <div className="rounded-xl bg-surface-800 border border-surface-700 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-foreground">{careerStats.loss_count}</p>
                    <p className="text-[10px] text-surface-400">{t.common.losses}</p>
                  </div>
                </div>

                {/* Averages + cards row */}
                <div className="flex items-center flex-wrap gap-2 mt-4">
                  {careerStats.total_matches > 0 && (
                    <span className="text-[10px] font-semibold bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5">
                      {(careerStats.total_goals / careerStats.total_matches).toFixed(1)} {t.common.goalsPerMatch}
                    </span>
                  )}
                  {careerStats.total_matches > 0 && (
                    <span className="text-[10px] font-semibold bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5">
                      {(careerStats.total_assists / careerStats.total_matches).toFixed(1)} {t.common.assistsPerMatch}
                    </span>
                  )}
                  {careerStats.total_matches > 0 && (
                    <span className="text-[10px] font-semibold bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5">
                      {t.common.winRate} {Math.round((careerStats.win_count / careerStats.total_matches) * 100)}%
                    </span>
                  )}
                  {careerStats.total_yellow_cards > 0 && (
                    <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-500 rounded-full px-2.5 py-0.5">
                      {careerStats.total_yellow_cards} {careerStats.total_yellow_cards > 1 ? t.common.yellowCardsPlural : t.common.yellowCards}
                    </span>
                  )}
                  {careerStats.total_red_cards > 0 && (
                    <span className="text-[10px] font-semibold bg-danger-500/15 text-danger-500 rounded-full px-2.5 py-0.5">
                      {careerStats.total_red_cards} {careerStats.total_red_cards > 1 ? t.common.redCardsPlural : t.common.redCards}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5">
                    {t.common.reliability} {formatAttendanceRate(careerStats.attendance_rate)}
                  </span>
                </div>
              </div>
            )}

            {/* Referral teaser */}
            <ReferralTeaser />
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {t.subscription.noSubscription}
              </h2>
              <p className="text-surface-400 text-sm">
                {t.subscription.subscribePrompt}
              </p>
            </div>
            <PricingCard />
          </div>
        )}
      </div>
    </div>
  );
}
