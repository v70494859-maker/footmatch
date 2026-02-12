"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type SectionId = "levels" | "xp" | "badges";

const SECTION_IDS: SectionId[] = ["levels", "xp", "badges"];

function getLevelStyle(level: number): string {
  if (level >= 8) return "bg-gradient-to-br from-amber-500 to-red-500 text-white";
  if (level >= 6) return "bg-amber-500 text-surface-950";
  if (level >= 4) return "bg-pitch-500 text-white";
  return "bg-surface-600 text-surface-100";
}

export default function FAQView() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SectionId>("levels");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  function scrollTo(id: SectionId) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  }

  const f = t.faq;

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/profile"
          className="text-sm text-surface-400 hover:text-foreground transition-colors"
        >
          &larr; {t.nav.profile}
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-3">
          {f.pageTitle}
        </h1>
        <p className="text-sm text-surface-400 mt-1">{f.pageSubtitle}</p>
      </div>

      <div className="flex gap-8">
        {/* Side nav — desktop */}
        <nav className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-6 space-y-1">
            {SECTION_IDS.map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`block w-full text-left text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  activeSection === id
                    ? "bg-pitch-400/10 text-pitch-400"
                    : "text-surface-400 hover:text-surface-200 hover:bg-surface-900"
                }`}
              >
                {f.sections[id]}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile nav — horizontal scroll */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface-950/90 backdrop-blur-lg border-b border-surface-800 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {SECTION_IDS.map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`shrink-0 text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                  activeSection === id
                    ? "bg-pitch-400/15 text-pitch-400"
                    : "text-surface-400 hover:text-surface-200"
                }`}
              >
                {f.sections[id]}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-10 lg:mt-0 mt-10">
          {/* Levels section */}
          <section id="levels" className="scroll-mt-20">
            <h2 className="text-lg font-bold text-foreground mb-2">
              {f.levels.title}
            </h2>
            <p className="text-sm text-surface-400 leading-relaxed mb-5">
              {f.levels.intro}
            </p>

            <div className="space-y-3">
              {f.levels.items.map(
                (item: { level: number; name: string; xp: string; desc: string }) => (
                  <div
                    key={item.level}
                    className="flex items-center gap-4 bg-surface-900 border border-surface-800 rounded-xl px-4 py-3"
                  >
                    <div
                      className={`w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center shrink-0 ${getLevelStyle(item.level)}`}
                    >
                      {item.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {item.name}
                        </span>
                        <span className="text-xs text-surface-500">
                          {item.xp}
                        </span>
                      </div>
                      <p className="text-xs text-surface-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* XP section */}
          <section id="xp" className="scroll-mt-20">
            <h2 className="text-lg font-bold text-foreground mb-2">
              {f.xp.title}
            </h2>
            <p className="text-sm text-surface-400 leading-relaxed mb-5">
              {f.xp.intro}
            </p>

            <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto] text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-2.5 border-b border-surface-800">
                <span>{f.xp.tableAction}</span>
                <span>{f.xp.tableXp}</span>
              </div>
              {f.xp.items.map(
                (item: { action: string; xp: string }, i: number) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1fr_auto] px-4 py-2.5 text-sm ${
                      i % 2 === 0 ? "bg-surface-900" : "bg-surface-800/30"
                    }`}
                  >
                    <span className="text-surface-300">{item.action}</span>
                    <span className="font-semibold text-pitch-400">
                      {item.xp}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-2 text-sm text-surface-400">
                <span className="text-amber-400 mt-0.5 shrink-0">!</span>
                <span>{f.xp.dailyCap}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-surface-400">
                <span className="text-amber-400 mt-0.5 shrink-0">!</span>
                <span>{f.xp.streakCap}</span>
              </div>
            </div>
          </section>

          {/* Badges section */}
          <section id="badges" className="scroll-mt-20">
            <h2 className="text-lg font-bold text-foreground mb-2">
              {f.badges.title}
            </h2>
            <p className="text-sm text-surface-400 leading-relaxed mb-5">
              {f.badges.intro}
            </p>

            <h3 className="text-sm font-semibold text-surface-300 mb-3">
              {f.badges.categories}
            </h3>
            <div className="space-y-2.5">
              {f.badges.categoryList.map(
                (cat: { name: string; desc: string }, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-surface-900 border border-surface-800 rounded-xl px-4 py-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-pitch-400 mt-1.5 shrink-0" />
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        {cat.name}
                      </span>
                      <p className="text-xs text-surface-400 mt-0.5">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 text-sm text-surface-400">
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-surface-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              </div>
              <span>{f.badges.tiers}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
