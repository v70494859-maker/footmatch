"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-24 lg:py-36 overflow-hidden">
      {/* Background glow effect */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-pitch-500/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-pitch-500/30 bg-pitch-500/5 text-xs font-semibold text-pitch-400 mb-8">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          {t.hero.badge}
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
          {t.hero.headlineMain}
          <br />
          <span className="text-pitch-400">{t.hero.headlineAccent}</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg text-surface-400 max-w-xl mx-auto leading-relaxed">
          {t.hero.subtitle}
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-pitch-500 text-white font-semibold text-sm hover:bg-pitch-400 transition-colors shadow-lg shadow-pitch-500/20"
          >
            {t.hero.cta}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-4 h-4 ml-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <p className="text-xs text-surface-500">
            {t.hero.ctaSub}
          </p>
        </div>
      </div>
    </section>
  );
}
