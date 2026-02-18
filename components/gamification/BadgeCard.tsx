"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { BadgeCategory, BadgeTier } from "@/types";

interface BadgeCardProps {
  definition: {
    id: string;
    category: BadgeCategory;
    tier: BadgeTier;
    icon: string;
    target: number;
  };
  unlocked: boolean;
  progress?: { current: number; target: number };
}

const tierBorderColors: Record<BadgeTier, string> = {
  bronze: "border-amber-700",
  silver: "border-surface-300",
  gold: "border-amber-400",
};

const tierPillColors: Record<BadgeTier, string> = {
  bronze: "fm-badge-bronze",
  silver: "fm-badge-silver",
  gold: "fm-badge-gold",
};

export default function BadgeCard({ definition, unlocked, progress }: BadgeCardProps) {
  const { t } = useTranslation();

  const badgeName = t.gamification.badgeNames[definition.id] ?? definition.id;
  const badgeDesc = t.gamification.badgeDescs[definition.id] ?? "";
  const tierLabel = t.gamification.tiers[definition.tier] ?? definition.tier;

  const borderClass = unlocked ? tierBorderColors[definition.tier] : "border-surface-800";
  const progressPct = progress && progress.target > 0
    ? Math.min(Math.round((progress.current / progress.target) * 100), 100)
    : 0;

  return (
    <div
      className={`rounded-xl border p-3 ${borderClass} ${
        unlocked ? "bg-surface-900" : "bg-surface-900/60"
      }`}
    >
      {/* Icon + tier */}
      <div className="flex items-start justify-between mb-2">
        <span
          className={`text-2xl leading-none ${unlocked ? "" : "grayscale opacity-40"}`}
        >
          {definition.icon}
        </span>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tierPillColors[definition.tier]} ${
            unlocked ? "" : "opacity-50"
          }`}
        >
          {tierLabel}
        </span>
      </div>

      {/* Name */}
      <p
        className={`text-sm font-semibold leading-tight mb-0.5 ${
          unlocked ? "text-foreground" : "text-surface-500"
        }`}
      >
        {badgeName}
      </p>

      {/* Description */}
      <p
        className={`text-[11px] leading-snug mb-2 ${
          unlocked ? "text-surface-400" : "text-surface-600"
        }`}
      >
        {badgeDesc}
      </p>

      {/* Progress bar (locked badges only) */}
      {!unlocked && progress && (
        <div>
          <div className="h-1.5 w-full rounded-full bg-surface-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-surface-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[10px] text-surface-500 mt-1">
            {progress.current} / {progress.target}
          </p>
        </div>
      )}

      {/* Unlocked indicator */}
      {unlocked && (
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-pitch-400" />
          <span className="text-[10px] text-pitch-400 font-medium">
            {t.gamification.badgeUnlocked}
          </span>
        </div>
      )}
    </div>
  );
}
