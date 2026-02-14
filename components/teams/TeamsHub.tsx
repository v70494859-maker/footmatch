"use client";

import { useState, useMemo } from "react";
import type { SocialTeam, TeamRole, TeamChallengeWithTeams } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import TeamsStatsWidget from "./TeamsStatsWidget";
import TeamsActivitySidebar from "./TeamsActivitySidebar";
import TeamDiscoverCard from "./TeamDiscoverCard";
import TeamCard from "@/components/social/TeamCard";
import ChallengeCard from "@/components/social/ChallengeCard";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TeamWithRole extends SocialTeam {
  myRole: TeamRole;
}

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

interface DiscoverTeam {
  id: string;
  name: string;
  description: string | null;
  crest_url: string | null;
  crest_preset: string | null;
  city: string | null;
  member_count: number;
}

interface ChallengeWithContext extends TeamChallengeWithTeams {
  myTeamId: string;
  isCaptainOfTeam: boolean;
}

interface TeamsHubProps {
  userId: string;
  teams: TeamWithRole[];
  pendingInvitations: Invitation[];
  totalChallengesWon: number;
  totalChallengesPlayed: number;
  upcomingChallenges: UpcomingChallenge[];
  teamLeaderboard: LeaderboardTeam[];
  allPublicTeams: DiscoverTeam[];
  allMyChallenges: ChallengeWithContext[];
  teamMemberAvatars: Record<string, { first_name: string; last_name: string; avatar_url: string | null }[]>;
  teamChallengeCounts: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

type Tab = "myTeams" | "explore" | "challenges";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TeamsHub({
  userId,
  teams,
  pendingInvitations,
  totalChallengesWon,
  totalChallengesPlayed,
  upcomingChallenges,
  teamLeaderboard,
  allPublicTeams,
  allMyChallenges,
  teamMemberAvatars,
  teamChallengeCounts,
}: TeamsHubProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("myTeams");
  const [search, setSearch] = useState("");
  const [challengeFilter, setChallengeFilter] = useState<"all" | "active" | "finished">("all");
  const [challenges, setChallenges] = useState(allMyChallenges);

  const tabs: { key: Tab; label: string }[] = [
    { key: "myTeams", label: t.social.teams.myTeams },
    { key: "explore", label: t.social.teams.explore },
    { key: "challenges", label: t.social.teams.challenges },
  ];

  // Filtered teams
  const filteredTeams = useMemo(() => {
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, search]);

  // Filtered discover teams
  const filteredDiscover = useMemo(() => {
    if (!search.trim()) return allPublicTeams;
    const q = search.toLowerCase();
    return allPublicTeams.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.city && t.city.toLowerCase().includes(q))
    );
  }, [allPublicTeams, search]);

  // Filtered challenges
  const filteredChallenges = useMemo(() => {
    if (challengeFilter === "all") return challenges;
    if (challengeFilter === "active") {
      return challenges.filter((c) => ["proposed", "accepted", "scheduled", "in_progress"].includes(c.status));
    }
    return challenges.filter((c) => ["completed", "declined", "canceled"].includes(c.status));
  }, [challenges, challengeFilter]);

  const handleChallengeStatusUpdate = (challengeId: string, newStatus: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? { ...c, status: newStatus as any } : c))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-6">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden lg:block">
          <TeamsStatsWidget
            totalTeams={teams.length}
            totalChallengesWon={totalChallengesWon}
            totalChallengesPlayed={totalChallengesPlayed}
          />
        </aside>

        {/* ── CENTER ── */}
        <main className="min-w-0">
          {/* Tab Bar */}
          <div className="flex gap-1 p-1 bg-surface-900 rounded-xl border border-surface-800 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearch(""); }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-pitch-400/15 text-pitch-400"
                    : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          {(activeTab === "myTeams" || activeTab === "explore") && (
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.social.teams.searchTeams}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-900 border border-surface-800 rounded-xl text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-pitch-500"
              />
            </div>
          )}

          {/* Challenge status filter */}
          {activeTab === "challenges" && (
            <div className="flex gap-2 mb-4">
              {(["all", "active", "finished"] as const).map((f) => {
                const label = f === "all" ? t.social.teams.allStatuses : f === "active" ? t.social.teams.inProgress : t.social.teams.finished;
                return (
                  <button
                    key={f}
                    onClick={() => setChallengeFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      challengeFilter === f
                        ? "bg-pitch-400/15 text-pitch-400"
                        : "bg-surface-900 text-surface-400 hover:text-surface-200 border border-surface-800"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── TAB: My Teams ── */}
          {activeTab === "myTeams" && (
            <>
              {filteredTeams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <svg className="w-12 h-12 text-surface-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  <p className="text-sm text-surface-500">{t.social.teams.noTeams}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTeams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      myRole={team.myRole}
                      memberAvatars={teamMemberAvatars[team.id]}
                      challengeCount={teamChallengeCounts[team.id]}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TAB: Explore ── */}
          {activeTab === "explore" && (
            <>
              {filteredDiscover.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <svg className="w-12 h-12 text-surface-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <p className="text-sm text-surface-500">{t.social.teams.noTeams}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredDiscover.map((team) => (
                    <TeamDiscoverCard key={team.id} team={team} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TAB: Challenges ── */}
          {activeTab === "challenges" && (
            <>
              {filteredChallenges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <svg className="w-12 h-12 text-surface-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 10.5h-.75a.75.75 0 01-.75-.75V6.75a3 3 0 116 0v3a.75.75 0 01-.75.75h-.75A3.375 3.375 0 0012 14.25v4.5m-3-9V6.75a3 3 0 00-3-3 3 3 0 00-3 3v3a.75.75 0 00.75.75h.75A3.375 3.375 0 019 14.25v4.5" />
                  </svg>
                  <p className="text-sm text-surface-500">{t.social.challenges.noChallenges}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      currentTeamId={challenge.myTeamId}
                      isCaptain={challenge.isCaptainOfTeam}
                      onStatusUpdate={handleChallengeStatusUpdate}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="hidden lg:block">
          <TeamsActivitySidebar
            pendingInvitations={pendingInvitations}
            upcomingChallenges={upcomingChallenges}
            teamLeaderboard={teamLeaderboard}
          />
        </aside>
      </div>
    </div>
  );
}
