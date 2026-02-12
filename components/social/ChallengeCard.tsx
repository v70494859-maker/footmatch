"use client";

import { Fragment, useState } from "react";
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

const STATUS_STEPS: ChallengeStatus[] = ["proposed", "accepted", "scheduled", "in_progress", "completed"];

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
  const currentIndex = STATUS_STEPS.indexOf(challenge.status);

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
      return <img src={team.crest_url} alt="" className="w-14 h-14 rounded-xl object-cover" />;
    }
    return (
      <div className="w-14 h-14 rounded-xl bg-pitch-900 flex items-center justify-center text-pitch-400 text-sm font-bold">
        {team.name.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
      {/* Teams matchup */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          {getCrestDisplay(challenge.challenger_team)}
          <span className="text-sm font-medium text-surface-100 text-center">{challenge.challenger_team.name}</span>
          <span className="text-[10px] text-surface-500">{challenge.challenger_team.member_count} membres</span>
        </div>
        <span className="text-xs font-bold text-surface-500 uppercase px-2">VS</span>
        <div className="flex flex-col items-center gap-1.5 flex-1">
          {getCrestDisplay(challenge.challenged_team)}
          <span className="text-sm font-medium text-surface-100 text-center">{challenge.challenged_team.name}</span>
          <span className="text-[10px] text-surface-500">{challenge.challenged_team.member_count} membres</span>
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-xs text-surface-400">
        <div className="flex items-center gap-3">
          {challenge.proposed_date && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {new Date(challenge.proposed_date).toLocaleDateString()}
            </span>
          )}
          {challenge.proposed_venue && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {challenge.proposed_venue}
            </span>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[challenge.status]}`}>
          {t.social.challenges.status[statusKey]}
        </span>
      </div>

      {/* Status timeline */}
      {challenge.status === "declined" ? (
        <div className="flex items-center justify-center gap-2 mt-3">
          <svg className="w-4 h-4 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-[10px] text-danger-500 font-medium">{t.social.challenges.status.declined}</span>
        </div>
      ) : challenge.status === "canceled" ? (
        <div className="flex items-center justify-center gap-2 mt-3">
          <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-[10px] text-surface-500 font-medium">{t.social.challenges.status.canceled}</span>
        </div>
      ) : (
        <div className="flex items-center gap-0 mt-3 px-1">
          {STATUS_STEPS.map((step, i) => (
            <Fragment key={step}>
              {i > 0 && (
                <div
                  className={`flex-1 h-0.5 ${i <= currentIndex ? "bg-pitch-400" : "bg-surface-700"}`}
                />
              )}
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  i === currentIndex
                    ? "bg-pitch-400 ring-2 ring-pitch-400/30"
                    : i < currentIndex
                      ? "bg-pitch-400"
                      : "bg-surface-700"
                }`}
              />
            </Fragment>
          ))}
        </div>
      )}

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
