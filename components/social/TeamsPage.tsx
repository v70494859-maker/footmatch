"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { SocialTeam, TeamRole, Profile } from "@/types";
import TeamCard from "./TeamCard";

interface TeamWithRole extends SocialTeam {
  myRole: TeamRole;
  captain?: Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url">;
}

interface InvitationItem {
  id: string;
  team: SocialTeam;
  inviter: Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url">;
  status: string;
}

interface MemberAvatar {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface TeamsPageProps {
  userId: string;
  hasSignedCharter: boolean;
  teams: TeamWithRole[];
  invitations: InvitationItem[];
  teamMemberAvatars?: Record<string, MemberAvatar[]>;
  teamChallengeCounts?: Record<string, number>;
}

export default function TeamsPage({
  userId,
  hasSignedCharter,
  teams: initialTeams,
  invitations: initialInvitations,
  teamMemberAvatars,
  teamChallengeCounts,
}: TeamsPageProps) {
  const { t } = useTranslation();
  const [teams, setTeams] = useState(initialTeams);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [loadingInvite, setLoadingInvite] = useState<string | null>(null);

  const handleAcceptInvite = async (invitationId: string) => {
    setLoadingInvite(invitationId);
    const supabase = createClient();
    const { error } = await supabase
      .from("team_invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

    if (!error) {
      const invitation = invitations.find((inv) => inv.id === invitationId);
      if (invitation) {
        // Insert team member
        await supabase.from("team_members").insert({
          team_id: invitation.team.id,
          user_id: userId,
          role: "member",
        });
        // Update member count
        await supabase.rpc("increment_team_member_count", { p_team_id: invitation.team.id });
        setTeams((prev) => [
          { ...invitation.team, myRole: "member" as TeamRole },
          ...prev,
        ]);
      }
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    }
    setLoadingInvite(null);
  };

  const handleRejectInvite = async (invitationId: string) => {
    setLoadingInvite(invitationId);
    const supabase = createClient();
    await supabase
      .from("team_invitations")
      .update({ status: "rejected" })
      .eq("id", invitationId);
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    setLoadingInvite(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-surface-50">{t.social.teams.myTeams}</h1>
        <Link
          href="/teams/create"
          className="px-4 py-2 bg-pitch-400 text-surface-950 text-sm font-semibold rounded-xl hover:bg-pitch-300 transition-colors"
        >
          {t.social.teams.createTeam}
        </Link>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-surface-400 mb-3">
            {t.social.teams.invite} ({invitations.length})
          </h2>
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 bg-surface-900 border border-surface-800 rounded-xl p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-100 truncate">
                    {inv.team.name}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {inv.inviter.first_name} {inv.inviter.last_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAcceptInvite(inv.id)}
                    disabled={loadingInvite === inv.id}
                    className="px-3 py-1.5 bg-pitch-400 text-surface-950 text-xs font-semibold rounded-lg hover:bg-pitch-300 transition-colors disabled:opacity-50"
                  >
                    {t.social.friends.accept}
                  </button>
                  <button
                    onClick={() => handleRejectInvite(inv.id)}
                    disabled={loadingInvite === inv.id}
                    className="px-3 py-1.5 bg-surface-800 text-surface-300 text-xs font-semibold rounded-lg hover:bg-surface-700 transition-colors disabled:opacity-50"
                  >
                    {t.social.friends.reject}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams list */}
      {teams.length > 0 ? (
        <div className="space-y-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              myRole={team.myRole}
              memberAvatars={teamMemberAvatars?.[team.id]}
              challengeCount={teamChallengeCounts?.[team.id]}
              captainName={team.captain ? `${team.captain.first_name} ${team.captain.last_name}` : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-surface-500 py-12">{t.social.teams.noTeams}</p>
      )}
    </div>
  );
}
