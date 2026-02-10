"use client";

import type { PlayerStatsFormEntry } from "@/types";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

interface Props {
  players: PlayerStatsFormEntry[];
  onChange: (players: PlayerStatsFormEntry[]) => void;
}

function CounterInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-surface-500 w-6">{label}</span>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-6 h-6 rounded-md bg-surface-800 text-surface-400 text-xs font-bold hover:bg-surface-700 transition-colors flex items-center justify-center"
      >
        -
      </button>
      <span className="text-sm font-semibold text-foreground w-5 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded-md bg-surface-800 text-surface-400 text-xs font-bold hover:bg-surface-700 transition-colors flex items-center justify-center"
      >
        +
      </button>
    </div>
  );
}

export default function StepPlayerStats({ players, onChange }: Props) {
  const attended = players.filter((p) => p.attended);
  const teamA = attended.filter((p) => p.team === "A");
  const teamB = attended.filter((p) => p.team === "B");

  function updatePlayer(userId: string, updates: Partial<PlayerStatsFormEntry>) {
    // If setting MVP, deselect all others first
    if (updates.mvp === true) {
      onChange(
        players.map((p) =>
          p.user_id === userId
            ? { ...p, ...updates }
            : { ...p, mvp: false }
        )
      );
    } else {
      onChange(
        players.map((p) =>
          p.user_id === userId ? { ...p, ...updates } : p
        )
      );
    }
  }

  function renderPlayerRow(player: PlayerStatsFormEntry) {
    return (
      <div
        key={player.user_id}
        className={`bg-surface-900 border border-surface-800 rounded-xl p-3 space-y-2.5 ${
          player.mvp ? "ring-1 ring-amber-500/40" : ""
        }`}
      >
        {/* Header: avatar + name + MVP */}
        <div className="flex items-center gap-2.5">
          <ProfileAvatar
            firstName={player.profile.first_name}
            lastName={player.profile.last_name}
            country={player.profile.origin_country}
            clubSlug={player.profile.favorite_club}
            size="xs"
          />
          <span className="text-sm font-medium text-foreground flex-1 truncate">
            {player.profile.first_name} {player.profile.last_name}
          </span>
          <button
            type="button"
            onClick={() => updatePlayer(player.user_id, { mvp: !player.mvp })}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 ${
              player.mvp
                ? "bg-amber-500 text-white"
                : "bg-surface-800 text-surface-400 hover:bg-surface-700"
            }`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            MVP
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 flex-wrap">
          <CounterInput
            label="Buts"
            value={player.goals}
            onChange={(v) => updatePlayer(player.user_id, { goals: v })}
          />
          <CounterInput
            label="Ass."
            value={player.assists}
            onChange={(v) => updatePlayer(player.user_id, { assists: v })}
          />
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => updatePlayer(player.user_id, { yellow_card: !player.yellow_card })}
              className={`w-5 h-7 rounded-sm transition-colors ${
                player.yellow_card
                  ? "bg-amber-400 shadow-md"
                  : "bg-surface-700 hover:bg-surface-600"
              }`}
              title="Carton jaune"
            />
            <button
              type="button"
              onClick={() => updatePlayer(player.user_id, { red_card: !player.red_card })}
              className={`w-5 h-7 rounded-sm transition-colors ${
                player.red_card
                  ? "bg-danger-500 shadow-md"
                  : "bg-surface-700 hover:bg-surface-600"
              }`}
              title="Carton rouge"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">Stats individuelles</h2>
        <p className="text-sm text-surface-400">
          Saisis les stats de chaque joueur et désigne le MVP
        </p>
      </div>

      {/* Team A */}
      {teamA.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">
            Équipe A
          </p>
          <div className="space-y-2">
            {teamA.map(renderPlayerRow)}
          </div>
        </div>
      )}

      {/* Team B */}
      {teamB.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
            Équipe B
          </p>
          <div className="space-y-2">
            {teamB.map(renderPlayerRow)}
          </div>
        </div>
      )}
    </div>
  );
}
