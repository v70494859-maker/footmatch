"use client";

import type { PlayerStatsFormEntry } from "@/types";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

interface Props {
  players: PlayerStatsFormEntry[];
  onChange: (players: PlayerStatsFormEntry[]) => void;
}

export default function StepTeamComposition({ players, onChange }: Props) {
  function assignTeam(userId: string, team: "A" | "B") {
    onChange(
      players.map((p) =>
        p.user_id === userId ? { ...p, team, attended: true } : p
      )
    );
  }

  function markAbsent(userId: string) {
    onChange(
      players.map((p) =>
        p.user_id === userId
          ? { ...p, team: null, attended: false, goals: 0, assists: 0, mvp: false, yellow_card: false, red_card: false }
          : p
      )
    );
  }

  const teamA = players.filter((p) => p.team === "A");
  const teamB = players.filter((p) => p.team === "B");
  const absent = players.filter((p) => !p.attended);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">Composition des équipes</h2>
        <p className="text-sm text-surface-400">
          Répartis les joueurs en deux équipes ou marque les absents
        </p>
      </div>

      {/* Team counters */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl py-2">
          <p className="text-lg font-bold text-blue-400">{teamA.length}</p>
          <p className="text-[10px] text-blue-400/70 uppercase tracking-wide">Équipe A</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl py-2">
          <p className="text-lg font-bold text-amber-400">{teamB.length}</p>
          <p className="text-[10px] text-amber-400/70 uppercase tracking-wide">Équipe B</p>
        </div>
        <div className="bg-surface-800 border border-surface-700 rounded-xl py-2">
          <p className="text-lg font-bold text-surface-400">{absent.length}</p>
          <p className="text-[10px] text-surface-500 uppercase tracking-wide">Absents</p>
        </div>
      </div>

      {/* Player list */}
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.user_id}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
              player.team === "A"
                ? "bg-blue-500/5 border-blue-500/20"
                : player.team === "B"
                ? "bg-amber-500/5 border-amber-500/20"
                : !player.attended
                ? "bg-surface-900 border-danger-500/20 opacity-60"
                : "bg-surface-900 border-surface-800"
            }`}
          >
            <ProfileAvatar
              firstName={player.profile.first_name}
              lastName={player.profile.last_name}
              country={player.profile.origin_country}
              clubSlug={player.profile.favorite_club}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {player.profile.first_name} {player.profile.last_name}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => assignTeam(player.user_id, "A")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  player.team === "A"
                    ? "bg-blue-500 text-white"
                    : "bg-surface-800 text-surface-400 hover:bg-surface-700"
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => assignTeam(player.user_id, "B")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  player.team === "B"
                    ? "bg-amber-500 text-white"
                    : "bg-surface-800 text-surface-400 hover:bg-surface-700"
                }`}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => markAbsent(player.user_id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  !player.attended
                    ? "bg-danger-500 text-white"
                    : "bg-surface-800 text-surface-400 hover:bg-surface-700"
                }`}
              >
                Abs
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
