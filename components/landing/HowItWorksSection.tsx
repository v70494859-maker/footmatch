"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

const stepIcons = [
  <svg key="signup" viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </svg>,
  <svg key="card" viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>,
  <svg key="search" viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>,
  <svg key="play" viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6l1.5 3.5L17 11l-3.5 1.5L12 16l-1.5-3.5L7 11l3.5-1.5z" />
  </svg>,
];

export default function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-surface-950/80">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t.howItWorks.heading}
          </h2>
          <p className="mt-3 text-surface-400 max-w-md mx-auto">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Connector line (desktop only) */}
          <div
            className="hidden lg:block absolute top-5 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px border-t-2 border-dashed border-surface-700"
            aria-hidden="true"
          />

          {t.howItWorks.steps.map((step, i) => (
            <div
              key={i}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number */}
              <div className="relative z-10 w-10 h-10 rounded-full bg-pitch-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-pitch-500/20">
                {i + 1}
              </div>

              {/* Icon */}
              <div className="mt-5 w-12 h-12 rounded-xl bg-surface-900 border border-surface-800 text-pitch-400 flex items-center justify-center">
                {stepIcons[i]}
              </div>

              {/* Text */}
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-surface-400 max-w-xs leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
