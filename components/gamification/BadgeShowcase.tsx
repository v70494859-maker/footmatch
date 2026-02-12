"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { BADGE_DEFINITIONS } from "@/lib/gamification/badges";
import type { UserBadge, BadgeProgress, BadgeCategory } from "@/types";
import BadgeCard from "./BadgeCard";

interface BadgeShowcaseProps {
  badges: UserBadge[];
  progress: BadgeProgress[];
  maxVisible?: number;
}

const CATEGORY_ORDER: BadgeCategory[] = ["volume", "exploration", "social", "reliability", "special"];

export default function BadgeShowcase({ badges, progress, maxVisible }: BadgeShowcaseProps) {
  const { t } = useTranslation();

  const unlockedIds = useMemo(
    () => new Set(badges.map((b) => b.badge_id)),
    [badges]
  );

  const progressMap = useMemo(
    () => new Map(progress.map((p) => [p.badge_id, p])),
    [progress]
  );

  // Group badge definitions by category
  const grouped = useMemo(() => {
    const groups = new Map<BadgeCategory, typeof BADGE_DEFINITIONS>();
    for (const cat of CATEGORY_ORDER) {
      groups.set(cat, []);
    }
    for (const def of BADGE_DEFINITIONS) {
      const arr = groups.get(def.category);
      if (arr) arr.push(def);
    }
    return groups;
  }, []);

  // Sort within each category: unlocked first, then by progress desc
  const sortedGroups = useMemo(() => {
    const result = new Map<BadgeCategory, typeof BADGE_DEFINITIONS>();
    for (const [cat, defs] of grouped) {
      const sorted = [...defs].sort((a, b) => {
        const aUnlocked = unlockedIds.has(a.id) ? 1 : 0;
        const bUnlocked = unlockedIds.has(b.id) ? 1 : 0;
        if (aUnlocked !== bUnlocked) return bUnlocked - aUnlocked;
        const aProgress = progressMap.get(a.id);
        const bProgress = progressMap.get(b.id);
        const aPct = aProgress ? aProgress.current / aProgress.target : 0;
        const bPct = bProgress ? bProgress.current / bProgress.target : 0;
        return bPct - aPct;
      });
      result.set(cat, sorted);
    }
    return result;
  }, [grouped, unlockedIds, progressMap]);

  const totalUnlocked = badges.length;
  const totalBadges = BADGE_DEFINITIONS.length;

  if (totalBadges === 0) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t.gamification.badges}
        </h3>
        <span className="text-xs text-surface-400">
          {t.gamification.unlockedBadges}: {totalUnlocked} / {totalBadges}
        </span>
      </div>

      {totalUnlocked === 0 && (
        <p className="text-sm text-surface-500 text-center py-4">
          {t.gamification.noBadgesYet}
        </p>
      )}

      {/* Category groups */}
      {CATEGORY_ORDER.map((category) => {
        const defs = sortedGroups.get(category);
        if (!defs || defs.length === 0) return null;

        const visibleDefs = maxVisible ? defs.slice(0, maxVisible) : defs;
        const categoryUnlocked = defs.filter((d) => unlockedIds.has(d.id)).length;

        return (
          <div key={category}>
            {/* Category header */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                {t.gamification.categories[category]}
              </h4>
              <span className="text-[10px] text-surface-500">
                {categoryUnlocked} / {defs.length}
              </span>
            </div>

            {/* Badge grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visibleDefs.map((def) => {
                const isUnlocked = unlockedIds.has(def.id);
                const prog = progressMap.get(def.id);

                return (
                  <BadgeCard
                    key={def.id}
                    definition={{
                      id: def.id,
                      category: def.category,
                      tier: def.tier,
                      icon: def.icon,
                      target: def.target,
                    }}
                    unlocked={isUnlocked}
                    progress={
                      !isUnlocked && prog
                        ? { current: prog.current, target: prog.target }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
