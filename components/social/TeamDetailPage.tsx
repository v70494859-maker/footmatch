"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { TeamRole, Profile } from "@/types";
import TeamMemberList from "./TeamMemberList";
import TeamInviteModal from "./TeamInviteModal";

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

interface TeamDetailPageProps {
  team: TeamData;
  userId: string;
  isMember: boolean;
  myRole: TeamRole | null;
  friends: FriendProfile[];
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

export default function TeamDetailPage({ team, userId, isMember, myRole, friends }: TeamDetailPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const [members, setMembers] = useState(team.team_members);

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

      {/* Challenges placeholder */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-3">
          {t.social.challenges.title}
        </h2>
        <p className="text-sm text-surface-500 text-center py-4">
          {t.social.challenges.noChallenges}
        </p>
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
