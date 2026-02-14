"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface TeamsStatsWidgetProps {
  totalTeams: number;
  totalChallengesWon: number;
  totalChallengesPlayed: number;
}

export default function TeamsStatsWidget({ totalTeams, totalChallengesWon, totalChallengesPlayed }: TeamsStatsWidgetProps) {
  const { t } = useTranslation();
  const winRate = totalChallengesPlayed > 0 ? Math.round((totalChallengesWon / totalChallengesPlayed) * 100) : 0;

  return (
    <div className="sticky top-4 space-y-4">
      {/* Stats Card */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-surface-100 mb-3">{t.social.teams.stats}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-800/50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <svg className="w-4 h-4 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-surface-50">{totalTeams}</p>
            <p className="text-[10px] text-surface-500">{t.social.teams.myTeams}</p>
          </div>
          <div className="bg-surface-800/50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 10.5h-.75a.75.75 0 01-.75-.75V6.75a3 3 0 116 0v3a.75.75 0 01-.75.75h-.75A3.375 3.375 0 0012 14.25v4.5m-3-9V6.75a3 3 0 00-3-3 3 3 0 00-3 3v3a.75.75 0 00.75.75h.75A3.375 3.375 0 019 14.25v4.5" />
              </svg>
            </div>
            <p className="text-lg font-bold text-surface-50">{totalChallengesWon}</p>
            <p className="text-[10px] text-surface-500">{t.social.teams.challengesWon}</p>
          </div>
          <div className="bg-surface-800/50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-surface-50">{totalChallengesPlayed}</p>
            <p className="text-[10px] text-surface-500">{t.social.teams.challengesPlayed}</p>
          </div>
          <div className="bg-surface-800/50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <svg className="w-4 h-4 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <p className="text-lg font-bold text-surface-50">{winRate}%</p>
            <p className="text-[10px] text-surface-500">{t.social.teams.winRate}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
        <Link
          href="/teams/create"
          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/50 transition-colors border-b border-surface-800/50"
        >
          <svg className="w-5 h-5 text-pitch-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-sm text-surface-50 flex-1">{t.social.teams.createTeam}</span>
        </Link>
        <Link
          href="/social/friends"
          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/50 transition-colors"
        >
          <svg className="w-5 h-5 text-surface-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span className="text-sm text-surface-50 flex-1">{t.social.teams.findPlayers}</span>
        </Link>
      </div>
    </div>
  );
}
