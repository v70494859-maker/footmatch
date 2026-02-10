"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import Button from "@/components/ui/Button";

interface StripeConnectBannerProps {
  isOnboarded: boolean;
}

export default function StripeConnectBanner({ isOnboarded }: StripeConnectBannerProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/create-operator-account", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Impossible de démarrer l'inscription Stripe.");
        setLoading(false);
        return;
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch {
      setError("Une erreur inattendue s'est produite.");
      setLoading(false);
    }
  }

  if (isOnboarded) {
    return (
      <div className="bg-pitch-500/10 border border-pitch-500/20 rounded-2xl px-5 py-4 flex items-center gap-3">
        <svg
          className="w-5 h-5 text-pitch-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-pitch-400">{t.operator.stripeConnected}</p>
          <p className="text-xs text-surface-400">
            {t.operator.stripeConnect}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-500">
            {t.operator.setupStripe}
          </p>
          <p className="text-xs text-surface-400 mt-0.5">
            {t.operator.stripeConnect}
          </p>

          {error && (
            <p className="text-xs text-danger-500 mt-2">{error}</p>
          )}

          <div className="mt-3">
            <Button onClick={handleConnect} loading={loading}>
              {t.operator.setupStripe}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
