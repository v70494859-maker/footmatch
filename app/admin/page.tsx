import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, getDateLocale } from "@/lib/i18n/server";
import StatBox from "@/components/admin/StatBox";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import GrowthCharts from "@/components/admin/GrowthCharts";
import {
  SUBSCRIPTION_STATUS_LABELS,
  USER_ROLE_LABELS,
} from "@/types";
import type { SubscriptionStatus, UserRole } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "FootMatch Admin - Tableau de bord" };

/* ── Helpers ─────────────────────────────────────────── */

function fmtEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function formatShortDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

type DailyPoint = { label: string; value: number };

function aggregateByDay(
  rows: { created_at: string }[],
  days: number,
  locale: string = "fr-FR"
): DailyPoint[] {
  const buckets = new Map<string, number>();
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({
    label: formatShortDate(date, locale),
    value: count,
  }));
}

function aggregateRevenueByWeek(
  subscriptions: { created_at: string; status: string }[],
  weeks: number,
  pricePerMonth: number,
  locale: string = "fr-FR"
): DailyPoint[] {
  const now = new Date();
  const points: DailyPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const activeAtWeekEnd = subscriptions.filter((s) => {
      const created = new Date(s.created_at);
      return created <= weekEnd && s.status === "active";
    }).length;

    points.push({
      label: formatShortDate(weekEnd.toISOString(), locale),
      value: Math.round(activeAtWeekEnd * pricePerMonth * 100) / 100,
    });
  }

  return points;
}

function computeTrend(data: DailyPoint[]): number {
  if (data.length < 14) return 0;
  const thisWeek = data.slice(-7).reduce((s, d) => s + d.value, 0);
  const lastWeek = data.slice(-14, -7).reduce((s, d) => s + d.value, 0);
  if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
}

/* ── Page ───────────────────────────────────────────── */

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const t = await getTranslations();
  const dateLocale = await getDateLocale();
  const thirtyDaysAgo = getDaysAgo(30);
  const today = new Date().toISOString().split("T")[0];

  // ── All fetches in parallel ──────────────────────────
  const [
    { count: totalSubscribers },
    { count: totalOperators },
    { count: totalMatches },
    { count: totalUsers },
    { count: pendingApplications },
    { count: completedMatches },
    { count: canceledMatches },
    { count: upcomingMatchesCount },
    { data: allMatches },
    { data: allSubscriptions },
    { data: completedPayouts },
    { data: onboardedOperators },
    { data: topOperators },
    { data: operatorRatings },
    { data: recentSignups },
    { data: recentUsers },
    { data: recentMatches },
    { data: recentRegistrations },
    { data: recentMatchesDetailed },
    { data: configRows },
  ] = await Promise.all([
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("operators").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("operator_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "canceled"),
    supabase.from("matches").select("*", { count: "exact", head: true }).in("status", ["upcoming", "full"]).gte("date", today),
    supabase.from("matches").select("registered_count, capacity, status, date"),
    supabase.from("subscriptions").select("status, created_at"),
    supabase.from("operator_payouts").select("net_amount").eq("status", "completed"),
    supabase.from("operators").select("id").eq("stripe_onboarded", true),
    supabase
      .from("operators")
      .select("id, total_matches, rating, profile:profiles(first_name, last_name, city, origin_country, favorite_club)")
      .order("total_matches", { ascending: false })
      .limit(5),
    supabase.from("operators").select("rating"),
    supabase
      .from("profiles")
      .select("first_name, last_name, role, city, email, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
    supabase.from("matches").select("created_at").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
    supabase.from("match_registrations").select("created_at").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
    supabase
      .from("matches")
      .select("title, date, start_time, venue_name, city, registered_count, capacity, status, terrain_type")
      .in("status", ["upcoming", "full"])
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(5),
    supabase.from("platform_config").select("key, value").eq("key", "subscription_price"),
  ]);

  // ── Extract config values ───────────────────────────

  const configMap = new Map<string, Record<string, unknown>>();
  for (const row of configRows ?? []) {
    configMap.set(row.key, row.value as Record<string, unknown>);
  }
  const subscriptionPrice = Number(configMap.get("subscription_price")?.amount ?? configMap.get("subscription_price")?.value ?? 11.99);

  // ── Computed values ──────────────────────────────────

  const monthlyRevenue = (totalSubscribers ?? 0) * subscriptionPrice;

  const totalRegistrations = (allMatches ?? []).reduce(
    (sum, m) => sum + (m.registered_count ?? 0), 0
  );

  const totalPayoutsAmount = (completedPayouts ?? []).reduce(
    (sum, p) => sum + (p.net_amount ?? 0), 0
  );

  const matchesPerPlayer = (totalUsers ?? 0) > 0
    ? (totalRegistrations / (totalUsers ?? 1)).toFixed(1)
    : "0.0";

  // Subscription breakdown
  const subscriptionBreakdown: Record<SubscriptionStatus, number> = {
    active: 0, past_due: 0, canceled: 0, incomplete: 0, trialing: 0,
  };
  for (const s of allSubscriptions ?? []) {
    const st = s.status as SubscriptionStatus;
    if (st in subscriptionBreakdown) subscriptionBreakdown[st]++;
  }
  const totalSubscriptions = (allSubscriptions ?? []).length;

  // Platform health
  const matchesWithCapacity = (allMatches ?? []).filter((m) => (m.capacity ?? 0) > 0);
  const avgFillPct = matchesWithCapacity.length > 0
    ? Math.round(
        matchesWithCapacity.reduce((sum, m) => sum + (m.registered_count ?? 0) / m.capacity, 0) /
          matchesWithCapacity.length * 100
      )
    : 0;

  const cancelRate = (totalMatches ?? 0) > 0
    ? Math.round(((canceledMatches ?? 0) / (totalMatches ?? 1)) * 100)
    : 0;

  const matchesPerOperator = (totalOperators ?? 0) > 0
    ? ((totalMatches ?? 0) / (totalOperators ?? 1)).toFixed(1)
    : "0.0";

  const conversionRate = (totalUsers ?? 0) > 0
    ? Math.round(((totalSubscribers ?? 0) / (totalUsers ?? 1)) * 100)
    : 0;

  const stripeOnboardedCount = (onboardedOperators ?? []).length;
  const stripeOnboardRate = (totalOperators ?? 0) > 0
    ? Math.round((stripeOnboardedCount / (totalOperators ?? 1)) * 100)
    : 0;

  const avgRating = (operatorRatings ?? []).length > 0
    ? (operatorRatings ?? []).reduce((sum, o) => sum + (o.rating ?? 0), 0) / (operatorRatings ?? []).length
    : 0;

  // Growth data
  const userGrowthData = aggregateByDay(recentUsers ?? [], 30, dateLocale);
  const matchActivityData = aggregateByDay(recentMatches ?? [], 30, dateLocale);
  const registrationData = aggregateByDay(recentRegistrations ?? [], 30, dateLocale);
  const revenueData = aggregateRevenueByWeek(
    (allSubscriptions ?? []).map((s) => ({ created_at: s.created_at, status: s.status as string })),
    8,
    subscriptionPrice,
    dateLocale
  );

  const userGrowthTotal = userGrowthData.reduce((s, d) => s + d.value, 0);
  const matchActivityTotal = matchActivityData.reduce((s, d) => s + d.value, 0);
  const registrationTotal = registrationData.reduce((s, d) => s + d.value, 0);

  // Styles
  const subscriptionColors: Record<SubscriptionStatus, string> = {
    active: "bg-pitch-400", past_due: "bg-amber-500", canceled: "bg-danger-500",
    incomplete: "bg-surface-400", trialing: "bg-blue-400",
  };

  const roleBadgeStyles: Record<UserRole, string> = {
    player: "bg-blue-500/10 text-blue-400",
    operator: "bg-pitch-500/10 text-pitch-400",
    admin: "bg-amber-500/10 text-amber-500",
  };

  const terrainLabels: Record<string, string> = {
    indoor: t.operator.indoor, outdoor: t.operator.outdoor, covered: t.operator.covered,
  };

  return (
    <div className="max-w-6xl pb-8">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.admin.dashboard}</h1>
        </div>
        {(pendingApplications ?? 0) > 0 && (
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium px-4 py-2 rounded-xl hover:bg-amber-500/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {pendingApplications} {t.admin.pendingApplicationsDesc}
          </Link>
        )}
      </div>

      {/* ── Revenue hero card ──────────────────────────── */}
      <div className="bg-surface-900 rounded-2xl border border-surface-800 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">
              {t.admin.mrr}
            </p>
            <p className="text-4xl font-bold text-foreground">
              {fmtEur(monthlyRevenue)}
            </p>
            <p className="text-sm text-surface-400 mt-1">
              {totalSubscribers ?? 0} {t.admin.subscribers} {t.admin.active} × {fmtEur(subscriptionPrice)}{t.common.perMonth}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-surface-500">{t.admin.operatorPayouts}</p>
              <p className="text-sm font-semibold text-foreground">{fmtEur(totalPayoutsAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-surface-500">{t.admin.conversionRate}</p>
              <p className={`text-sm font-semibold ${conversionRate >= 30 ? "text-pitch-400" : conversionRate >= 15 ? "text-amber-400" : "text-surface-300"}`}>
                {conversionRate}%
              </p>
              <p className="text-[11px] text-surface-500">{t.admin.totalUsers} → {t.admin.subscribers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Primary stats ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatBox
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          label={t.admin.totalUsers}
          value={totalUsers ?? 0}
        />
        <StatBox
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          }
          label={t.admin.subscribers}
          value={totalSubscribers ?? 0}
        />
        <StatBox
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
          label={t.admin.operators}
          value={totalOperators ?? 0}
        />
        <StatBox
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6l1.5 3.5L17 11l-3.5 1.5L12 16l-1.5-3.5L7 11l3.5-1.5z" />
            </svg>
          }
          label={t.admin.totalMatches}
          value={totalMatches ?? 0}
        />
        <StatBox
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label={t.admin.upcomingMatches}
          value={upcomingMatchesCount ?? 0}
        />
        <StatBox
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label={t.admin.completedMatches}
          value={completedMatches ?? 0}
        />
      </div>

      {/* ── Growth charts ────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
          {t.admin.growthCharts}
        </h2>
        <GrowthCharts
          userGrowth={userGrowthData}
          matchActivity={matchActivityData}
          registrationActivity={registrationData}
          revenueGrowth={revenueData}
          userGrowthTotal={userGrowthTotal}
          userGrowthTrend={computeTrend(userGrowthData)}
          matchTotal={matchActivityTotal}
          matchTrend={computeTrend(matchActivityData)}
          registrationTotal={registrationTotal}
          revenueTotal={fmtEur(monthlyRevenue)}
        />
      </div>

      {/* ── Santé de la plateforme + Engagement ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Platform health */}
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            {t.admin.platformHealth}
          </h2>
          <div className="space-y-4">
            {/* Fill rate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-surface-400">{t.admin.fillRate}</span>
                <span className={`text-sm font-bold ${avgFillPct >= 70 ? "text-pitch-400" : avgFillPct >= 40 ? "text-amber-400" : "text-danger-400"}`}>
                  {avgFillPct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${avgFillPct >= 70 ? "bg-pitch-500" : avgFillPct >= 40 ? "bg-amber-500" : "bg-danger-500"}`}
                  style={{ width: `${avgFillPct}%` }}
                />
              </div>
            </div>
            {/* Cancel rate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-surface-400">{t.admin.cancelRate}</span>
                <span className={`text-sm font-bold ${cancelRate <= 5 ? "text-pitch-400" : cancelRate <= 15 ? "text-amber-400" : "text-danger-400"}`}>
                  {cancelRate}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${cancelRate <= 5 ? "bg-pitch-500" : cancelRate <= 15 ? "bg-amber-500" : "bg-danger-500"}`}
                  style={{ width: `${Math.min(cancelRate, 100)}%` }}
                />
              </div>
            </div>
            {/* Conversion rate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-surface-400">{t.admin.conversionRate}</span>
                <span className={`text-sm font-bold ${conversionRate >= 30 ? "text-pitch-400" : conversionRate >= 15 ? "text-amber-400" : "text-danger-400"}`}>
                  {conversionRate}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${conversionRate >= 30 ? "bg-pitch-500" : conversionRate >= 15 ? "bg-amber-500" : "bg-danger-500"}`}
                  style={{ width: `${conversionRate}%` }}
                />
              </div>
            </div>
            {/* Stripe onboarding */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-surface-400">{t.admin.stripeOnboarding}</span>
                <span className="text-sm font-bold text-foreground">
                  {stripeOnboardedCount}/{totalOperators ?? 0}
                  <span className="text-surface-500 font-normal ml-1">({stripeOnboardRate}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${stripeOnboardRate}%` }} />
              </div>
            </div>
            {/* Summary row */}
            <div className="pt-2 border-t border-surface-800 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-surface-500">{t.common.matches} / {t.admin.operatorRole}</p>
                <p className="text-foreground font-semibold text-sm">{matchesPerOperator}</p>
              </div>
              <div>
                <p className="text-surface-500">{t.common.matches} / {t.admin.player}</p>
                <p className="text-foreground font-semibold text-sm">{matchesPerPlayer}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement */}
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
            {t.admin.engagement}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-800/50 rounded-xl p-3">
              <p className="text-xs text-surface-500 mb-0.5">{t.admin.recentSignups}</p>
              <p className="text-xl font-bold text-foreground">{totalRegistrations}</p>
            </div>
            <div className="bg-surface-800/50 rounded-xl p-3">
              <p className="text-xs text-surface-500 mb-0.5">{t.admin.operatorPayouts}</p>
              <p className="text-xl font-bold text-foreground">{fmtEur(totalPayoutsAmount)}</p>
            </div>
            <div className="bg-surface-800/50 rounded-xl p-3">
              <p className="text-xs text-surface-500 mb-0.5">{t.admin.avgRating}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xl font-bold text-foreground">
                  {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                </p>
                {avgRating > 0 && (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= Math.round(avgRating) ? "text-amber-400" : "text-surface-700"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-surface-800/50 rounded-xl p-3">
              <p className="text-xs text-surface-500 mb-0.5">{t.common.canceled}</p>
              <p className={`text-xl font-bold ${(canceledMatches ?? 0) === 0 ? "text-pitch-400" : "text-danger-400"}`}>
                {canceledMatches ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Abonnements + Prochains matchs ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Subscriptions */}
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            {t.admin.subscriptionsBreakdown}
            <span className="text-xs font-normal text-surface-400 ml-auto">{totalSubscriptions} au total</span>
          </h2>
          {totalSubscriptions === 0 ? (
            <p className="text-surface-400 text-sm">{t.common.none}</p>
          ) : (
            <div className="space-y-3">
              {(["active", "past_due", "canceled", "incomplete", "trialing"] as SubscriptionStatus[])
                .filter((status) => subscriptionBreakdown[status] > 0)
                .map((status) => {
                  const count = subscriptionBreakdown[status];
                  const pct = totalSubscriptions > 0 ? (count / totalSubscriptions) * 100 : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${subscriptionColors[status]}`} />
                      <span className="text-sm text-foreground min-w-[80px]">
                        {SUBSCRIPTION_STATUS_LABELS[status]}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-surface-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${subscriptionColors[status]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-400 min-w-[48px] text-right">
                        {count} ({Math.round(pct)}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Upcoming matches */}
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {t.admin.upcomingMatches}
            <span className="text-xs font-normal text-surface-400 ml-auto">{upcomingMatchesCount ?? 0}</span>
          </h2>
          {!recentMatchesDetailed || recentMatchesDetailed.length === 0 ? (
            <p className="text-surface-400 text-sm">{t.common.none}</p>
          ) : (
            <div className="space-y-3">
              {recentMatchesDetailed.map((match, i) => {
                const fillPct = match.capacity > 0
                  ? Math.round((match.registered_count / match.capacity) * 100)
                  : 0;
                const isFull = match.status === "full";
                const half = Math.floor(match.capacity / 2);
                const dateStr = new Date(match.date + "T00:00:00").toLocaleDateString(dateLocale, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                });
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-surface-800 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{match.title}</p>
                      <div className="flex items-center gap-2 text-xs text-surface-400 mt-0.5">
                        <span>{dateStr}</span>
                        <span className="text-surface-700">&middot;</span>
                        <span>{match.start_time?.slice(0, 5)}</span>
                        <span className="text-surface-700">&middot;</span>
                        <span>{match.venue_name}{match.city ? `, ${match.city}` : ""}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[10px] font-semibold bg-pitch-500/10 text-pitch-400 px-2 py-0.5 rounded-full">
                        {half}v{half}
                      </span>
                      {match.terrain_type && (
                        <span className="text-[10px] font-semibold bg-surface-800 text-surface-400 px-2 py-0.5 rounded-full">
                          {terrainLabels[match.terrain_type] ?? match.terrain_type}
                        </span>
                      )}
                      <div className="text-right min-w-[48px]">
                        <p className={`text-xs font-semibold ${isFull ? "text-amber-500" : "text-foreground"}`}>
                          {match.registered_count}/{match.capacity}
                        </p>
                        <div className="h-1 w-12 rounded-full bg-surface-800 overflow-hidden mt-0.5">
                          <div
                            className={`h-full rounded-full ${isFull ? "bg-amber-500" : fillPct >= 80 ? "bg-amber-400" : "bg-pitch-500"}`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Top organisateurs + Inscriptions récentes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top operators */}
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.853m0 0H12m0 0h-.54" />
            </svg>
            {t.admin.topOperators}
          </h2>
          {!topOperators || topOperators.length === 0 ? (
            <p className="text-surface-400 text-sm">{t.common.none}</p>
          ) : (
            <div className="space-y-2">
              {topOperators.map((op, i) => {
                const profile = op.profile as unknown as {
                  first_name: string;
                  last_name: string;
                  city: string | null;
                  origin_country: string | null;
                  favorite_club: string | null;
                };
                const rankColors = ["text-amber-400", "text-surface-300", "text-amber-700", "text-surface-500", "text-surface-500"];
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${i === 0 ? "bg-amber-500/5 border border-amber-500/10" : "hover:bg-surface-800/50"}`}
                  >
                    <span className={`text-sm font-bold w-6 text-center ${rankColors[i] ?? "text-surface-500"}`}>
                      #{i + 1}
                    </span>
                    <ProfileAvatar
                      firstName={profile?.first_name ?? ""}
                      lastName={profile?.last_name ?? ""}
                      country={profile?.origin_country}
                      clubSlug={profile?.favorite_club}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                      <p className="text-xs text-surface-400 truncate">
                        {profile?.city ?? "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {op.total_matches}
                        <span className="text-xs font-normal text-surface-500 ml-0.5">{t.common.matches}</span>
                      </p>
                      <div className="flex items-center justify-end gap-0.5">
                        <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-surface-400">
                          {op.rating?.toFixed(1) ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent signups */}
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            {t.admin.recentSignups}
          </h2>
          {!recentSignups || recentSignups.length === 0 ? (
            <p className="text-surface-400 text-sm">{t.common.none}</p>
          ) : (
            <div className="space-y-2">
              {recentSignups.map((user, i) => {
                const role = user.role as UserRole;
                const dateStr = new Date(user.created_at).toLocaleDateString(dateLocale, {
                  day: "numeric",
                  month: "short",
                });
                const timeStr = new Date(user.created_at).toLocaleTimeString(dateLocale, {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-800/50 transition-colors"
                  >
                    <ProfileAvatar
                      firstName={user.first_name}
                      lastName={user.last_name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-surface-400 truncate">
                        {user.email ?? user.city ?? "—"}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${roleBadgeStyles[role]}`}
                    >
                      {USER_ROLE_LABELS[role]}
                    </span>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-surface-400">{dateStr}</p>
                      <p className="text-[11px] text-surface-500">{timeStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
