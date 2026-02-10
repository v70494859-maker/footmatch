"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

const statKeys = ["subscribers", "matches", "cities", "operators"] as const;

export default function StatsSection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 border-t border-surface-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statKeys.map((key) => {
            const stat = t.stats[key];
            return (
              <div key={key} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-pitch-400">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-xs text-surface-500">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
