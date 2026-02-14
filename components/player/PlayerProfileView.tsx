"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Profile, PlayerCareerStats, PlayerMatchHistory } from "@/types";
import { USER_ROLE_LABELS } from "@/types";
import { getFlagForCountry } from "@/lib/cities";
import { formatDate } from "@/lib/format";
import { getClubBySlug, getClubLogo } from "@/lib/clubs";
import Image from "next/image";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import SubscriptionGate from "@/components/ui/SubscriptionGate";
import AddFriendButton from "@/components/social/AddFriendButton";

interface PlayerProfileViewProps {
  profile: Profile;
  careerStats: PlayerCareerStats | null;
  recentMatches: PlayerMatchHistory[];
  hasSubscription: boolean;
  currentUserId?: string;
}

const roleBadgeColors: Record<string, string> = {
  player: "bg-pitch-400/15 text-pitch-400 border-pitch-400/30",
  operator: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  admin: "bg-red-400/15 text-red-400 border-red-400/30",
};

export default function PlayerProfileView({
  profile,
  careerStats,
  recentMatches,
  hasSubscription,
  currentUserId,
}: PlayerProfileViewProps) {
  const router = useRouter();

  const favoriteClub = profile.favorite_club
    ? getClubBySlug(profile.favorite_club)
    : null;

  // Compute last 5 form results (V/N/D)
  const recentForm = recentMatches
    .filter((e) => e.match_result && e.team)
    .slice(0, 5)
    .map((e) => {
      const r = e.match_result!;
      const won =
        e.team === "A"
          ? r.score_team_a > r.score_team_b
          : r.score_team_b > r.score_team_a;
      const draw = r.score_team_a === r.score_team_b;
      return won ? ("V" as const) : draw ? ("N" as const) : ("D" as const);
    });

  return (
    <div className="pb-24 lg:pb-8">
      {/* Back link */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-foreground transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Retour
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-6">
        {/* Header — always visible */}
        <div className="flex flex-col items-center gap-4">
          <ProfileAvatar
            firstName={profile.first_name}
            lastName={profile.last_name}
            country={profile.origin_country}
            clubSlug={profile.favorite_club}
            size="lg"
          />

          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-foreground">
              {profile.first_name} {profile.last_name}
            </h1>
            {(profile.city || profile.origin_country) && (
              <p className="text-surface-400 text-sm">
                {profile.city && <span>{profile.city}</span>}
                {profile.city && profile.origin_country && (
                  <span> &middot; </span>
                )}
                {profile.origin_country && (
                  <span>
                    {getFlagForCountry(profile.origin_country)}{" "}
                    {profile.origin_country}
                  </span>
                )}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span
                className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${
                  roleBadgeColors[profile.role] ??
                  "bg-surface-800 text-surface-300 border-surface-700"
                }`}
              >
                {USER_ROLE_LABELS[profile.role]}
              </span>
              {favoriteClub && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-surface-800/60 text-surface-300 border-surface-700">
                  <Image
                    src={getClubLogo(favoriteClub.slug)}
                    alt={favoriteClub.name}
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                  />
                  {favoriteClub.name}
                </span>
              )}
            </div>
            {recentForm.length > 0 && (
              <div className="flex items-center justify-center gap-1">
                {recentForm.map((r, i) => (
                  <span
                    key={i}
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white ${
                      r === "V"
                        ? "bg-pitch-500"
                        : r === "D"
                        ? "bg-danger-500"
                        : "bg-amber-500"
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
            {currentUserId && profile.role === "player" && (
              <AddFriendButton
                targetUserId={profile.id}
                currentUserId={currentUserId}
                className="mt-2"
              />
            )}
            <p className="text-xs text-surface-500">
              Membre depuis{" "}
              {new Date(profile.created_at).toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Career Stats — subscription-gated */}
        <SubscriptionGate hasSubscription={hasSubscription}>
          {careerStats && careerStats.total_matches > 0 ? (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-surface-300">
                Statistiques
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {careerStats.total_matches}
                  </p>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wider">
                    Matchs
                  </p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {careerStats.total_goals}
                  </p>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wider">
                    Buts
                  </p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {careerStats.total_assists}
                  </p>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wider">
                    Passes
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center border-t border-surface-800 pt-3">
                <div>
                  <p className="text-sm font-bold text-pitch-400">
                    {careerStats.win_count}V
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-surface-300">
                    {careerStats.draw_count}N
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-danger-500">
                    {careerStats.loss_count}D
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-400">
                    {careerStats.total_mvp} MVP
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center border-t border-surface-800 pt-3">
                <div>
                  <p className={`text-sm font-bold ${
                    careerStats.attendance_rate >= 0.9 ? "text-pitch-400" :
                    careerStats.attendance_rate >= 0.75 ? "text-amber-400" : "text-danger-500"
                  }`}>
                    {Math.round(careerStats.attendance_rate * 100)}%
                  </p>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wider">
                    Pr&eacute;sence
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-bold ${
                    careerStats.late_cancel_count === 0 ? "text-pitch-400" :
                    careerStats.late_cancel_count <= 2 ? "text-amber-400" : "text-danger-500"
                  }`}>
                    {careerStats.late_cancel_count}
                  </p>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wider">
                    Retards
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-bold ${
                    careerStats.no_show_count === 0 ? "text-pitch-400" :
                    careerStats.no_show_count <= 2 ? "text-amber-400" : "text-danger-500"
                  }`}>
                    {careerStats.no_show_count}
                  </p>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wider">
                    No-show
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 text-center">
              <p className="text-sm text-surface-400">
                Aucune statistique disponible
              </p>
              <p className="text-xs text-surface-500 mt-0.5">
                Ce joueur n&apos;a pas encore particip&eacute; &agrave; un match
              </p>
            </div>
          )}
        </SubscriptionGate>



        {/* Recent Matches — subscription-gated */}
        <SubscriptionGate hasSubscription={hasSubscription}>
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-surface-300">
              Derniers matchs
            </h3>
            {recentMatches.length > 0 ? (
              <div className="divide-y divide-surface-800">
                {recentMatches.map((entry) => {
                  const result = entry.match_result;
                  let resultLabel = "";
                  let resultColor = "text-surface-400";

                  if (result && entry.team) {
                    const won =
                      entry.team === "A"
                        ? result.score_team_a > result.score_team_b
                        : result.score_team_b > result.score_team_a;
                    const draw =
                      result.score_team_a === result.score_team_b;

                    if (won) {
                      resultLabel = "V";
                      resultColor = "text-pitch-400";
                    } else if (draw) {
                      resultLabel = "N";
                      resultColor = "text-surface-300";
                    } else {
                      resultLabel = "D";
                      resultColor = "text-danger-500";
                    }
                  }

                  return (
                    <Link
                      key={entry.id}
                      href={`/matches/${entry.match.id}`}
                      className="flex items-center gap-3 py-2.5 hover:bg-surface-800/50 -mx-1 px-1 rounded-lg transition-colors"
                    >
                      {/* Result badge */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          resultLabel === "V"
                            ? "bg-pitch-500/15"
                            : resultLabel === "D"
                            ? "bg-danger-500/15"
                            : "bg-surface-800"
                        } ${resultColor}`}
                      >
                        {resultLabel || "—"}
                      </div>

                      {/* Match info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {entry.match.title}
                        </p>
                        <p className="text-[10px] text-surface-500">
                          {formatDate(entry.match.date)}
                          {result &&
                            ` · ${result.score_team_a}-${result.score_team_b}`}
                        </p>
                      </div>

                      {/* Personal stats */}
                      <div className="flex items-center gap-2 shrink-0">
                        {entry.goals > 0 && (
                          <span className="text-[10px] text-surface-400">
                            {entry.goals} but{entry.goals > 1 ? "s" : ""}
                          </span>
                        )}
                        {entry.assists > 0 && (
                          <span className="text-[10px] text-surface-400">
                            {entry.assists} ass.
                          </span>
                        )}
                        {entry.mvp && (
                          <span className="text-[10px] font-semibold text-amber-400">
                            MVP
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-surface-500 text-center py-2">
                Aucun match jou&eacute;
              </p>
            )}
          </div>
        </SubscriptionGate>
      </div>
    </div>
  );
}
