"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function PaymentSuccessPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-sm bg-surface-900 rounded-2xl p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pitch-900/50 mb-4">
          <svg
            className="w-8 h-8 text-pitch-400"
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
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">
          {t.payment.successTitle}
        </h1>
        <p className="text-sm text-surface-400 mb-6">
          {t.payment.successDesc}
        </p>
        <Link
          href="/matches"
          className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-pitch-500 text-surface-950 font-semibold text-sm hover:bg-pitch-400 transition-colors"
        >
          {t.payment.successCta}
        </Link>
      </div>
    </div>
  );
}
