"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { SocialTeam, TeamRole } from "@/types";

// Preset crest color palette
const PRESET_COLORS: Record<string, string> = {
  red: "bg-red-600",
  blue: "bg-blue-600",
  green: "bg-green-600",
  yellow: "bg-yellow-500",
  purple: "bg-purple-600",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
};

interface TeamCardProps {
  team: SocialTeam;
  myRole: TeamRole;
}

export default function TeamCard({ team, myRole }: TeamCardProps) {
  const { t } = useTranslation();

  const initials = team.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel =
    myRole === "captain"
      ? t.social.teams.captain
      : myRole === "co_captain"
      ? t.social.teams.coCaptain
      : t.social.teams.member;

  const roleStyle =
    myRole === "captain"
      ? "bg-amber-500/10 text-amber-400"
      : myRole === "co_captain"
      ? "bg-blue-500/10 text-blue-400"
      : "bg-surface-700/50 text-surface-400";

  const presetColor = team.crest_preset ? PRESET_COLORS[team.crest_preset] ?? "bg-surface-700" : null;

  return (
    <Link
      href={`/social/teams/${team.id}`}
      className="group flex items-center gap-4 bg-surface-900 border border-surface-800 rounded-2xl p-4 hover:border-surface-700 transition-colors"
    >
      {/* Crest */}
      {team.crest_url ? (
        <img
          src={team.crest_url}
          alt={team.name}
          className="w-14 h-14 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
            presetColor ?? "bg-pitch-900"
          }`}
        >
          <span className={`text-lg font-bold ${presetColor ? "text-white" : "text-pitch-400"}`}>
            {initials}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-surface-100 group-hover:text-pitch-400 transition-colors truncate">
            {team.name}
          </h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${roleStyle}`}>
            {roleLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {team.city && (
            <span className="text-xs text-surface-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {team.city}
            </span>
          )}
          <span className="text-xs text-surface-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            {team.member_count} {team.member_count === 1 ? t.social.teams.member : t.social.teams.members}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <svg className="w-5 h-5 text-surface-600 group-hover:text-surface-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}
