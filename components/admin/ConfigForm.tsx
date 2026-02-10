"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";

/* ── Types ──────────────────────────────────────────── */

interface PlatformStats {
  activeSubscribers: number;
  totalOperators: number;
  stripeOnboarded: number;
  totalMatches: number;
  completedMatches: number;
  totalPaidOut: number;
  totalGross: number;
  totalFees: number;
  pendingPayouts: number;
}

interface ConfigFormProps {
  initialValues: Record<string, string>;
  updatedAts: Record<string, string>;
  stats: PlatformStats;
}

/* ── Helpers ─────────────────────────────────────────── */

function fmtEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Config field definitions ────────────────────────── */

/* Config fields are built inside the component to access translations */

/* ── Component ───────────────────────────────────────── */

export default function ConfigForm({ initialValues, updatedAts, stats }: ConfigFormProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const CONFIG_FIELDS = [
    {
      key: "subscription_price",
      label: t.admin.subscriptionPrice,
      description: "Prix mensuel facturé aux joueurs pour accéder à la plateforme.",
      type: "number" as const,
      step: "0.01",
      suffix: `€ ${t.common.perMonth}`,
      section: "subscription",
    },
    {
      key: "stripe_price_id",
      label: t.admin.stripePriceId,
      description: "Identifiant du produit d'abonnement dans Stripe. Créé dans le dashboard Stripe.",
      type: "text" as const,
      placeholder: "price_...",
      section: "stripe",
    },
    {
      key: "revenue_share_rate",
      label: t.admin.revenueShareRate,
      description: "Part des revenus d'abonnement redistribuée aux opérateurs (entre 0 et 1).",
      type: "number" as const,
      step: "0.01",
      section: "revenue",
    },
    {
      key: "min_payout_amount",
      label: t.admin.minPayoutAmount,
      description: "Seuil minimum avant déclenchement d'un virement opérateur.",
      type: "number" as const,
      step: "0.01",
      suffix: "€",
      section: "revenue",
    },
  ];

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // Live simulation values
  const price = parseFloat(values.subscription_price) || 0;
  const shareRate = parseFloat(values.revenue_share_rate) || 0;
  const minPayout = parseFloat(values.min_payout_amount) || 0;

  const simulation = useMemo(() => {
    const mrr = price * stats.activeSubscribers;
    const operatorPool = mrr * shareRate;
    const platformRevenue = mrr - operatorPool;
    const perOperator = stats.totalOperators > 0 ? operatorPool / stats.totalOperators : 0;
    const sharePercent = Math.round(shareRate * 100);
    const platformPercent = 100 - sharePercent;
    return { mrr, operatorPool, platformRevenue, perOperator, sharePercent, platformPercent };
  }, [price, shareRate, stats.activeSubscribers, stats.totalOperators]);

  const hasChanges = useMemo(() => {
    return CONFIG_FIELDS.some((f) => values[f.key] !== initialValues[f.key]);
  }, [values, initialValues, CONFIG_FIELDS]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();

    for (const field of CONFIG_FIELDS) {
      const rawValue = values[field.key];
      const jsonValue =
        field.type === "number"
          ? { value: parseFloat(rawValue) || 0 }
          : { value: rawValue ?? "" };

      const { error } = await supabase
        .from("platform_config")
        .upsert(
          { key: field.key, value: jsonValue, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) {
        setMessage({
          type: "error",
          text: `Échec de l'enregistrement de ${field.label} : ${error.message}`,
        });
        setSaving(false);
        return;
      }
    }

    setMessage({ type: "success", text: "Configuration enregistrée avec succès." });
    setSaving(false);
    router.refresh();
  }

  function renderField(field: typeof CONFIG_FIELDS[number]) {
    const changed = values[field.key] !== initialValues[field.key];
    const updatedAt = updatedAts[field.key];

    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">
            {field.label}
            {changed && (
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full">
                {t.admin.modified}
              </span>
            )}
          </label>
          {updatedAt && (
            <span className="text-[11px] text-surface-500">
              Modifié le {fmtDate(updatedAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-surface-500">{field.description}</p>
        <div className="relative">
          <input
            type={field.type}
            step={field.step}
            placeholder={field.placeholder}
            value={values[field.key] ?? ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className={`w-full bg-surface-800 border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-surface-500 focus:outline-none focus:ring-1 focus:ring-pitch-500 transition-colors ${
              changed ? "border-amber-500/50" : "border-surface-700"
            }`}
          />
          {field.suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-surface-500 pointer-events-none">
              {field.suffix}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Revenue simulation hero card ──────────────── */}
      <div className="bg-surface-900 rounded-2xl border border-surface-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
          </svg>
          <h2 className="text-base font-semibold text-foreground">
            {t.admin.revenueSimulation}
          </h2>
        </div>

        {/* Revenue flow */}
        <div className="bg-surface-800/50 rounded-xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Subscribers input */}
            <div className="flex-1 text-center">
              <p className="text-xs text-surface-500 mb-1">
                {stats.activeSubscribers} abonné{stats.activeSubscribers > 1 ? "s" : ""} × {fmtEur(price)}
              </p>
              <p className="text-3xl font-bold text-foreground">{fmtEur(simulation.mrr)}</p>
              <p className="text-xs text-surface-400 mt-0.5">{t.admin.mrr}</p>
            </div>

            <svg className="w-6 h-6 text-surface-600 mx-auto sm:mx-0 rotate-90 sm:rotate-0 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>

            {/* Split */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="bg-pitch-500/5 border border-pitch-500/10 rounded-xl p-3 text-center">
                <p className="text-xs text-surface-500 mb-0.5">{t.admin.platformShare} ({simulation.platformPercent}%)</p>
                <p className="text-lg font-bold text-pitch-400">{fmtEur(simulation.platformRevenue)}</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-center">
                <p className="text-xs text-surface-500 mb-0.5">{t.admin.operatorShare} ({simulation.sharePercent}%)</p>
                <p className="text-lg font-bold text-blue-400">{fmtEur(simulation.operatorPool)}</p>
              </div>
            </div>
          </div>

          {/* Revenue bar */}
          <div className="mt-4">
            <div className="h-3 rounded-full bg-surface-700 overflow-hidden flex">
              <div
                className="h-full bg-pitch-500 transition-all duration-300"
                style={{ width: `${simulation.platformPercent}%` }}
              />
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${simulation.sharePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface-800/50 rounded-xl p-3">
            <p className="text-[11px] text-surface-500">{t.admin.revenue} / {t.admin.operatorRole}</p>
            <p className="text-sm font-bold text-foreground">{fmtEur(simulation.perOperator)}</p>
            <p className="text-[11px] text-surface-500">{stats.totalOperators} {t.admin.operators}</p>
          </div>
          <div className="bg-surface-800/50 rounded-xl p-3">
            <p className="text-[11px] text-surface-500">{t.admin.operatorPayouts}</p>
            <p className="text-sm font-bold text-foreground">{fmtEur(stats.totalPaidOut)}</p>
            <p className="text-[11px] text-surface-500">{stats.pendingPayouts} {t.admin.pending}</p>
          </div>
          <div className="bg-surface-800/50 rounded-xl p-3">
            <p className="text-[11px] text-surface-500">{t.admin.platformRevenue}</p>
            <p className="text-sm font-bold text-pitch-400">{fmtEur(stats.totalFees)}</p>
            <p className="text-[11px] text-surface-500">{fmtEur(stats.totalGross)}</p>
          </div>
          <div className="bg-surface-800/50 rounded-xl p-3">
            <p className="text-[11px] text-surface-500">{t.admin.minPayoutAmount}</p>
            <p className="text-sm font-bold text-foreground">{fmtEur(minPayout)}</p>
            <p className="text-[11px] text-surface-500">
              {simulation.perOperator >= minPayout ? (
                <span className="text-pitch-400">Seuil atteint</span>
              ) : (
                <span className="text-amber-500">Sous le seuil</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Section: Abonnement ──────────────────────── */}
      <section className="bg-surface-900 rounded-2xl border border-surface-800 p-5 space-y-5">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <div>
            <h2 className="text-base font-semibold text-foreground">{t.admin.subscriptionPrice}</h2>
            <p className="text-xs text-surface-500">{t.admin.subscribers}</p>
          </div>
        </div>

        {renderField(CONFIG_FIELDS.find((f) => f.key === "subscription_price")!)}

        {/* Impact */}
        {stats.activeSubscribers > 0 && (
          <div className="bg-pitch-500/5 border border-pitch-500/10 rounded-xl px-4 py-3 flex items-start gap-3">
            <svg className="w-4 h-4 text-pitch-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <div className="text-xs text-surface-400">
              <p>
                Avec <span className="text-foreground font-medium">{stats.activeSubscribers} abonnés actifs</span>,
                un prix de <span className="text-foreground font-medium">{fmtEur(price)}/mois</span> génère{" "}
                <span className="text-pitch-400 font-semibold">{fmtEur(simulation.mrr)}/mois</span> de MRR.
              </p>
              {price !== parseFloat(initialValues.subscription_price) && (
                <p className="mt-1 text-amber-500">
                  Changement de {fmtEur(parseFloat(initialValues.subscription_price))}{" "}
                  → {fmtEur(price)} ({price > parseFloat(initialValues.subscription_price) ? "+" : ""}
                  {fmtEur(price - parseFloat(initialValues.subscription_price))}/abonné)
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Section: Revenus opérateurs ───────────────── */}
      <section className="bg-surface-900 rounded-2xl border border-surface-800 p-5 space-y-5">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h2 className="text-base font-semibold text-foreground">{t.admin.operatorPayouts}</h2>
            <p className="text-xs text-surface-500">{t.admin.revenueShareRate}</p>
          </div>
        </div>

        {renderField(CONFIG_FIELDS.find((f) => f.key === "revenue_share_rate")!)}

        {/* Share rate visual */}
        <div className="bg-surface-800/50 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between text-xs text-surface-400 mb-2">
            <span>{t.admin.platformShare} : {simulation.platformPercent}%</span>
            <span>{t.admin.operatorShare} : {simulation.sharePercent}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-surface-700 overflow-hidden flex">
            <div className="h-full bg-pitch-500 transition-all duration-300" style={{ width: `${simulation.platformPercent}%` }} />
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${simulation.sharePercent}%` }} />
          </div>
          <p className="text-[11px] text-surface-500 mt-2">
            Sur {fmtEur(simulation.mrr)} de MRR : la plateforme garde{" "}
            <span className="text-pitch-400">{fmtEur(simulation.platformRevenue)}</span>, les opérateurs reçoivent{" "}
            <span className="text-blue-400">{fmtEur(simulation.operatorPool)}</span>
          </p>
        </div>

        {renderField(CONFIG_FIELDS.find((f) => f.key === "min_payout_amount")!)}

        {/* Min payout context */}
        {stats.totalOperators > 0 && (
          <div className={`rounded-xl px-4 py-3 flex items-start gap-3 ${
            simulation.perOperator >= minPayout
              ? "bg-pitch-500/5 border border-pitch-500/10"
              : "bg-amber-500/5 border border-amber-500/10"
          }`}>
            <svg className={`w-4 h-4 mt-0.5 shrink-0 ${simulation.perOperator >= minPayout ? "text-pitch-400" : "text-amber-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div className="text-xs text-surface-400">
              {simulation.perOperator >= minPayout ? (
                <p>
                  Chaque opérateur recevrait en moyenne <span className="text-pitch-400 font-semibold">{fmtEur(simulation.perOperator)}</span>/mois,{" "}
                  au-dessus du seuil de {fmtEur(minPayout)}.
                </p>
              ) : (
                <p>
                  Revenu moyen par opérateur : <span className="text-amber-500 font-semibold">{fmtEur(simulation.perOperator)}</span>.{" "}
                  En dessous du seuil de {fmtEur(minPayout)} — les paiements seront différés.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Section: Stripe ──────────────────────────── */}
      <section className="bg-surface-900 rounded-2xl border border-surface-800 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            <div>
              <h2 className="text-base font-semibold text-foreground">Stripe</h2>
              <p className="text-xs text-surface-500">{t.admin.stripeOnboarding}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stats.stripeOnboarded > 0 ? "bg-pitch-500" : "bg-surface-500"}`} />
            <span className="text-xs text-surface-400">
              {stats.stripeOnboarded}/{stats.totalOperators} {t.admin.operators}
            </span>
          </div>
        </div>

        {renderField(CONFIG_FIELDS.find((f) => f.key === "stripe_price_id")!)}

        {/* Stripe status */}
        <div className="bg-surface-800/50 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[11px] text-surface-500 mb-0.5">{t.admin.stripeOnboarding}</p>
              <p className="text-lg font-bold text-foreground">{stats.stripeOnboarded}</p>
              <p className="text-[11px] text-surface-500">
                sur {stats.totalOperators}
                {stats.totalOperators > 0 && (
                  <span className="ml-0.5">({Math.round((stats.stripeOnboarded / stats.totalOperators) * 100)}%)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-surface-500 mb-0.5">{t.admin.completedMatches}</p>
              <p className="text-lg font-bold text-foreground">{stats.completedMatches}</p>
              <p className="text-[11px] text-surface-500">{stats.totalMatches} {t.admin.totalMatches}</p>
            </div>
            <div>
              <p className="text-[11px] text-surface-500 mb-0.5">{t.admin.operatorPayouts}</p>
              <p className="text-lg font-bold text-foreground">{fmtEur(stats.totalPaidOut)}</p>
              <p className="text-[11px] text-surface-500">via Stripe Connect</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Save bar ─────────────────────────────────── */}
      <div className={`sticky bottom-4 z-10 transition-all duration-300 ${hasChanges ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        <div className="bg-surface-900 border border-surface-800 rounded-2xl px-6 py-4 flex items-center justify-between shadow-xl shadow-black/50">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-sm text-surface-300">
              {t.admin.modified}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setValues(initialValues)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-surface-400 hover:text-foreground hover:bg-surface-800 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-pitch-500 text-surface-950 font-semibold text-sm hover:bg-pitch-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t.common.loading}
                </>
              ) : (
                t.common.save
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Non-sticky save button fallback + message */}
      {!hasChanges && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-pitch-500 text-surface-950 font-semibold text-sm hover:bg-pitch-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t.common.loading : t.common.save}
          </button>
          {message && (
            <p className={`text-sm font-medium ${message.type === "success" ? "text-pitch-400" : "text-danger-500"}`}>
              {message.text}
            </p>
          )}
        </div>
      )}

      {message && hasChanges && (
        <p className={`text-sm font-medium ${message.type === "success" ? "text-pitch-400" : "text-danger-500"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
