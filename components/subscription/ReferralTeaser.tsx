"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function ReferralTeaser() {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-pitch-500/20 bg-gradient-to-br from-pitch-950/30 to-surface-900 p-6">
      <div className="flex items-start gap-4">
        {/* Gift icon */}
        <div className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-full bg-pitch-500/10">
          <svg
            className="w-6 h-6 text-pitch-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              {t.subscription.referralTitle}
            </h3>
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-pitch-500/15 text-pitch-400 rounded-full px-2.5 py-0.5">
              {t.common.comingSoon}
            </span>
          </div>
          <p className="text-sm text-surface-400">
            {t.subscription.referralDesc}{" "}
            <span className="text-pitch-400 font-medium">{t.subscription.referralReward}</span>{" "}
            {t.subscription.referralDescEnd}
          </p>

          <button
            disabled
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-surface-800 px-4 py-2.5 text-sm font-medium text-surface-500 cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              />
            </svg>
            {t.subscription.shareLink}
          </button>
        </div>
      </div>
    </div>
  );
}
