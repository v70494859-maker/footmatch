"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function PricingSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 border-t border-surface-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t.pricing.heading}
          </h2>
          <p className="mt-3 text-surface-400 max-w-md mx-auto">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Player card */}
          <div className="bg-surface-900 rounded-2xl border border-pitch-500/30 p-8 relative overflow-hidden">
            {/* Glow */}
            <div
              className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-pitch-500/10 blur-3xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-pitch-400">
                  {t.pricing.player.label}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wide bg-pitch-500/10 text-pitch-400 px-2 py-0.5 rounded-full">
                  {t.pricing.player.trialBadge}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  {t.pricing.player.price}
                </span>
                <span className="text-surface-400 text-sm">
                  {t.pricing.player.period}
                </span>
              </div>
              <p className="mt-3 text-sm text-surface-400">
                {t.pricing.player.description}
              </p>

              <ul className="mt-6 space-y-3">
                {t.pricing.player.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckIcon className="w-4 h-4 mt-0.5 text-pitch-400 shrink-0" />
                    <span className="text-sm text-surface-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className="mt-8 inline-flex items-center justify-center w-full h-11 rounded-xl bg-pitch-500 text-white font-semibold text-sm hover:bg-pitch-400 transition-colors shadow-lg shadow-pitch-500/20"
              >
                {t.pricing.player.cta}
              </Link>
              <p className="mt-2 text-center text-[11px] text-surface-500">
                {t.pricing.player.ctaSub}
              </p>
            </div>
          </div>

          {/* Operator card */}
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-8 flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
              {t.pricing.operator.label}
            </p>
            <h3 className="text-2xl font-bold text-foreground">
              {t.pricing.operator.heading}
            </h3>
            <p className="mt-3 text-sm text-surface-400 leading-relaxed flex-1">
              {t.pricing.operator.description}
            </p>

            <ul className="mt-6 space-y-3">
              {t.pricing.operator.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <CheckIcon className="w-4 h-4 mt-0.5 text-surface-400 shrink-0" />
                  <span className="text-sm text-surface-300">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/operator-onboarding"
              className="mt-8 inline-flex items-center justify-center w-full h-11 rounded-xl bg-surface-800 text-foreground font-semibold text-sm border border-surface-700 hover:bg-surface-700 transition-colors"
            >
              {t.pricing.operator.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
