import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/lib/i18n/server";
import type { PlatformConfig } from "@/types";
import ConfigForm from "@/components/admin/ConfigForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "FootMatch Admin - Configuration" };

function extractConfigValue(val: Record<string, unknown>): string {
  if ("value" in val) return String(val.value);
  if ("amount" in val) return String(val.amount);
  if ("rate" in val) return String(val.rate);
  if ("id" in val) return String(val.id);
  return JSON.stringify(val);
}

export default async function AdminConfigPage() {
  const supabase = await createClient();
  const t = await getTranslations();

  const [
    { data: configs },
    { count: activeSubscribers },
    { count: totalOperators },
    { data: completedPayouts },
    { count: totalMatches },
    { count: completedMatches },
    { data: onboardedOps },
    { count: pendingPayouts },
  ] = await Promise.all([
    supabase.from("platform_config").select("*").order("key"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("operators").select("*", { count: "exact", head: true }),
    supabase.from("operator_payouts").select("net_amount, gross_amount, platform_fee").eq("status", "completed"),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("operators").select("id").eq("stripe_onboarded", true),
    supabase.from("operator_payouts").select("*", { count: "exact", head: true }).in("status", ["pending", "processing"]),
  ]);

  const configRows = (configs ?? []) as PlatformConfig[];

  const initialValues: Record<string, string> = {};
  const updatedAts: Record<string, string> = {};
  for (const row of configRows) {
    const val = row.value;
    if (typeof val === "object" && val !== null) {
      initialValues[row.key] = extractConfigValue(val as Record<string, unknown>);
    } else {
      initialValues[row.key] = JSON.stringify(val);
    }
    updatedAts[row.key] = row.updated_at;
  }

  const totalPaidOut = (completedPayouts ?? []).reduce((sum, p) => sum + (p.net_amount ?? 0), 0);
  const totalGross = (completedPayouts ?? []).reduce((sum, p) => sum + (p.gross_amount ?? 0), 0);
  const totalFees = (completedPayouts ?? []).reduce((sum, p) => sum + (p.platform_fee ?? 0), 0);

  return (
    <div className="max-w-4xl pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t.admin.configTitle}</h1>
        <p className="text-sm text-surface-400 mt-1">
          {t.admin.configSubtitle}
        </p>
      </div>
      <ConfigForm
        initialValues={initialValues}
        updatedAts={updatedAts}
        stats={{
          activeSubscribers: activeSubscribers ?? 0,
          totalOperators: totalOperators ?? 0,
          stripeOnboarded: (onboardedOps ?? []).length,
          totalMatches: totalMatches ?? 0,
          completedMatches: completedMatches ?? 0,
          totalPaidOut,
          totalGross,
          totalFees,
          pendingPayouts: pendingPayouts ?? 0,
        }}
      />
    </div>
  );
}
