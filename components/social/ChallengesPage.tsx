"use client";

import { useState } from "react";
import Link from "next/link";
import type { TeamChallengeWithTeams, TeamRole } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import ChallengeCard from "./ChallengeCard";
import ChallengeCreationForm from "./ChallengeCreationForm";

interface ChallengesPageProps {
  teamId: string;
  teamName: string;
  userId: string;
  userRole: TeamRole;
  challenges: TeamChallengeWithTeams[];
}

export default function ChallengesPage({ teamId, teamName, userId, userRole, challenges: initialChallenges }: ChallengesPageProps) {
  const { t } = useTranslation();
  const [challenges, setChallenges] = useState(initialChallenges);
  const [showCreate, setShowCreate] = useState(false);
  const isCaptain = userRole === "captain" || userRole === "co_captain";

  const handleCreated = (challenge: TeamChallengeWithTeams) => {
    setChallenges((prev) => [challenge, ...prev]);
    setShowCreate(false);
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus as TeamChallengeWithTeams["status"] } : c))
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/teams/${teamId}`} className="text-sm text-surface-400 hover:text-surface-200 transition-colors">
            &larr; {teamName}
          </Link>
          <h1 className="text-2xl font-bold text-surface-50 mt-1">{t.social.challenges.title}</h1>
        </div>
        {isCaptain && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-pitch-400 text-surface-950 text-sm font-semibold rounded-xl hover:bg-pitch-300 transition-colors"
          >
            {t.social.challenges.createChallenge}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-6">
          <ChallengeCreationForm
            teamId={teamId}
            onCreated={handleCreated}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {challenges.length > 0 ? (
        <div className="space-y-3">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              currentTeamId={teamId}
              isCaptain={isCaptain}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-surface-500 py-12">{t.social.challenges.noChallenges}</p>
      )}
    </div>
  );
}
