"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { TeamRole, Profile, TeamChallengeWithTeams } from "@/types";
import TeamMemberList from "./TeamMemberList";
import TeamInviteModal from "./TeamInviteModal";
import ChallengeCard from "./ChallengeCard";
import LevelBadge from "@/components/gamification/LevelBadge";

interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  profile: Profile;
}

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  crest_url: string | null;
  crest_preset: string | null;
  captain_id: string;
  city: string | null;
  member_count: number;
  created_at: string;
  captain: Profile;
  team_members: TeamMemberRow[];
}

interface FriendProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface MemberGamification {
  user_id: string;
  level: number;
  total_xp: number;
}

interface TeamDetailPageProps {
  team: TeamData;
  userId: string;
  isMember: boolean;
  myRole: TeamRole | null;
  friends: FriendProfile[];
  memberGamification: MemberGamification[];
  recentChallenges: TeamChallengeWithTeams[];
  totalChallenges: number;
  wonChallenges: number;
}

const PRESET_COLORS: Record<string, string> = {
  red: "bg-red-600",
  blue: "bg-blue-600",
  green: "bg-green-600",
  yellow: "bg-yellow-500",
  purple: "bg-purple-600",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
};

const AVATAR_COLORS = [
  "bg-pitch-600", "bg-blue-600", "bg-purple-600", "bg-amber-600",
  "bg-cyan-600", "bg-pink-600", "bg-red-600", "bg-green-600",
];

export default function TeamDetailPage({
  team,
  userId,
  isMember,
  myRole,
  friends,
  memberGamification,
  recentChallenges,
  totalChallenges,
  wonChallenges,
}: TeamDetailPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const [members, setMembers] = useState(team.team_members);
  const [challenges, setChallenges] = useState(recentChallenges);

  const canInvite = myRole === "captain" || myRole === "co_captain";
  const isCaptain = myRole === "captain";

  const initials = team.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const presetColor = team.crest_preset ? PRESET_COLORS[team.crest_preset] ?? "bg-surface-700" : null;

  // Filter out friends who are already members
  const memberIds = new Set(members.map((m) => m.user_id));
  const invitableFriends = friends.filter((f) => !memberIds.has(f.id));

  // Compute average level from gamification data
  const avgLevel = memberGamification.length > 0
    ? Math.round(memberGamification.reduce((sum, g) => sum + g.level, 0) / memberGamification.length)
    : 0;

  // Build leaderboard: merge members with gamification, sorted by XP
  const gamMap = new Map(memberGamification.map((g) => [g.user_id, g]));
  const leaderboard = members
    .map((m) => ({
      ...m,
      gam: gamMap.get(m.user_id) ?? { level: 1, total_xp: 0 },
    }))
    .sort((a, b) => b.gam.total_xp - a.gam.total_xp);

  const handleLeave = async () => {
    if (!confirm(t.social.teams.leaveTeam + "?")) return;
    setLeaving(true);
    const supabase = createClient();

    await supabase
      .from("team_members")
      .delete()
      .eq("team_id", team.id)
      .eq("user_id", userId);

    await supabase
      .from("teams")
      .update({ member_count: Math.max(0, team.member_count - 1) })
      .eq("id", team.id);

    router.push("/social/teams");
    router.refresh();
  };

  const handleDissolve = async () => {
    if (!confirm(t.social.teams.dissolveTeam + "?")) return;
    setDissolving(true);
    const supabase = createClient();

    // Delete all members first
    await supabase.from("team_members").delete().eq("team_id", team.id);
    // Delete team invitations
    await supabase.from("team_invitations").delete().eq("team_id", team.id);
    // Delete team
    await supabase.from("teams").delete().eq("id", team.id);

    router.push("/social/teams");
    router.refresh();
  };

  const handleChallengeStatusUpdate = (challengeId: string, newStatus: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? { ...c, status: newStatus as any } : c))
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Team header */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          {team.crest_url ? (
            <img
              src={team.crest_url}
              alt={team.name}
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div
              className={`w-20 h-20 rounded-xl flex items-center justify-center shrink-0 ${
                presetColor ?? "bg-pitch-900"
              }`}
            >
              <span className={`text-2xl font-bold ${presetColor ? "text-white" : "text-pitch-400"}`}>
                {initials}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-surface-50 truncate">{team.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {team.city && (
                <span className="text-sm text-surface-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {team.city}
                </span>
              )}
              <span className="text-sm text-surface-500">
                {members.length} {members.length === 1 ? t.social.teams.member : t.social.teams.members}
              </span>
            </div>
            {team.description && (
              <p className="text-sm text-surface-400 mt-3">{team.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Members */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-surface-50">{members.length}</p>
          <p className="text-xs text-surface-500 mt-0.5">{t.social.teams.members}</p>
        </div>

        {/* Challenges */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 10.5h-.75a.75.75 0 01-.75-.75V6.75a3 3 0 116 0v3a.75.75 0 01-.75.75h-.75A3.375 3.375 0 0012 14.25v4.5m-3-9V6.75a3 3 0 00-3-3 3 3 0 00-3 3v3a.75.75 0 00.75.75h.75A3.375 3.375 0 019 14.25v4.5" />
            </svg>
          </div>
          <p className="text-lg font-bold text-surface-50">{totalChallenges}</p>
          <p className="text-xs text-surface-500 mt-0.5">{t.social.challenges.title}</p>
        </div>

        {/* Wins */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-surface-50">{wonChallenges}</p>
          <p className="text-xs text-surface-500 mt-0.5">Victoires</p>
        </div>

        {/* Average Level */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <svg className="w-4 h-4 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-surface-50">{avgLevel}</p>
          <p className="text-xs text-surface-500 mt-0.5">Niveau moyen</p>
        </div>
      </div>

      {/* Actions */}
      {isMember && (
        <div className="flex items-center gap-3 mb-6">
          {canInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-pitch-400 text-surface-950 text-sm font-semibold rounded-xl hover:bg-pitch-300 transition-colors"
            >
              {t.social.teams.inviteFriends}
            </button>
          )}
          {isCaptain ? (
            <button
              onClick={handleDissolve}
              disabled={dissolving}
              className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {t.social.teams.dissolveTeam}
            </button>
          ) : (
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="px-4 py-2 bg-surface-800 text-surface-400 text-sm font-medium rounded-xl hover:bg-surface-700 transition-colors disabled:opacity-50"
            >
              {t.social.teams.leaveTeam}
            </button>
          )}
        </div>
      )}

      {/* Members */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-3">
          {t.social.teams.members} ({members.length})
        </h2>
        <TeamMemberList members={members} captainId={team.captain_id} />
      </div>

      {/* Team Leaderboard */}
      {memberGamification.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-3">
            Classement de l&apos;equipe
          </h2>
          <div className="bg-surface-900 border border-surface-800 rounded-2xl divide-y divide-surface-800">
            {leaderboard.map((m, idx) => {
              const profile = m.profile;
              const memberInitial = (profile.first_name?.[0] ?? "").toUpperCase();
              const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Rank */}
                  <span className={`w-6 text-center text-sm font-bold shrink-0 ${
                    idx === 0 ? "text-amber-400" : idx === 1 ? "text-surface-300" : idx === 2 ? "text-amber-700" : "text-surface-500"
                  }`}>
                    {idx + 1}
                  </span>

                  {/* Avatar */}
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={`${profile.first_name} ${profile.last_name}`}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${colorClass}`}>
                      {memberInitial}
                    </div>
                  )}

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-100 truncate">
                      {profile.first_name} {profile.last_name}
                    </p>
                  </div>

                  {/* Level badge */}
                  <LevelBadge level={m.gam.level} size="sm" />

                  {/* XP */}
                  <span className="text-xs text-surface-500 tabular-nums shrink-0">
                    {m.gam.total_xp.toLocaleString()} XP
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenges */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-3">
          {t.social.challenges.title}
        </h2>
        {challenges.length > 0 ? (
          <div className="space-y-3">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentTeamId={team.id}
                isCaptain={isCaptain}
                onStatusUpdate={handleChallengeStatusUpdate}
              />
            ))}
            {totalChallenges > 3 && (
              <Link
                href={`/social/teams/${team.id}/challenges`}
                className="block text-center text-sm text-pitch-400 hover:text-pitch-300 transition-colors py-2"
              >
                Voir tous les defis ({totalChallenges})
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
            <p className="text-sm text-surface-500 text-center py-4">
              {t.social.challenges.noChallenges}
            </p>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInviteModal && (
        <TeamInviteModal
          teamId={team.id}
          userId={userId}
          friends={invitableFriends}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
