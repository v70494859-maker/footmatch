"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { TeamRole, Profile } from "@/types";

interface MemberRow {
  id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  profile: Profile;
}

interface TeamMemberListProps {
  members: MemberRow[];
  captainId: string;
}

export default function TeamMemberList({ members, captainId }: TeamMemberListProps) {
  const { t } = useTranslation();

  // Sort: captain first, then co-captains, then members
  const sorted = [...members].sort((a, b) => {
    const order: Record<TeamRole, number> = { captain: 0, co_captain: 1, member: 2 };
    return order[a.role] - order[b.role];
  });

  const getInitials = (p: Profile) =>
    `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase();

  const getRoleLabel = (role: TeamRole) => {
    switch (role) {
      case "captain":
        return t.social.teams.captain;
      case "co_captain":
        return t.social.teams.coCaptain;
      default:
        return null;
    }
  };

  const getRoleStyle = (role: TeamRole) => {
    switch (role) {
      case "captain":
        return "bg-amber-500/10 text-amber-400";
      case "co_captain":
        return "bg-blue-500/10 text-blue-400";
      default:
        return "";
    }
  };

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-surface-500 text-center py-4">
        {t.social.teams.noMembers}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((member) => {
        const roleLabel = getRoleLabel(member.role);
        return (
          <Link
            key={member.id}
            href={`/players/${member.user_id}`}
            className="flex items-center gap-3 bg-surface-900 border border-surface-800 rounded-xl p-3 hover:border-surface-700 transition-colors"
          >
            {/* Avatar */}
            {member.profile.avatar_url ? (
              <img
                src={member.profile.avatar_url}
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-pitch-900 flex items-center justify-center text-pitch-400 text-sm font-semibold shrink-0">
                {getInitials(member.profile)}
              </div>
            )}

            {/* Name & role */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {member.role === "captain" && (
                  <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
                  </svg>
                )}
                <p className="text-sm font-medium text-surface-100 truncate">
                  {member.profile.first_name} {member.profile.last_name}
                </p>
                {roleLabel && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${getRoleStyle(member.role)}`}>
                    {roleLabel}
                  </span>
                )}
              </div>
              {member.profile.city && (
                <p className="text-xs text-surface-500 mt-0.5">{member.profile.city}</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
