"use client";

import type { Match, MatchQuality, PlayerStatsFormEntry } from "@/types";
import { MATCH_QUALITY_LABELS } from "@/types";
import { formatDuration } from "@/lib/format";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import Button from "@/components/ui/Button";

interface Props {
  match: Match;
  scoreTeamA: number;
  scoreTeamB: number;
  durationMinutes: number;
  matchQuality: MatchQuality;
  notes: string;
  players: PlayerStatsFormEntry[];
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}

export default function StepConfirmation({
  match,
  scoreTeamA,
  scoreTeamB,
  durationMinutes,
  matchQuality,
  notes,
  players,
  onSubmit,
  submitting,
  error,
}: Props) {
  const teamA = players.filter((p) => p.team === "A" && p.attended);
  const teamB = players.filter((p) => p.team === "B" && p.attended);
  const absent = players.filter((p) => !p.attended);
  const mvpPlayer = players.find((p) => p.mvp);

  function renderPlayerSummary(player: PlayerStatsFormEntry) {
    const badges: string[] = [];
    if (player.goals > 0) badges.push(`${player.goals} but${player.goals > 1 ? "s" : ""}`);
    if (player.assists > 0) badges.push(`${player.assists} ass.`);
    if (player.yellow_card) badges.push("CJ");
    if (player.red_card) badges.push("CR");

    return (
      <div key={player.user_id} className="flex items-center gap-2.5 py-1.5">
        <ProfileAvatar
          firstName={player.profile.first_name}
          lastName={player.profile.last_name}
          country={player.profile.origin_country}
          clubSlug={player.profile.favorite_club}
          size="xs"
        />
        <span className="text-sm text-foreground flex-1 truncate">
          {player.profile.first_name} {player.profile.last_name}
        </span>
        {player.mvp && (
          <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-400 rounded-full px-2 py-0.5">
            MVP
          </span>
        )}
        {badges.length > 0 && (
          <span className="text-[10px] text-surface-400">{badges.join(" · ")}</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">Confirmation</h2>
        <p className="text-sm text-surface-400">
          Vérifie les résultats avant de soumettre
        </p>
      </div>

      {/* Score summary */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 text-center">
        <p className="text-xs text-surface-500 uppercase tracking-wide mb-3 font-semibold">
          {match.title}
        </p>
        <div className="flex items-center justify-center gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-1">Équipe A</p>
            <p className="text-4xl font-bold text-blue-400">{scoreTeamA}</p>
          </div>
          <span className="text-xl font-bold text-surface-500 mt-4">—</span>
          <div>
            <p className="text-xs font-semibold text-amber-400 mb-1">Équipe B</p>
            <p className="text-4xl font-bold text-amber-400">{scoreTeamB}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-surface-400">
          <span>{formatDuration(durationMinutes)}</span>
          <span>·</span>
          <span>{MATCH_QUALITY_LABELS[matchQuality]}</span>
        </div>
      </div>

      {/* MVP highlight */}
      {mvpPlayer && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-sm font-medium text-amber-400">
            MVP : {mvpPlayer.profile.first_name} {mvpPlayer.profile.last_name}
          </span>
        </div>
      )}

      {/* Team A */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">
          Équipe A ({teamA.length})
        </p>
        <div className="divide-y divide-surface-800">
          {teamA.map(renderPlayerSummary)}
        </div>
      </div>

      {/* Team B */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
          Équipe B ({teamB.length})
        </p>
        <div className="divide-y divide-surface-800">
          {teamB.map(renderPlayerSummary)}
        </div>
      </div>

      {/* Absent */}
      {absent.length > 0 && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
            Absents ({absent.length})
          </p>
          <div className="divide-y divide-surface-800">
            {absent.map((p) => (
              <div key={p.user_id} className="flex items-center gap-2.5 py-1.5 opacity-50">
                <ProfileAvatar
                  firstName={p.profile.first_name}
                  lastName={p.profile.last_name}
                  country={p.profile.origin_country}
                  clubSlug={p.profile.favorite_club}
                  size="xs"
                />
                <span className="text-sm text-surface-400 truncate">
                  {p.profile.first_name} {p.profile.last_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-surface-300 whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {error && (
        <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 text-center">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      <Button onClick={onSubmit} loading={submitting} fullWidth>
        Soumettre les résultats
      </Button>
    </div>
  );
}
