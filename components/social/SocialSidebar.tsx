"use client";

import Link from "next/link";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface SocialSidebarProps {
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  level: number;
  friendCount: number;
  matchesPlayed: number;
  pendingRequests: number;
  unreadMessages: number;
}

export default function SocialSidebar({
  profile,
  level,
  friendCount,
  matchesPlayed,
  pendingRequests,
  unreadMessages,
}: SocialSidebarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-4 space-y-4">
      {/* Profile Card */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4">
        <Link href="/profile" className="flex items-center gap-3 mb-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <ProfileAvatar
              firstName={profile.first_name}
              lastName={profile.last_name}
              size="lg"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-surface-100 truncate">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs text-surface-500">
              {t.social.hubStats.level} {level}
            </p>
          </div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-800/50 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold text-surface-100">{friendCount}</p>
            <p className="text-[10px] text-surface-500">{t.social.friends.title}</p>
          </div>
          <div className="bg-surface-800/50 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold text-surface-100">{matchesPlayed}</p>
            <p className="text-[10px] text-surface-500">{t.social.hubStats.matches}</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
          {t.social.hub}
        </h3>
        <div className="space-y-1">
          <Link
            href="/teams"
            className="flex items-center gap-2.5 px-2 py-2 -mx-2 rounded-lg text-sm text-surface-300 hover:text-surface-100 hover:bg-surface-800/50 transition-colors"
          >
            <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            {t.social.teams.title}
          </Link>
          <Link
            href="/social/friends"
            className="flex items-center gap-2.5 px-2 py-2 -mx-2 rounded-lg text-sm text-surface-300 hover:text-surface-100 hover:bg-surface-800/50 transition-colors"
          >
            <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0Zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0Zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0Z" />
            </svg>
            {t.social.teams.findPlayers}
            {pendingRequests > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-pitch-400 text-surface-950 text-[10px] font-bold">
                {pendingRequests}
              </span>
            )}
          </Link>
          <Link
            href="/social/messages"
            className="flex items-center gap-2.5 px-2 py-2 -mx-2 rounded-lg text-sm text-surface-300 hover:text-surface-100 hover:bg-surface-800/50 transition-colors"
          >
            <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            {t.social.messages.title}
            {unreadMessages > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-pitch-400 text-surface-950 text-[10px] font-bold">
                {unreadMessages}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
