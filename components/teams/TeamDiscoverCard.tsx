"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const PRESET_COLORS: Record<string, string> = {
  red: "bg-red-600", blue: "bg-blue-600", green: "bg-green-600",
  yellow: "bg-yellow-500", purple: "bg-purple-600", orange: "bg-orange-500",
  pink: "bg-pink-500", cyan: "bg-cyan-500",
};

interface TeamDiscoverCardProps {
  team: {
    id: string;
    name: string;
    description: string | null;
    crest_url: string | null;
    crest_preset: string | null;
    city: string | null;
    member_count: number;
  };
}

export default function TeamDiscoverCard({ team }: TeamDiscoverCardProps) {
  const { t } = useTranslation();

  const initials = team.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const presetColor = team.crest_preset ? PRESET_COLORS[team.crest_preset] ?? "bg-surface-700" : null;

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4 hover:border-surface-700 transition-colors">
      <div className="flex items-start gap-3">
        {/* Crest */}
        {team.crest_url ? (
          <img src={team.crest_url} alt={team.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
        ) : (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${presetColor ?? "bg-pitch-900"}`}>
            <span className={`text-base font-bold ${presetColor ? "text-white" : "text-pitch-400"}`}>{initials}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-surface-100 truncate">{team.name}</h4>
          {team.description && (
            <p className="text-xs text-surface-500 line-clamp-1 mt-0.5">{team.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            {team.city && (
              <span className="text-[10px] text-surface-500 flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {team.city}
              </span>
            )}
            <span className="text-[10px] text-surface-500">
              {team.member_count} {team.member_count === 1 ? t.social.teams.member : t.social.teams.members}
            </span>
          </div>
        </div>
      </div>

      <Link
        href={`/teams/${team.id}`}
        className="block mt-3 w-full text-center px-3 py-1.5 bg-surface-800 text-surface-200 text-xs font-medium rounded-lg hover:bg-surface-700 transition-colors"
      >
        {t.social.teams.view}
      </Link>
    </div>
  );
}
