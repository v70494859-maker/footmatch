"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { SUBSCRIPTION_PRICE, SUBSCRIPTION_CURRENCY } from "@/lib/constants";
import { formatPrice } from "@/lib/format";

export default function PricingCard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const FEATURES = [
    t.subscription.unlimitedMatches,
    t.subscription.browseAll,
    t.subscription.instantRegistration,
    t.subscription.cancelAnytime,
  ];

  async function handleSubscribe() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.subscription.cannotCreateSession);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-surface-800 bg-surface-900 p-8 max-w-sm w-full relative overflow-hidden">
      {/* Trial badge */}
      <div className="flex justify-center mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-pitch-500/15 text-pitch-400 border border-pitch-500/30">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t.subscription.trialBadge}
        </span>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {t.subscription.premium}
        </h3>
        <p className="text-surface-400 text-sm">
          {t.subscription.everythingToPlay}
        </p>
      </div>

      <div className="text-center mb-2">
        <span className="text-4xl font-bold text-foreground">
          {formatPrice(SUBSCRIPTION_PRICE, SUBSCRIPTION_CURRENCY)}
        </span>
        <span className="text-surface-400 text-sm ml-1">{t.common.perMonth}</span>
      </div>

      <p className="text-center text-pitch-400 text-xs font-medium mb-6">
        {t.subscription.trialInfo}
      </p>

      <ul className="space-y-3 mb-8">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm text-surface-200">
            <svg
              className="h-4 w-4 shrink-0 text-pitch-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {error && (
        <p className="text-danger-500 text-sm text-center mb-4">{error}</p>
      )}

      <Button
        fullWidth
        loading={loading}
        onClick={handleSubscribe}
      >
        {t.subscription.subscribe}
      </Button>
    </div>
  );
}
