"use client";

import { useState } from "react";
import type { TeamChallengeWithTeams, ChallengeStatus } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

const statusColors: Record<ChallengeStatus, string> = {
  proposed: "bg-amber-500/10 text-amber-400",
  accepted: "bg-pitch-500/10 text-pitch-400",
  declined: "bg-danger-500/10 text-danger-500",
  scheduled: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  completed: "bg-surface-600/20 text-surface-400",
  canceled: "bg-surface-600/20 text-surface-500",
};

interface ChallengeCardProps {
  challenge: TeamChallengeWithTeams;
  currentTeamId: string;
  isCaptain: boolean;
  onStatusUpdate: (id: string, status: string) => void;
}

export default function ChallengeCard({ challenge, currentTeamId, isCaptain, onStatusUpdate }: ChallengeCardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const isChallenger = challenge.challenger_team_id === currentTeamId;
  const opponent = isChallenger ? challenge.challenged_team : challenge.challenger_team;
  const statusKey = challenge.status as keyof typeof t.social.challenges.status;

  const handleAction = async (newStatus: ChallengeStatus) => {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("team_challenges")
      .update({ status: newStatus })
      .eq("id", challenge.id);
    onStatusUpdate(challenge.id, newStatus);
    setLoading(false);
  };

  const getCrestDisplay = (team: { name: string; crest_url: string | null; crest_preset: string | null }) => {
    if (team.crest_url) {
      return <img src={team.crest_url} alt="" className="w-10 h-10 rounded-full object-cover" />;
    }
    return (
      <div className="w-10 h-10 rounded-full bg-pitch-900 flex items-center justify-center text-pitch-400 text-sm font-bold">
        {team.name.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
      {/* Teams matchup */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getCrestDisplay(challenge.challenger_team)}
          <span className="text-sm font-medium text-surface-100">{challenge.challenger_team.name}</span>
        </div>
        <span className="text-xs font-bold text-surface-500 uppercase">VS</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-surface-100">{challenge.challenged_team.name}</span>
          {getCrestDisplay(challenge.challenged_team)}
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-xs text-surface-400">
        <div className="flex items-center gap-3">
          {challenge.proposed_date && (
            <span>{new Date(challenge.proposed_date).toLocaleDateString()}</span>
          )}
          {challenge.proposed_venue && <span>{challenge.proposed_venue}</span>}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[challenge.status]}`}>
          {t.social.challenges.status[statusKey]}
        </span>
      </div>

      {challenge.message && (
        <p className="text-xs text-surface-400 mt-2 italic">&ldquo;{challenge.message}&rdquo;</p>
      )}

      {/* Actions */}
      {isCaptain && challenge.status === "proposed" && !isChallenger && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-800">
          <button
            onClick={() => handleAction("accepted")}
            disabled={loading}
            className="flex-1 px-3 py-1.5 bg-pitch-400 text-surface-950 text-xs font-semibold rounded-lg hover:bg-pitch-300 transition-colors disabled:opacity-50"
          >
            {t.social.challenges.accept}
          </button>
          <button
            onClick={() => handleAction("declined")}
            disabled={loading}
            className="flex-1 px-3 py-1.5 bg-surface-800 text-surface-300 text-xs font-semibold rounded-lg hover:bg-surface-700 transition-colors disabled:opacity-50"
          >
            {t.social.challenges.decline}
          </button>
        </div>
      )}

      {isCaptain && challenge.status === "proposed" && isChallenger && (
        <div className="mt-3 pt-3 border-t border-surface-800">
          <button
            onClick={() => handleAction("canceled")}
            disabled={loading}
            className="px-3 py-1.5 bg-surface-800 text-surface-400 text-xs font-medium rounded-lg hover:bg-surface-700 transition-colors disabled:opacity-50"
          >
            {t.social.challenges.cancel}
          </button>
        </div>
      )}
    </div>
  );
}
