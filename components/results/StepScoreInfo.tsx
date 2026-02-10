"use client";

import type { MatchQuality } from "@/types";
import { MATCH_QUALITY_LABELS } from "@/types";

interface Props {
  scoreTeamA: number;
  scoreTeamB: number;
  durationMinutes: number;
  matchQuality: MatchQuality;
  notes: string;
  onChange: (updates: Partial<{
    scoreTeamA: number;
    scoreTeamB: number;
    durationMinutes: number;
    matchQuality: MatchQuality;
    notes: string;
  }>) => void;
}

const QUALITY_OPTIONS: MatchQuality[] = ["excellent", "good", "average", "poor"];

const QUALITY_COLORS: Record<MatchQuality, string> = {
  excellent: "bg-pitch-500 text-white",
  good: "bg-blue-500 text-white",
  average: "bg-amber-500 text-white",
  poor: "bg-danger-500 text-white",
};

export default function StepScoreInfo({
  scoreTeamA,
  scoreTeamB,
  durationMinutes,
  matchQuality,
  notes,
  onChange,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">Score & infos</h2>
        <p className="text-sm text-surface-400">
          Saisis le score final et les détails du match
        </p>
      </div>

      {/* Score */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
        <p className="text-xs text-surface-500 text-center mb-4 uppercase tracking-wide font-semibold">
          Score final
        </p>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-xs font-semibold text-blue-400 mb-2">Équipe A</p>
            <input
              type="number"
              min="0"
              max="99"
              value={scoreTeamA}
              onChange={(e) => onChange({ scoreTeamA: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-20 h-20 text-center text-3xl font-bold bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <span className="text-2xl font-bold text-surface-500 mt-6">—</span>
          <div className="text-center">
            <p className="text-xs font-semibold text-amber-400 mb-2">Équipe B</p>
            <input
              type="number"
              min="0"
              max="99"
              value={scoreTeamB}
              onChange={(e) => onChange({ scoreTeamB: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-20 h-20 text-center text-3xl font-bold bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Durée réelle (minutes)
        </label>
        <input
          type="number"
          min="1"
          max="480"
          value={durationMinutes}
          onChange={(e) => onChange({ durationMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-surface-500 focus:outline-none focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500"
        />
      </div>

      {/* Quality */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Qualité du match
        </label>
        <div className="grid grid-cols-4 gap-2">
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onChange({ matchQuality: q })}
              className={`px-2 py-2 rounded-xl text-xs font-semibold transition-colors ${
                matchQuality === q
                  ? QUALITY_COLORS[q]
                  : "bg-surface-800 text-surface-400 hover:bg-surface-700"
              }`}
            >
              {MATCH_QUALITY_LABELS[q]}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Notes (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Commentaires sur le match..."
          className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-surface-500 focus:outline-none focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500 resize-none"
        />
      </div>
    </div>
  );
}
