"use client";

import Link from "next/link";
import type { MatchRegistrationWithProfile } from "@/types";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface PitchFormationProps {
  registrations: MatchRegistrationWithProfile[];
  capacity: number;
}

function PlayerRow({ registration }: { registration: MatchRegistrationWithProfile }) {
  const { profile } = registration;
  return (
    <Link
      href={`/players/${profile.id}`}
      className="flex items-center gap-2.5 py-2 group"
    >
      <ProfileAvatar
        firstName={profile.first_name}
        lastName={profile.last_name}
        country={profile.origin_country}
        clubSlug={profile.favorite_club}
        size="xs"
      />
      <span className="text-[13px] text-foreground truncate group-hover:text-pitch-400 transition-colors">
        {profile.first_name} {profile.last_name.charAt(0)}.
      </span>
    </Link>
  );
}

function EmptyRow() {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <div className="w-7 h-7 rounded-full bg-surface-800 shrink-0" />
      <span className="text-[13px] text-surface-600">—</span>
    </div>
  );
}

function TeamColumn({ players, emptyCount, teamLabel, count, max }: {
  players: MatchRegistrationWithProfile[];
  emptyCount: number;
  teamLabel: string;
  count: number;
  max: number;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
          {teamLabel}
        </span>
        <span className="text-[11px] text-surface-500">{count}/{max}</span>
      </div>
      <div>
        {players.map((r) => (
          <PlayerRow key={r.id} registration={r} />
        ))}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <EmptyRow key={`e-${i}`} />
        ))}
      </div>
    </div>
  );
}

export default function PitchFormation({ registrations, capacity }: PitchFormationProps) {
  const { t } = useTranslation();
  const confirmed = registrations.filter((r) => r.status === "confirmed");

  if (confirmed.length === 0) {
    return (
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 text-center">
        <svg className="w-8 h-8 mx-auto text-surface-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
        <p className="text-sm text-surface-400">{t.matchDetail.noPlayersYet}</p>
        <p className="text-xs text-surface-500 mt-0.5">{t.matchDetail.beFirst}</p>
      </div>
    );
  }

  const teamA: MatchRegistrationWithProfile[] = [];
  const teamB: MatchRegistrationWithProfile[] = [];
  confirmed.forEach((r, i) => {
    if (i % 2 === 0) teamA.push(r);
    else teamB.push(r);
  });

  const teamSizeMax = Math.ceil(capacity / 2);

  return (
    <div className="flex gap-4">
      <TeamColumn
        players={teamA}
        emptyCount={Math.max(0, teamSizeMax - teamA.length)}
        teamLabel={t.matchDetail.teamA}
        count={teamA.length}
        max={teamSizeMax}
      />
      <div className="w-px bg-surface-800 shrink-0" />
      <TeamColumn
        players={teamB}
        emptyCount={Math.max(0, teamSizeMax - teamB.length)}
        teamLabel={t.matchDetail.teamB}
        count={teamB.length}
        max={teamSizeMax}
      />
    </div>
  );
}
