import Link from "next/link";
import type { MatchResult, MatchPlayerStatsWithProfile } from "@/types";
import { MATCH_QUALITY_LABELS } from "@/types";
import { formatDuration } from "@/lib/format";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

interface Props {
  result: MatchResult;
  playerStats: MatchPlayerStatsWithProfile[];
}

export default function MatchResultsSummary({ result, playerStats }: Props) {
  const teamA = playerStats.filter((p) => p.team === "A" && p.attended);
  const teamB = playerStats.filter((p) => p.team === "B" && p.attended);
  const absent = playerStats.filter((p) => !p.attended);
  const mvpPlayer = playerStats.find((p) => p.mvp);

  const qualityColors: Record<string, string> = {
    excellent: "bg-pitch-500/10 text-pitch-400",
    good: "bg-blue-500/10 text-blue-400",
    average: "bg-amber-500/10 text-amber-400",
    poor: "bg-danger-500/10 text-danger-500",
  };

  function renderPlayer(player: MatchPlayerStatsWithProfile) {
    const badges: string[] = [];
    if (player.goals > 0) badges.push(`${player.goals} but${player.goals > 1 ? "s" : ""}`);
    if (player.assists > 0) badges.push(`${player.assists} ass.`);
    const playerHref = `/players/${player.user_id}`;

    return (
      <div key={player.id} className="flex items-center gap-2.5 py-1.5">
        <ProfileAvatar
          firstName={player.profile.first_name}
          lastName={player.profile.last_name}
          country={player.profile.origin_country}
          clubSlug={player.profile.favorite_club}
          size="xs"
          href={playerHref}
        />
        <Link href={playerHref} className="text-sm text-foreground flex-1 truncate hover:text-pitch-400 transition-colors">
          {player.profile.first_name} {player.profile.last_name}
        </Link>
        {player.mvp && (
          <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-400 rounded-full px-2 py-0.5">
            MVP
          </span>
        )}
        {player.yellow_card && (
          <span className="inline-block w-3 h-4 bg-amber-400 rounded-sm" title="Carton jaune" />
        )}
        {player.red_card && (
          <span className="inline-block w-3 h-4 bg-danger-500 rounded-sm" title="Carton rouge" />
        )}
        {badges.length > 0 && (
          <span className="text-[10px] text-surface-400 shrink-0">{badges.join(" · ")}</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 text-center">
        <div className="flex items-center justify-center gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-1">Équipe A</p>
            <p className="text-3xl font-bold text-blue-400">{result.score_team_a}</p>
          </div>
          <span className="text-xl font-bold text-surface-500 mt-4">—</span>
          <div>
            <p className="text-xs font-semibold text-amber-400 mb-1">Équipe B</p>
            <p className="text-3xl font-bold text-amber-400">{result.score_team_b}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-xs text-surface-400">{formatDuration(result.duration_minutes)}</span>
          <span className="text-xs text-surface-600">·</span>
          <span
            className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
              qualityColors[result.match_quality] ?? "bg-surface-800 text-surface-400"
            }`}
          >
            {MATCH_QUALITY_LABELS[result.match_quality]}
          </span>
        </div>
      </div>

      {/* MVP */}
      {mvpPlayer && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-sm font-medium text-amber-400">
            MVP : {mvpPlayer.profile.first_name} {mvpPlayer.profile.last_name}
          </span>
        </div>
      )}

      {/* Teams */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Team A */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">
            Équipe A ({teamA.length})
          </p>
          <div className="divide-y divide-surface-800">
            {teamA.map(renderPlayer)}
          </div>
        </div>

        {/* Team B */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
            Équipe B ({teamB.length})
          </p>
          <div className="divide-y divide-surface-800">
            {teamB.map(renderPlayer)}
          </div>
        </div>
      </div>

      {/* Absent */}
      {absent.length > 0 && (
        <div className="text-xs text-surface-500">
          <span className="font-semibold">Absents :</span>{" "}
          {absent.map((p) => `${p.profile.first_name} ${p.profile.last_name}`).join(", ")}
        </div>
      )}

      {/* Notes */}
      {result.notes && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-surface-300 whitespace-pre-wrap">{result.notes}</p>
        </div>
      )}
    </div>
  );
}
