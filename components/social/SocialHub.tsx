"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import LevelBadge from "@/components/gamification/LevelBadge";

// ─── Types ───────────────────────────────────────────────

interface FriendPreview {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  city: string | null;
  favorite_club: string | null;
  origin_country: string | null;
  level: number;
}

interface TeamPreview {
  id: string;
  name: string;
  crest_url: string | null;
  crest_preset: string | null;
  city: string | null;
  member_count: number;
  challenge_count: number;
}

interface PostPreview {
  id: string;
  caption: string | null;
  created_at: string;
  author: { first_name: string; last_name: string; avatar_url: string | null };
  thumbnail_url: string | null;
}

interface SocialHubProps {
  pendingFriendRequests: number;
  totalFriends: number;
  teamCount: number;
  unreadMessages: number;
  recentFriends: FriendPreview[];
  firstTeam: TeamPreview | null;
  latestPost: PostPreview | null;
  userLevel: number;
  userXp: number;
  userStreak: number;
  matchesPlayed: number;
}

// ─── Helpers ─────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSeconds = Math.floor((now - date) / 1000);
  if (diffSeconds < 60) return "il y a quelques secondes";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `il y a ${diffMinutes}min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `il y a ${diffDays}j`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `il y a ${diffWeeks}sem`;
}

function formatXp(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${xp}`;
}

// ─── Component ───────────────────────────────────────────

export default function SocialHub({
  pendingFriendRequests,
  totalFriends,
  teamCount,
  unreadMessages,
  recentFriends,
  firstTeam,
  latestPost,
  userLevel,
  userXp,
  userStreak,
  matchesPlayed,
}: SocialHubProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-bold text-surface-50">{t.social.hub}</h1>

      {/* ── 1. My Stats Bar ─────────────────────────────── */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4">
        <div className="grid grid-cols-4 gap-3">
          {/* Level */}
          <div className="flex flex-col items-center gap-1.5">
            <LevelBadge level={userLevel} size="md" />
            <span className="text-surface-500 text-xs">Niveau</span>
          </div>
          {/* XP */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-surface-50 font-bold text-lg">{formatXp(userXp)}</span>
            <span className="text-surface-500 text-xs">XP</span>
          </div>
          {/* Streak */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1">
              <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 23c-3.866 0-7-3.134-7-7 0-3.526 3.008-6.381 5-8.5.938-1 1.5-2 2-3.5.5 1.5 1.062 2.5 2 3.5 1.992 2.119 5 4.974 5 8.5 0 3.866-3.134 7-7 7z" />
              </svg>
              <span className="text-surface-50 font-bold text-lg">{userStreak}</span>
            </div>
            <span className="text-surface-500 text-xs">jours</span>
          </div>
          {/* Matches */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-surface-50 font-bold text-lg">{matchesPlayed}</span>
            <span className="text-surface-500 text-xs">Matchs</span>
          </div>
        </div>
      </div>

      {/* ── 2. Quick Actions ────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/social/friends"
          className="flex items-center justify-center gap-2 bg-surface-900 border border-surface-800 rounded-xl px-3 py-2.5 hover:border-pitch-500/50 transition-colors"
        >
          <svg className="w-4 h-4 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span className="text-sm font-medium text-pitch-300">Trouver amis</span>
        </Link>
        <Link
          href="/social/teams/create"
          className="flex items-center justify-center gap-2 bg-surface-900 border border-surface-800 rounded-xl px-3 py-2.5 hover:border-pitch-500/50 transition-colors"
        >
          <svg className="w-4 h-4 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-sm font-medium text-pitch-300">{t.social.teams.createTeam}</span>
        </Link>
        <Link
          href="/social/feed"
          className="flex items-center justify-center gap-2 bg-surface-900 border border-surface-800 rounded-xl px-3 py-2.5 hover:border-pitch-500/50 transition-colors"
        >
          <svg className="w-4 h-4 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
          <span className="text-sm font-medium text-pitch-300">Nouveau post</span>
        </Link>
      </div>

      {/* ── 3. Friends Section ──────────────────────────── */}
      <Link
        href="/social/friends"
        className="block bg-surface-900 border border-surface-800 rounded-2xl p-4 hover:border-surface-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-surface-100">{t.social.friends.title}</h2>
            <span className="text-sm text-surface-500">{totalFriends}</span>
            {pendingFriendRequests > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-pitch-400 text-surface-950 text-xs font-bold">
                {pendingFriendRequests}
              </span>
            )}
          </div>
          <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>

        {recentFriends.length > 0 ? (
          <div>
            <div className="flex items-center">
              {recentFriends.map((friend, idx) => (
                <div
                  key={friend.id}
                  className={`relative ${idx === 0 ? "" : "-ml-2"}`}
                  title={`${friend.first_name} ${friend.last_name}`}
                >
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt={`${friend.first_name} ${friend.last_name}`}
                      className="w-9 h-9 rounded-full object-cover border-2 border-surface-900"
                    />
                  ) : (
                    <div className="border-2 border-surface-900 rounded-full">
                      <ProfileAvatar
                        firstName={friend.first_name}
                        lastName={friend.last_name}
                        size="sm"
                      />
                    </div>
                  )}
                  {/* Mini level badge */}
                  <div className="absolute -bottom-1 -right-1">
                    <LevelBadge level={friend.level} size="sm" />
                  </div>
                </div>
              ))}
            </div>
            {totalFriends > 5 && (
              <p className="text-xs text-surface-500 mt-2">
                et {totalFriends - recentFriends.length} autres
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-surface-500">{t.social.friends.noFriends}</p>
        )}
      </Link>

      {/* ── 4. Team Section ─────────────────────────────── */}
      <Link
        href="/social/teams"
        className="block bg-surface-900 border border-surface-800 rounded-2xl p-4 hover:border-surface-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-surface-100">{t.social.teams.title}</h2>
          <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>

        {firstTeam ? (
          <div className="flex items-center gap-3">
            {/* Team crest */}
            {firstTeam.crest_url ? (
              <img
                src={firstTeam.crest_url}
                alt={firstTeam.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: firstTeam.crest_preset ?? "#4B5563" }}
              >
                {firstTeam.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-100 truncate">{firstTeam.name}</p>
              {firstTeam.city && (
                <p className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {firstTeam.city}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-surface-400">
                  {firstTeam.member_count} {firstTeam.member_count === 1 ? t.social.teams.member : t.social.teams.members}
                </span>
                {firstTeam.challenge_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-pitch-400">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    {firstTeam.challenge_count} {firstTeam.challenge_count === 1 ? "defi" : "defis"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-surface-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-sm text-surface-500">{t.social.teams.createTeam}</p>
          </div>
        )}
      </Link>

      {/* ── 5. Messages Section ─────────────────────────── */}
      <Link
        href="/social/messages"
        className="block bg-surface-900 border border-surface-800 rounded-2xl p-4 hover:border-surface-700 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-surface-100">{t.social.messages.title}</h2>
              <p className="text-xs text-surface-500">
                {unreadMessages > 0
                  ? `${unreadMessages} non lu${unreadMessages > 1 ? "s" : ""}`
                  : t.social.messages.noConversations}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadMessages > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-pitch-400 text-surface-950 text-xs font-bold">
                {unreadMessages}
              </span>
            )}
            <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </Link>

      {/* ── 6. Feed Section ─────────────────────────────── */}
      <Link
        href="/social/feed"
        className="block bg-surface-900 border border-surface-800 rounded-2xl p-4 hover:border-surface-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-surface-100">{t.social.feed.title}</h2>
          <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>

        {latestPost ? (
          <div className="flex items-start gap-3">
            {latestPost.thumbnail_url && (
              <img
                src={latestPost.thumbnail_url}
                alt=""
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              {latestPost.caption && (
                <p className="text-sm text-surface-300 line-clamp-2">{latestPost.caption}</p>
              )}
              <p className="text-xs text-surface-500 mt-1">
                {latestPost.author.first_name} {latestPost.author.last_name} &middot; {timeAgo(latestPost.created_at)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-surface-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
              </svg>
            </div>
            <p className="text-sm text-surface-500">{t.social.feed.noPosts}</p>
          </div>
        )}
      </Link>
    </div>
  );
}
