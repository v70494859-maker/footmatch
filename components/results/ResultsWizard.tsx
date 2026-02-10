"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Match,
  MatchRegistrationWithProfile,
  MatchQuality,
  PlayerStatsFormEntry,
  SubmitResultsPayload,
} from "@/types";
import Button from "@/components/ui/Button";
import StepTeamComposition from "./StepTeamComposition";
import StepScoreInfo from "./StepScoreInfo";
import StepPlayerStats from "./StepPlayerStats";
import StepConfirmation from "./StepConfirmation";

interface Props {
  match: Match;
  operatorId: string;
  players: MatchRegistrationWithProfile[];
}

const STEPS = ["Équipes", "Score", "Stats", "Confirmer"];

export default function ResultsWizard({ match, operatorId, players }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [playerStats, setPlayerStats] = useState<PlayerStatsFormEntry[]>(
    players.map((r) => ({
      user_id: r.player_id,
      profile: r.profile,
      team: null,
      goals: 0,
      assists: 0,
      attended: true,
      mvp: false,
      yellow_card: false,
      red_card: false,
    }))
  );
  const [scoreTeamA, setScoreTeamA] = useState(0);
  const [scoreTeamB, setScoreTeamB] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(match.duration_minutes);
  const [matchQuality, setMatchQuality] = useState<MatchQuality>("good");
  const [notes, setNotes] = useState("");

  // Validation
  function canProceedStep1(): boolean {
    const allAssigned = playerStats.every((p) => p.team !== null || !p.attended);
    const teamACount = playerStats.filter((p) => p.team === "A").length;
    const teamBCount = playerStats.filter((p) => p.team === "B").length;
    return allAssigned && teamACount >= 1 && teamBCount >= 1;
  }

  function canProceedStep2(): boolean {
    return durationMinutes >= 1;
  }

  function canProceed(): boolean {
    if (step === 1) return canProceedStep1();
    if (step === 2) return canProceedStep2();
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const payload: SubmitResultsPayload = {
      match_id: match.id,
      operator_id: operatorId,
      score_team_a: scoreTeamA,
      score_team_b: scoreTeamB,
      duration_minutes: durationMinutes,
      match_quality: matchQuality,
      notes,
      player_stats: playerStats.map(({ profile: _, ...rest }) => rest),
    };

    try {
      const res = await fetch("/api/operator/submit-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      router.push(`/operator/matches/${match.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step progress */}
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 space-y-1">
            <div
              className={`h-1 rounded-full transition-colors ${
                i + 1 <= step ? "bg-pitch-400" : "bg-surface-800"
              }`}
            />
            <p
              className={`text-[10px] text-center font-medium ${
                i + 1 <= step ? "text-pitch-400" : "text-surface-500"
              }`}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && (
        <StepTeamComposition players={playerStats} onChange={setPlayerStats} />
      )}

      {step === 2 && (
        <StepScoreInfo
          scoreTeamA={scoreTeamA}
          scoreTeamB={scoreTeamB}
          durationMinutes={durationMinutes}
          matchQuality={matchQuality}
          notes={notes}
          onChange={(updates) => {
            if (updates.scoreTeamA !== undefined) setScoreTeamA(updates.scoreTeamA);
            if (updates.scoreTeamB !== undefined) setScoreTeamB(updates.scoreTeamB);
            if (updates.durationMinutes !== undefined) setDurationMinutes(updates.durationMinutes);
            if (updates.matchQuality !== undefined) setMatchQuality(updates.matchQuality);
            if (updates.notes !== undefined) setNotes(updates.notes);
          }}
        />
      )}

      {step === 3 && (
        <StepPlayerStats players={playerStats} onChange={setPlayerStats} />
      )}

      {step === 4 && (
        <StepConfirmation
          match={match}
          scoreTeamA={scoreTeamA}
          scoreTeamB={scoreTeamB}
          durationMinutes={durationMinutes}
          matchQuality={matchQuality}
          notes={notes}
          players={playerStats}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
        />
      )}

      {/* Navigation (not on step 4 — it has its own submit button) */}
      {step < 4 && (
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="secondary"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Retour
            </Button>
          )}
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className={step === 1 ? "w-full" : "flex-1"}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Back button on step 4 */}
      {step === 4 && (
        <Button
          variant="secondary"
          onClick={() => setStep(3)}
          fullWidth
        >
          Retour
        </Button>
      )}
    </div>
  );
}
