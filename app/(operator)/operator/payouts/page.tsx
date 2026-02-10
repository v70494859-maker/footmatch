import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, getDateLocale } from "@/lib/i18n/server";
import type { OperatorPayout } from "@/types";
import PayoutHistory from "@/components/operator/PayoutHistory";
import StripeConnectBanner from "@/components/operator/StripeConnectBanner";

export const dynamic = "force-dynamic";

export const metadata = { title: "FootMatch Opérateur - Paiements" };

function fmtEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default async function OperatorPayoutsPage() {
  const t = await getTranslations();
  const dateLocale = await getDateLocale();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: operator } = await supabase
    .from("operators")
    .select("id, stripe_onboarded, total_matches")
    .eq("profile_id", user.id)
    .single();

  if (!operator) redirect("/matches");

  // Parallel fetches
  const [{ data: payouts }, { data: matchRows }] = await Promise.all([
    supabase
      .from("operator_payouts")
      .select("*")
      .eq("operator_id", operator.id)
      .order("period_end", { ascending: false }),
    supabase
      .from("matches")
      .select("registered_count, capacity, status")
      .eq("operator_id", operator.id),
  ]);

  const typedPayouts = (payouts as OperatorPayout[] | null) ?? [];
  const allMatches = matchRows ?? [];

  // Payout stats
  const completedPayouts = typedPayouts.filter((p) => p.status === "completed");
  const pendingPayouts = typedPayouts.filter(
    (p) => p.status === "pending" || p.status === "processing"
  );
  const failedPayouts = typedPayouts.filter((p) => p.status === "failed");

  const totalEarned = completedPayouts.reduce((sum, p) => sum + p.net_amount, 0);
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.net_amount, 0);
  const totalGross = typedPayouts.reduce((sum, p) => sum + p.gross_amount, 0);
  const totalFees = typedPayouts.reduce((sum, p) => sum + p.platform_fee, 0);
  const totalRegistrations = typedPayouts.reduce((sum, p) => sum + p.total_registrations, 0);
  const completedCount = completedPayouts.length;
  const averagePerPayout = completedCount > 0 ? totalEarned / completedCount : 0;
  const feeRate = totalGross > 0 ? Math.round((totalFees / totalGross) * 100) : 0;

  const sortedCompleted = [...completedPayouts].sort(
    (a, b) => new Date(b.period_end).getTime() - new Date(a.period_end).getTime()
  );
  const lastPayout = sortedCompleted[0] ?? null;
  const bestPayout = completedPayouts.length > 0
    ? completedPayouts.reduce((best, p) => p.net_amount > best.net_amount ? p : best)
    : null;
  const avgRegistrationsPerPayout = completedCount > 0
    ? Math.round(
        completedPayouts.reduce((sum, p) => sum + p.total_registrations, 0) / completedCount
      )
    : 0;

  // Match stats for context
  const completedMatches = allMatches.filter((m) => m.status === "completed").length;
  const totalPlayers = allMatches.reduce((sum, m) => sum + m.registered_count, 0);

  return (
    <div className="pb-24 lg:pb-8">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t.operator.payouts}</h1>

        {/* Stripe Connect status banner */}
        <div className="mb-6">
          <StripeConnectBanner isOnboarded={operator.stripe_onboarded} />
        </div>

        {/* Main earnings card */}
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">
                {t.operator.revenue}
              </p>
              <p className="text-4xl font-bold text-foreground">
                {fmtEur(totalEarned)}
              </p>
              {totalPending > 0 && (
                <p className="text-sm text-amber-500 mt-1">
                  + {fmtEur(totalPending)} {t.operator.payoutPending.toLowerCase()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-surface-500">{t.operator.grossAmount}</p>
                <p className="text-sm font-semibold text-foreground">{fmtEur(totalGross)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-surface-500">{t.operator.platformFee}</p>
                <p className="text-sm font-semibold text-danger-500">
                  -{fmtEur(totalFees)}
                  {feeRate > 0 && (
                    <span className="text-xs font-normal text-surface-500 ml-1">({feeRate}%)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Progress context */}
          {completedMatches > 0 && (
            <div className="border-t border-surface-800 mt-4 pt-4 flex items-center gap-4 flex-wrap text-xs text-surface-400">
              <span>
                {completedMatches} {completedMatches > 1 ? t.common.matchPlural : t.common.match} {t.common.completed.toLowerCase()}
              </span>
              <span className="text-surface-700">&middot;</span>
              <span>{totalPlayers} {t.common.participants}</span>
              {lastPayout && (
                <>
                  <span className="text-surface-700">&middot;</span>
                  <span>
                    {t.operator.lastPayoutOn}{" "}
                    {new Date(lastPayout.period_end + "T00:00:00").toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-4">
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">
              {t.operator.payoutHistory}
            </p>
            <p className="text-2xl font-bold text-foreground">{completedCount}</p>
            {failedPayouts.length > 0 && (
              <p className="text-xs text-danger-500 mt-0.5">
                {failedPayouts.length} {t.operator.payoutFailed}
              </p>
            )}
          </div>
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-4">
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">
              {t.operator.netAmount}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {completedCount > 0 ? fmtEur(averagePerPayout) : "—"}
            </p>
          </div>
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-4">
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">
              {t.operator.payoutCompleted}
            </p>
            <p className="text-2xl font-bold text-pitch-400">
              {bestPayout ? fmtEur(bestPayout.net_amount) : "—"}
            </p>
            {bestPayout && (
              <p className="text-xs text-surface-500 mt-0.5">
                {bestPayout.total_registrations} {t.operator.totalRegistrations.toLowerCase()}
              </p>
            )}
          </div>
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-4">
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">
              {t.operator.totalRegistrations}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {avgRegistrationsPerPayout > 0 ? avgRegistrationsPerPayout : "—"}
            </p>
            <p className="text-xs text-surface-500 mt-0.5">
              {totalRegistrations} {t.common.inTotal}
            </p>
          </div>
        </div>

        {/* Payout history */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t.common.history}</h2>
            <span className="text-xs text-surface-400">
              {typedPayouts.length} {t.operator.payoutHistory}
            </span>
          </div>
          <PayoutHistory payouts={typedPayouts} />
        </div>
      </div>
    </div>
  );
}
