"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Profile, PlayerCareerStats, PlayerGamification, UserBadge, BadgeProgress } from "@/types";
import { USER_ROLE_LABELS, SUBSCRIPTION_STATUS_LABELS, TERRAIN_TYPE_LABELS } from "@/types";
import type { SubscriptionStatus, TerrainType } from "@/types";
import StatBox from "@/components/admin/StatBox";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { getFlagForCountry } from "@/lib/cities";
import { getClubBySlug, getClubLogo } from "@/lib/clubs";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import Button from "@/components/ui/Button";
import LevelBadge from "@/components/gamification/LevelBadge";
import XPProgressBar from "@/components/gamification/XPProgressBar";

type FormResult = "V" | "N" | "D";

interface RecentActivity {
  matchId: string;
  title: string;
  date: string;
  terrainType: string;
  scoreA: number | null;
  scoreB: number | null;
  badge: "V" | "N" | "D" | null;
  goals: number;
  assists: number;
  mvp: boolean;
}

interface UpcomingMatchInfo {
  id: string;
  title: string;
  date: string;
  startTime: string;
  venueName: string;
  city: string;
  terrainType: string;
  registeredCount: number;
  capacity: number;
  chatCount: number;
}

interface OperatorStats {
  bio: string | null;
  rating: number;
  totalMatches: number;
  totalParticipants: number;
  avgFillRate: number;
  operatorId: string;
}

interface PlayerExtra {
  upcomingMatches: number;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
  memberSince: string;
  memberSinceDays: number;
  totalRegistrations: number;
  chatMessagesSent: number;
  terrainCounts: { indoor: number; outdoor: number; covered: number };
  recentActivity: RecentActivity[];
  upcomingMatchList: UpcomingMatchInfo[];
  currentStreak: { type: "V" | "N" | "D"; count: number } | null;
}

interface ProfileViewProps {
  profile: Profile;
  careerStats?: PlayerCareerStats | null;
  recentForm?: FormResult[];
  operatorStats?: OperatorStats;
  playerExtra?: PlayerExtra;
  gamification?: PlayerGamification | null;
  badges?: UserBadge[];
  badgeProgress?: BadgeProgress[];
}

const roleBadgeColors: Record<string, string> = {
  player: "bg-pitch-400/15 text-pitch-400 border-pitch-400/30",
  operator: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  admin: "bg-red-400/15 text-red-400 border-red-400/30",
};

const STREAK_COLORS: Record<FormResult, string> = {
  V: "bg-pitch-500/15 text-pitch-400",
  N: "bg-surface-600/20 text-surface-400",
  D: "bg-danger-500/15 text-danger-500",
};

// STREAK_LABELS moved inside component to use translations

function getCountdownLabel(dateStr: string, todayLabel: string, tomorrowLabel: string): { text: string; urgent: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const matchDate = new Date(dateStr + "T00:00:00");
  matchDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (matchDate.getTime() - today.getTime()) / 86400000
  );
  if (diffDays === 0) return { text: todayLabel, urgent: true };
  if (diffDays === 1) return { text: tomorrowLabel, urgent: true };
  if (diffDays <= 3) return { text: `J-${diffDays}`, urgent: true };
  return { text: `J-${diffDays}`, urgent: false };
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  return `${h}:${m}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function ProfileView({
  profile: initialProfile,
  careerStats,
  recentForm = [],
  operatorStats,
  playerExtra,
  gamification,
  badges,
  badgeProgress,
}: ProfileViewProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = createClient();
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const STREAK_LABELS: Record<FormResult, string> = {
    V: t.common.victory,
    N: t.common.draw,
    D: t.common.defeat,
  };

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  function handleSave(updated: Profile) {
    setProfile(updated);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">
          {t.profile.editProfile}
        </h2>
        <ProfileEditForm
          profile={profile}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  // W/D/L bar calculations
  const totalWDL = careerStats
    ? careerStats.win_count + careerStats.draw_count + careerStats.loss_count
    : 0;
  const winPct = totalWDL > 0 ? (careerStats!.win_count / totalWDL) * 100 : 0;
  const drawPct = totalWDL > 0 ? (careerStats!.draw_count / totalWDL) * 100 : 0;
  const lossPct = totalWDL > 0 ? (careerStats!.loss_count / totalWDL) * 100 : 0;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-4">
        <ProfileAvatar
          firstName={profile.first_name}
          lastName={profile.last_name}
          country={profile.origin_country}
          clubSlug={profile.favorite_club}
          size="lg"
        />

        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-foreground">
            {profile.first_name} {profile.last_name}
          </h1>
          {(profile.city || profile.origin_country) && (
            <p className="text-surface-400 text-sm">
              {profile.city && <span>{profile.city}</span>}
              {profile.city && profile.origin_country && (
                <span> &middot; </span>
              )}
              {profile.origin_country && (
                <span>
                  {getFlagForCountry(profile.origin_country)}{" "}
                  {profile.origin_country}
                </span>
              )}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span
              className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${
                roleBadgeColors[profile.role] ??
                "bg-surface-800 text-surface-300 border-surface-700"
              }`}
            >
              {USER_ROLE_LABELS[profile.role]}
            </span>
            {profile.favorite_club &&
              (() => {
                const club = getClubBySlug(profile.favorite_club!);
                if (!club) return null;
                return (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-surface-800/60 text-surface-300 border-surface-700">
                    <Image
                      src={getClubLogo(club.slug)}
                      alt={club.name}
                      width={16}
                      height={16}
                      className="w-4 h-4 object-contain"
                    />
                    {club.name}
                  </span>
                );
              })()}
            {playerExtra?.memberSinceDays != null && (
              <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full border bg-surface-800/60 text-surface-300 border-surface-700">
                {playerExtra.memberSinceDays < 30
                  ? `${playerExtra.memberSinceDays}j`
                  : `${Math.floor(playerExtra.memberSinceDays / 30)} mois`}{" "}
                {t.common.member}
              </span>
            )}
          </div>
          {/* Recent form + streak */}
          {(recentForm.length > 0 || playerExtra?.currentStreak) && (
            <div className="flex items-center justify-center gap-2">
              {recentForm.length > 0 && (
                <div className="flex items-center gap-1">
                  {recentForm.map((r, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white ${
                        r === "V"
                          ? "bg-pitch-500"
                          : r === "D"
                            ? "bg-danger-500"
                            : "bg-amber-500"
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
              {playerExtra?.currentStreak && (
                <span
                  className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${STREAK_COLORS[playerExtra.currentStreak.type]}`}
                >
                  {playerExtra.currentStreak.count}{" "}
                  {STREAK_LABELS[playerExtra.currentStreak.type]}
                  {playerExtra.currentStreak.count > 1 ? "s" : ""} d&apos;affilée
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* XP & Level — compact card with badge count */}
      {gamification && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LevelBadge level={gamification.level} size="lg" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t.gamification.levels[gamification.level] ?? gamification.level_name}
                </p>
                <p className="text-xs text-surface-400">
                  {gamification.total_xp.toLocaleString()} XP
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {badges && badges.length > 0 && (() => {
                const counts = { gold: 0, silver: 0, bronze: 0 };
                for (const b of badges) counts[b.tier as keyof typeof counts]++;
                return (
                  <div className="flex items-center gap-2.5">
                    {counts.gold > 0 && (
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500" />
                        <span className="text-[9px] font-semibold text-amber-400 mt-0.5">x{counts.gold}</span>
                      </div>
                    )}
                    {counts.silver > 0 && (
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-surface-300 to-surface-400" />
                        <span className="text-[9px] font-semibold text-surface-400 mt-0.5">x{counts.silver}</span>
                      </div>
                    )}
                    {counts.bronze > 0 && (
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-700 to-amber-800" />
                        <span className="text-[9px] font-semibold text-amber-700 mt-0.5">x{counts.bronze}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
              {gamification.current_streak > 0 && (
                <div className="flex items-center gap-1 bg-pitch-400/10 rounded-full px-2.5 py-1">
                  <span className="text-xs">🔥</span>
                  <span className="text-xs font-bold text-pitch-400">{gamification.current_streak}</span>
                </div>
              )}
            </div>
          </div>
          <XPProgressBar totalXp={gamification.total_xp} />
          <div className="flex justify-end">
            <Link
              href="/faq"
              className="text-[11px] text-surface-500 hover:text-pitch-400 transition-colors"
            >
              FAQ &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Stats strip */}
      {playerExtra && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-pitch-400">
              {playerExtra.totalRegistrations}
            </p>
            <p className="text-[10px] text-surface-500">{t.subscription.matchesPlayed}</p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">
              {careerStats?.total_goals ?? 0}
            </p>
            <p className="text-[10px] text-surface-500">{t.common.goals}</p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-amber-400">
              {careerStats?.total_mvp ?? 0}
            </p>
            <p className="text-[10px] text-surface-500">{t.common.mvp}</p>
          </div>
        </div>
      )}

      {/* Reputation stats */}
      {playerExtra && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className={`text-lg font-bold ${
              (careerStats?.attendance_rate ?? 1) >= 0.9 ? "text-pitch-400" :
              (careerStats?.attendance_rate ?? 1) >= 0.75 ? "text-amber-400" : "text-danger-500"
            }`}>
              {careerStats ? `${Math.round(careerStats.attendance_rate * 100)}%` : "—"}
            </p>
            <p className="text-[10px] text-surface-500">{t.reliability.presence}</p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className={`text-lg font-bold ${
              (careerStats?.late_cancel_count ?? 0) === 0 ? "text-pitch-400" :
              (careerStats?.late_cancel_count ?? 0) <= 2 ? "text-amber-400" : "text-danger-500"
            }`}>
              {careerStats?.late_cancel_count ?? 0}
            </p>
            <p className="text-[10px] text-surface-500">{t.reliability.lateCancels}</p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className={`text-lg font-bold ${
              (careerStats?.no_show_count ?? 0) === 0 ? "text-pitch-400" :
              (careerStats?.no_show_count ?? 0) <= 2 ? "text-amber-400" : "text-danger-500"
            }`}>
              {careerStats?.no_show_count ?? 0}
            </p>
            <p className="text-[10px] text-surface-500">{t.reliability.noShow}</p>
          </div>
        </div>
      )}

      {/* Subscription status (compact) */}
      {playerExtra?.subscriptionStatus && (
        <div className="flex items-center justify-between bg-surface-900 border border-surface-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                playerExtra.subscriptionStatus === "active"
                  ? "bg-pitch-400"
                  : playerExtra.subscriptionStatus === "trialing"
                    ? "bg-blue-400"
                    : "bg-danger-500"
              }`}
            />
            <span className="text-sm font-medium text-foreground">
              {SUBSCRIPTION_STATUS_LABELS[
                playerExtra.subscriptionStatus as SubscriptionStatus
              ] ?? playerExtra.subscriptionStatus}
            </span>
          </div>
          <p className="text-xs text-surface-500">
            {t.subscription.memberSince}{" "}
            {new Date(playerExtra.memberSince).toLocaleDateString("fr-FR", {
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Upcoming matches */}
      {playerExtra &&
        playerExtra.upcomingMatchList.length > 0 && (
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-surface-300">
                {t.profile.upcomingMatches}
              </h3>
              <Link
                href="/my-matches"
                className="text-xs text-pitch-400 hover:text-pitch-300 font-medium"
              >
                {t.common.viewAll}
              </Link>
            </div>
            <div className="space-y-2.5">
              {playerExtra.upcomingMatchList.map((m) => {
                const countdown = getCountdownLabel(m.date, t.common.today, t.common.tomorrow);
                const fillPct =
                  m.capacity > 0
                    ? Math.min((m.registeredCount / m.capacity) * 100, 100)
                    : 0;

                return (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="flex items-center gap-3 rounded-lg bg-surface-800/50 px-3 py-2.5 hover:bg-surface-800 transition-colors"
                  >
                    {/* Date */}
                    <div className="shrink-0 text-center min-w-[2.5rem]">
                      <p className="text-xs font-semibold text-pitch-400 uppercase">
                        {new Date(
                          m.date + "T00:00:00"
                        ).toLocaleDateString("fr-FR", { weekday: "short" })}
                      </p>
                      <p className="text-base font-bold text-foreground leading-tight">
                        {new Date(m.date + "T00:00:00").getDate()}
                      </p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">
                          {m.title}
                        </p>
                        <span
                          className={`shrink-0 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                            countdown.urgent
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-surface-700 text-surface-400"
                          }`}
                        >
                          {countdown.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-surface-400 truncate">
                          {m.venueName}
                        </span>
                        <span className="text-xs text-surface-500">
                          {formatTime(m.startTime)}
                        </span>
                        {m.chatCount > 0 && (
                          <span className="text-[10px] font-medium bg-surface-700 text-surface-300 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                            <svg
                              className="w-2.5 h-2.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                              />
                            </svg>
                            {m.chatCount}
                          </span>
                        )}
                      </div>
                      {/* Fill bar */}
                      <div className="mt-1.5">
                        <div className="w-full h-1 bg-surface-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              fillPct >= 100 ? "bg-amber-500" : "bg-pitch-400"
                            }`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Spots */}
                    <span className="shrink-0 text-[10px] text-surface-500">
                      {m.registeredCount}/{m.capacity}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      {/* Info card */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-surface-300">
          {t.profile.accountInfo}
        </h3>
        {profile.email && (
          <div>
            <p className="text-xs text-surface-500">Email</p>
            <p className="text-sm font-medium text-foreground">
              {profile.email}
            </p>
          </div>
        )}
      </div>

      {/* Operator bio */}
      {operatorStats?.bio && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-surface-300 mb-2">
            {t.common.about}
          </h3>
          <p className="text-sm text-surface-400 whitespace-pre-wrap">
            {operatorStats.bio}
          </p>
        </div>
      )}

      {/* Operator stats */}
      {operatorStats && (
        <div className="grid grid-cols-2 gap-3">
          <StatBox
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6l1.5 3.5L17 11l-3.5 1.5L12 16l-1.5-3.5L7 11l3.5-1.5z" />
              </svg>
            }
            label={t.common.matches}
            value={operatorStats.totalMatches}
          />
          <StatBox
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            }
            label={t.common.participants}
            value={operatorStats.totalParticipants}
          />
          <StatBox
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            }
            label={t.common.rating}
            value={
              operatorStats.rating > 0
                ? operatorStats.rating.toFixed(1)
                : "N/A"
            }
          />
          <StatBox
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            }
            label={t.common.fillRate}
            value={`${operatorStats.avgFillRate}%`}
          />
        </div>
      )}

      {/* Link to public profile */}
      {operatorStats && (
        <Link
          href={`/operators/${operatorStats.operatorId}`}
          className="flex items-center justify-center gap-2 w-full bg-surface-900 border border-surface-800 hover:border-surface-700 rounded-xl px-4 py-3 transition-colors"
        >
          <svg
            className="w-4 h-4 text-pitch-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
          <span className="text-sm font-medium text-pitch-400">
            {t.profile.publicProfile}
          </span>
        </Link>
      )}

      {/* Career stats */}
      {careerStats && careerStats.total_matches > 0 && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-surface-300">
            {t.common.statistics}
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-foreground">
                {careerStats.total_matches}
              </p>
              <p className="text-[10px] text-surface-500 uppercase tracking-wider">
                {t.common.matches}
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {careerStats.total_goals}
              </p>
              <p className="text-[10px] text-surface-500 uppercase tracking-wider">
                {t.common.goals}
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {careerStats.total_assists}
              </p>
              <p className="text-[10px] text-surface-500 uppercase tracking-wider">
                {t.common.assists}
              </p>
            </div>
          </div>

          {/* W/D/L bar */}
          {totalWDL > 0 && (
            <div className="border-t border-surface-800 pt-3">
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-pitch-400" />
                    <span className="text-surface-400">
                      {t.common.win} {careerStats.win_count}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-surface-500" />
                    <span className="text-surface-400">
                      {t.common.drawAbbr} {careerStats.draw_count}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-danger-500" />
                    <span className="text-surface-400">
                      {t.common.loss} {careerStats.loss_count}
                    </span>
                  </span>
                </div>
                <span className="text-surface-500">
                  {careerStats.total_mvp} MVP
                </span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {winPct > 0 && (
                  <div
                    className="bg-pitch-400 rounded-full transition-all duration-500"
                    style={{ width: `${winPct}%` }}
                  />
                )}
                {drawPct > 0 && (
                  <div
                    className="bg-surface-500 rounded-full transition-all duration-500"
                    style={{ width: `${drawPct}%` }}
                  />
                )}
                {lossPct > 0 && (
                  <div
                    className="bg-danger-500 rounded-full transition-all duration-500"
                    style={{ width: `${lossPct}%` }}
                  />
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Recent activity */}
      {playerExtra && playerExtra.recentActivity.length > 0 && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-surface-300">
              {t.profile.recentResults}
            </h3>
            <Link
              href="/my-matches"
              className="text-xs text-pitch-400 hover:text-pitch-300 font-medium"
            >
              {t.common.history}
            </Link>
          </div>
          <div className="space-y-2.5">
            {playerExtra.recentActivity.map((a) => (
              <Link
                key={a.matchId}
                href={`/matches/${a.matchId}`}
                className="flex items-center gap-3 rounded-lg bg-surface-800/50 px-3 py-2.5 hover:bg-surface-800 transition-colors"
              >
                {/* W/D/L badge */}
                {a.badge ? (
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      a.badge === "V"
                        ? "bg-pitch-500/15 text-pitch-400"
                        : a.badge === "D"
                          ? "bg-danger-500/15 text-danger-500"
                          : "bg-surface-600/20 text-surface-400"
                    }`}
                  >
                    {a.badge}
                  </span>
                ) : (
                  <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-surface-700 text-surface-400">
                    ?
                  </span>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {a.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-surface-400">
                      {formatDate(a.date)}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-700 text-surface-300 rounded-full px-2 py-0.5">
                      {TERRAIN_TYPE_LABELS[a.terrainType as TerrainType] ??
                        a.terrainType}
                    </span>
                  </div>
                </div>

                {/* Score */}
                {a.scoreA != null && a.scoreB != null && (
                  <span className="shrink-0 text-sm font-bold text-foreground">
                    {a.scoreA} - {a.scoreB}
                  </span>
                )}

                {/* Personal highlights */}
                {(a.goals > 0 || a.assists > 0 || a.mvp) && (
                  <div className="shrink-0 flex items-center gap-1">
                    {a.goals > 0 && (
                      <span className="text-[10px] font-semibold bg-pitch-500/15 text-pitch-400 rounded-full px-1.5 py-0.5">
                        {a.goals}B
                      </span>
                    )}
                    {a.assists > 0 && (
                      <span className="text-[10px] font-semibold bg-surface-700 text-surface-300 rounded-full px-1.5 py-0.5">
                        {a.assists}P
                      </span>
                    )}
                    {a.mvp && (
                      <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-500 rounded-full px-1.5 py-0.5">
                        MVP
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <Button fullWidth onClick={() => setEditing(true)}>
          {t.profile.editProfile}
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={handleLogout}
          loading={loggingOut}
        >
          {t.profile.logOut}
        </Button>

        {profile.role === "player" && (
          <Link
            href="/operator-onboarding"
            className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-sm font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 transition-colors duration-150"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
            {t.profile.becomeOperator}
          </Link>
        )}
      </div>
    </div>
  );
}
