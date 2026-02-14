"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const PRESET_COLORS: Record<string, string> = {
  red: "bg-red-600", blue: "bg-blue-600", green: "bg-green-600",
  yellow: "bg-yellow-500", purple: "bg-purple-600", orange: "bg-orange-500",
  pink: "bg-pink-500", cyan: "bg-cyan-500",
};

const statusColors: Record<string, string> = {
  proposed: "bg-amber-500/10 text-amber-400",
  accepted: "bg-pitch-500/10 text-pitch-400",
  scheduled: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-blue-500/10 text-blue-400",
};

interface Invitation {
  id: string;
  team: { id: string; name: string; crest_url: string | null; crest_preset: string | null; member_count: number };
  inviter: { id: string; first_name: string; last_name: string; avatar_url: string | null };
}

interface UpcomingChallenge {
  id: string;
  status: string;
  proposed_date: string | null;
  challenger_team: { id: string; name: string; crest_url: string | null; crest_preset: string | null };
  challenged_team: { id: string; name: string; crest_url: string | null; crest_preset: string | null };
}

interface LeaderboardTeam {
  team_id: string;
  name: string;
  crest_url: string | null;
  crest_preset: string | null;
  wins: number;
}

interface TeamsActivitySidebarProps {
  pendingInvitations: Invitation[];
  upcomingChallenges: UpcomingChallenge[];
  teamLeaderboard: LeaderboardTeam[];
  onInvitationHandled?: (invitationId: string, teamId: string, accepted: boolean) => void;
}

function MiniCrest({ name, crest_url, crest_preset, size = "sm" }: { name: string; crest_url: string | null; crest_preset: string | null; size?: "sm" | "xs" }) {
  const dim = size === "sm" ? "w-8 h-8" : "w-6 h-6";
  const textSize = size === "sm" ? "text-[10px]" : "text-[8px]";
  const rounded = size === "sm" ? "rounded-lg" : "rounded-md";
  const presetColor = crest_preset ? PRESET_COLORS[crest_preset] ?? "bg-surface-700" : null;

  if (crest_url) {
    return <img src={crest_url} alt="" className={`${dim} ${rounded} object-cover shrink-0`} />;
  }
  return (
    <div className={`${dim} ${rounded} flex items-center justify-center shrink-0 ${presetColor ?? "bg-pitch-900"}`}>
      <span className={`${textSize} font-bold ${presetColor ? "text-white" : "text-pitch-400"}`}>
        {name.substring(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

const RANK_COLORS = ["text-amber-400", "text-surface-300", "text-amber-700"];

export default function TeamsActivitySidebar({ pendingInvitations, upcomingChallenges, teamLeaderboard, onInvitationHandled }: TeamsActivitySidebarProps) {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState(pendingInvitations);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleInvitation = async (invitation: Invitation, accept: boolean) => {
    setLoadingId(invitation.id);
    const supabase = createClient();

    if (accept) {
      await supabase.from("team_invitations").update({ status: "accepted" }).eq("id", invitation.id);
      await supabase.from("team_members").insert({ team_id: invitation.team.id, user_id: (await supabase.auth.getUser()).data.user!.id, role: "member" });
      await supabase.from("teams").update({ member_count: invitation.team.member_count + 1 }).eq("id", invitation.team.id);
    } else {
      await supabase.from("team_invitations").update({ status: "rejected" }).eq("id", invitation.id);
    }

    setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    setLoadingId(null);
    onInvitationHandled?.(invitation.id, invitation.team.id, accept);
  };

  return (
    <div className="sticky top-4 space-y-4">
      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-surface-100 mb-3">
            {t.social.teams.invite}
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-pitch-400 text-surface-950 text-[10px] font-bold">
              {invitations.length}
            </span>
          </h3>
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-2">
                <MiniCrest name={inv.team.name} crest_url={inv.team.crest_url} crest_preset={inv.team.crest_preset} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-surface-100 truncate">{inv.team.name}</p>
                  <p className="text-[10px] text-surface-500">
                    {inv.inviter.first_name} {inv.inviter.last_name}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleInvitation(inv, true)}
                    disabled={loadingId === inv.id}
                    className="px-2 py-1 bg-pitch-400 text-surface-950 text-[10px] font-bold rounded-lg hover:bg-pitch-300 transition-colors disabled:opacity-50"
                  >
                    {t.social.friends.accept}
                  </button>
                  <button
                    onClick={() => handleInvitation(inv, false)}
                    disabled={loadingId === inv.id}
                    className="px-2 py-1 bg-surface-800 text-surface-400 text-[10px] font-medium rounded-lg hover:bg-surface-700 transition-colors disabled:opacity-50"
                  >
                    {t.social.friends.reject}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Challenges */}
      {upcomingChallenges.length > 0 && (
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-surface-100 mb-3">{t.social.teams.upcoming}</h3>
          <div className="space-y-3">
            {upcomingChallenges.map((c) => {
              const statusKey = c.status as keyof typeof t.social.challenges.status;
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <MiniCrest name={c.challenger_team.name} crest_url={c.challenger_team.crest_url} crest_preset={c.challenger_team.crest_preset} size="xs" />
                  <span className="text-[10px] font-bold text-surface-600">VS</span>
                  <MiniCrest name={c.challenged_team.name} crest_url={c.challenged_team.crest_url} crest_preset={c.challenged_team.crest_preset} size="xs" />
                  <div className="flex-1 min-w-0">
                    {c.proposed_date && (
                      <p className="text-[10px] text-surface-400">
                        {new Date(c.proposed_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${statusColors[c.status] ?? "bg-surface-600/20 text-surface-400"}`}>
                    {t.social.challenges.status[statusKey]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Leaderboard */}
      {teamLeaderboard.length > 0 && (
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-surface-100 mb-3">{t.social.teams.teamRanking}</h3>
          <div className="space-y-2">
            {teamLeaderboard.map((team, i) => (
              <Link
                key={team.team_id}
                href={`/teams/${team.team_id}`}
                className="flex items-center gap-2 px-2 py-1.5 -mx-2 rounded-lg hover:bg-surface-800/50 transition-colors"
              >
                <span className={`text-xs font-bold w-5 text-center ${RANK_COLORS[i] ?? "text-surface-500"}`}>
                  {i + 1}
                </span>
                <MiniCrest name={team.name} crest_url={team.crest_url} crest_preset={team.crest_preset} size="xs" />
                <span className="text-xs text-surface-200 flex-1 truncate">{team.name}</span>
                <span className="text-[10px] text-amber-400 font-medium">{team.wins}W</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
