"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { LeaderboardEntry } from "@/lib/gamification/leaderboard";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import LevelBadge from "@/components/gamification/LevelBadge";

interface PodiumDisplayProps {
  entries: LeaderboardEntry[];
}

function formatXp(xp: number): string {
  if (xp >= 10000) return `${(xp / 1000).toFixed(1)}k`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toLocaleString();
}

export default function PodiumDisplay({ entries }: PodiumDisplayProps) {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  // Ensure we have up to 3 entries, padded with null
  const first = entries[0] ?? null;
  const second = entries[1] ?? null;
  const third = entries[2] ?? null;

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-4">
        {t.gamification.podium}
      </h3>

      <div className="flex items-end justify-center gap-2 sm:gap-4">
        {/* #2 - Silver (left) */}
        {second ? (
          <PodiumSlot
            entry={second}
            rank={2}
            accentColor="text-surface-300"
            accentBg="bg-surface-300"
            pedestalHeight="h-20"
            avatarSize="sm"
            badgeSize="sm"
          />
        ) : (
          <div className="flex-1 max-w-[140px]" />
        )}

        {/* #1 - Gold (center, elevated) */}
        {first ? (
          <PodiumSlot
            entry={first}
            rank={1}
            accentColor="text-amber-400"
            accentBg="bg-amber-400"
            pedestalHeight="h-28"
            avatarSize="md"
            badgeSize="sm"
            isFirst
          />
        ) : (
          <div className="flex-1 max-w-[140px]" />
        )}

        {/* #3 - Bronze (right) */}
        {third ? (
          <PodiumSlot
            entry={third}
            rank={3}
            accentColor="text-amber-700"
            accentBg="bg-amber-700"
            pedestalHeight="h-16"
            avatarSize="sm"
            badgeSize="sm"
          />
        ) : (
          <div className="flex-1 max-w-[140px]" />
        )}
      </div>
    </div>
  );
}

function PodiumSlot({
  entry,
  rank,
  accentColor,
  accentBg,
  pedestalHeight,
  avatarSize,
  badgeSize,
  isFirst,
}: {
  entry: LeaderboardEntry;
  rank: number;
  accentColor: string;
  accentBg: string;
  pedestalHeight: string;
  avatarSize: "sm" | "md";
  badgeSize: "sm" | "md";
  isFirst?: boolean;
}) {
  return (
    <div className="flex-1 max-w-[140px] flex flex-col items-center">
      {/* Crown icon for #1 */}
      {isFirst && (
        <svg
          className="w-6 h-6 text-amber-400 mb-1"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
        </svg>
      )}

      {/* Avatar */}
      <div className="relative mb-1.5">
        <ProfileAvatar
          firstName={entry.firstName}
          lastName={entry.lastName}
          size={avatarSize}
          href={`/players/${entry.userId}`}
        />
      </div>

      {/* Name */}
      <p
        className={`text-xs font-semibold text-foreground text-center line-clamp-1 ${
          isFirst ? "text-sm" : ""
        }`}
      >
        {entry.firstName}
      </p>

      {/* XP */}
      <p className={`text-[10px] font-bold ${accentColor} mt-0.5`}>
        {formatXp(entry.xp)} XP
      </p>

      {/* Level badge */}
      <div className="mt-1">
        <LevelBadge level={entry.level} size={badgeSize} />
      </div>

      {/* Pedestal */}
      <div
        className={`${pedestalHeight} w-full mt-2 rounded-t-lg ${accentBg}/15 border border-b-0 ${accentBg.replace(
          "bg-",
          "border-"
        )}/20 flex items-center justify-center`}
      >
        <span className={`text-2xl font-black ${accentColor}`}>{rank}</span>
      </div>
    </div>
  );
}
