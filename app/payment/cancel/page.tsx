"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function PaymentCancelPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-sm bg-surface-900 rounded-2xl p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
          <svg
            className="w-8 h-8 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374H4.844c1.73 0 2.813-1.874 1.948-3.374L13.949 4.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">
          {t.payment.cancelTitle}
        </h1>
        <p className="text-sm text-surface-400 mb-6">
          {t.payment.cancelDesc}
        </p>
        <Link
          href="/subscription"
          className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-surface-800 text-foreground font-semibold text-sm border border-surface-700 hover:bg-surface-700 transition-colors"
        >
          {t.payment.cancelCta}
        </Link>
      </div>
    </div>
  );
}
