"use client";

import Link from "next/link";
import Image from "next/image";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import LevelBadge from "@/components/gamification/LevelBadge";
import { getClubLogo } from "@/lib/clubs";
import { getFlagForCountry } from "@/lib/cities";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface ProfileWidgetProps {
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    city: string | null;
    origin_country: string | null;
    favorite_club: string | null;
  };
  level: number;
  totalXp: number;
  currentStreak: number;
  friendCount: number;
  teamCount: number;
  matchesPlayed: number;
  pendingRequests: number;
  unreadMessages: number;
}

export default function ProfileWidget({
  profile,
  level,
  totalXp,
  currentStreak,
  friendCount,
  teamCount,
  matchesPlayed,
  pendingRequests,
  unreadMessages,
}: ProfileWidgetProps) {
  const { t } = useTranslation();
  const flag = getFlagForCountry(profile.origin_country);

  return (
    <div className="sticky top-4 space-y-4">
      {/* Card 1 — Profile */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-16 bg-gradient-to-r from-pitch-900/80 via-pitch-800/40 to-surface-900" />

        {/* Avatar + Info */}
        <div className="-mt-10 px-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={`${profile.first_name} ${profile.last_name}`}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full border-4 border-surface-900 object-cover"
            />
          ) : (
            <div className="inline-block border-4 border-surface-900 rounded-full">
              <ProfileAvatar
                firstName={profile.first_name}
                lastName={profile.last_name}
                size="lg"
              />
            </div>
          )}
        </div>

        <div className="px-4 pt-2 pb-4 space-y-2">
          {/* Name */}
          <Link
            href={`/players/${profile.id}`}
            className="block text-lg font-bold text-surface-50 hover:text-pitch-400 transition-colors"
          >
            {profile.first_name} {profile.last_name}
          </Link>

          {/* City + Flag */}
          {profile.city && (
            <div className="flex items-center gap-1.5 text-sm text-surface-400">
              <svg
                className="w-3.5 h-3.5 text-surface-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
              <span>
                {profile.city}
                {flag && <span className="ml-1">{flag}</span>}
              </span>
            </div>
          )}

          {/* Club */}
          {profile.favorite_club && (
            <div className="flex items-center gap-1.5 text-sm text-surface-400">
              <Image
                src={getClubLogo(profile.favorite_club)}
                alt={profile.favorite_club}
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
              <span>{profile.favorite_club}</span>
            </div>
          )}

          {/* Level + XP + Streak */}
          <div className="flex items-center gap-2 text-sm">
            <LevelBadge level={level} size="sm" />
            <span className="text-surface-400">{totalXp} XP</span>
            {currentStreak > 0 && (
              <span className="text-surface-400">
                <span className="mr-0.5">&#x1F525;</span>
                {currentStreak}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-surface-800" />

        {/* Stats grid */}
        <div className="grid grid-cols-3 divide-x divide-surface-800">
          <Link
            href="/social/friends"
            className="flex flex-col items-center py-3 hover:bg-surface-800/50 transition-colors"
          >
            <span className="text-base font-bold text-surface-50">
              {friendCount}
            </span>
            <span className="text-xs text-surface-500">Amis</span>
          </Link>
          <div className="flex flex-col items-center py-3">
            <span className="text-base font-bold text-surface-50">
              {matchesPlayed}
            </span>
            <span className="text-xs text-surface-500">Matchs</span>
          </div>
          <Link
            href="/social/teams"
            className="flex flex-col items-center py-3 hover:bg-surface-800/50 transition-colors"
          >
            <span className="text-base font-bold text-surface-50">
              {teamCount}
            </span>
            <span className="text-xs text-surface-500">Teams</span>
          </Link>
        </div>
      </div>

      {/* Card 2 — Quick Nav */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
        {/* Amis */}
        <Link
          href="/social/friends"
          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/50 transition-colors border-b border-surface-800/50"
        >
          <svg
            className="w-5 h-5 text-surface-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
            />
          </svg>
          <span className="text-sm text-surface-50 flex-1">Amis</span>
          {pendingRequests > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-pitch-400 text-surface-950 text-xs font-bold flex items-center justify-center">
              {pendingRequests}
            </span>
          )}
        </Link>

        {/* Teams */}
        <Link
          href="/social/teams"
          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/50 transition-colors border-b border-surface-800/50"
        >
          <svg
            className="w-5 h-5 text-surface-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
            />
          </svg>
          <span className="text-sm text-surface-50 flex-1">Teams</span>
        </Link>

        {/* Messages */}
        <Link
          href="/social/messages"
          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/50 transition-colors border-b border-surface-800/50"
        >
          <svg
            className="w-5 h-5 text-surface-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
            />
          </svg>
          <span className="text-sm text-surface-50 flex-1">Messages</span>
          {unreadMessages > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-pitch-400 text-surface-950 text-xs font-bold flex items-center justify-center">
              {unreadMessages}
            </span>
          )}
        </Link>

        {/* Classement */}
        <Link
          href="/leaderboard"
          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/50 transition-colors"
        >
          <svg
            className="w-5 h-5 text-surface-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308"
            />
          </svg>
          <span className="text-sm text-surface-50 flex-1">Classement</span>
        </Link>
      </div>
    </div>
  );
}
