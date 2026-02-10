import Link from "next/link";
import type { MatchRegistrationWithProfile } from "@/types";
import { formatDate } from "@/lib/format";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

interface RegistrationListProps {
  registrations: MatchRegistrationWithProfile[];
}

export default function RegistrationList({
  registrations,
}: RegistrationListProps) {
  const confirmed = registrations.filter((r) => r.status === "confirmed");

  if (confirmed.length === 0) {
    return (
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 text-center">
        <svg
          className="w-8 h-8 mx-auto text-surface-700 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
        <p className="text-sm text-surface-400">Aucun joueur inscrit pour le moment</p>
        <p className="text-xs text-surface-500 mt-0.5">
          Soyez le premier à rejoindre ce match
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {confirmed.map((registration) => {
        const { profile } = registration;
        const playerHref = `/players/${profile.id}`;
          return (
          <div
            key={registration.id}
            className="flex items-center gap-3 bg-surface-900 border border-surface-800 rounded-xl px-3 py-2.5"
          >
            <ProfileAvatar
              firstName={profile.first_name}
              lastName={profile.last_name}
              country={profile.origin_country}
              clubSlug={profile.favorite_club}
              size="sm"
              href={playerHref}
            />

            {/* Name + joined date */}
            <div className="flex-1 min-w-0">
              <Link href={playerHref} className="text-sm font-medium text-foreground truncate hover:text-pitch-400 transition-colors block">
                {profile.first_name} {profile.last_name}
              </Link>
              <p className="text-[10px] text-surface-500">
                Inscrit le {formatDate(registration.created_at.split("T")[0])}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
