"use client";

import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/gamification/leaderboard";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import LevelBadge from "@/components/gamification/LevelBadge";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

function formatXp(xp: number): string {
  if (xp >= 10000) return `${(xp / 1000).toFixed(1)}k`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toLocaleString();
}

export default function LeaderboardRow({
  entry,
  isCurrentUser = false,
}: LeaderboardRowProps) {
  return (
    <Link
      href={`/players/${entry.userId}`}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-surface-800/60 ${
        isCurrentUser
          ? "bg-pitch-400/10 border border-pitch-400/20"
          : "border border-transparent"
      }`}
    >
      {/* Rank */}
      <span
        className={`w-8 text-center text-sm font-bold shrink-0 ${
          isCurrentUser ? "text-pitch-400" : "text-surface-400"
        }`}
      >
        {entry.rank}
      </span>

      {/* Avatar */}
      <ProfileAvatar
        firstName={entry.firstName}
        lastName={entry.lastName}
        size="xs"
      />

      {/* Name + City */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isCurrentUser ? "text-pitch-400" : "text-foreground"
          }`}
        >
          {entry.firstName} {entry.lastName}
        </p>
        {entry.city && (
          <p className="text-[10px] text-surface-500 truncate">{entry.city}</p>
        )}
      </div>

      {/* Badges count pill */}
      {entry.badgeCount > 0 && (
        <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-400 rounded-full px-1.5 py-0.5 shrink-0">
          {entry.badgeCount}
          <svg
            className="w-2.5 h-2.5 inline ml-0.5 -mt-px"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21 8 14l-6-4.6h7.6z" />
          </svg>
        </span>
      )}

      {/* XP + Level */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold text-surface-300">
          {formatXp(entry.xp)}
          <span className="text-surface-500 font-normal ml-0.5">XP</span>
        </span>
        <LevelBadge level={entry.level} size="sm" />
      </div>
    </Link>
  );
}
