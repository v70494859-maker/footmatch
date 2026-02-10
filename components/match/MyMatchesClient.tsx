"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  MatchRegistrationWithMatchOperator,
  MatchResult,
  MatchPlayerStats,
  PlayerCareerStats,
  ChatMessageWithSender,
  TerrainType,
  Operator,
  Profile,
} from "@/types";
import { MATCH_STATUS_LABELS, MATCH_STATUS_STYLES } from "@/types";
import {
  formatDate,
  formatTime,
  formatDuration,
  formatSpots,
  formatTerrainType,
  formatAttendanceRate,
  formatChatTime,
} from "@/lib/format";
import { useTranslation } from "@/lib/i18n/LanguageContext";

// ─── Types ───────────────────────────────────────────────

interface MyMatchesClientProps {
  registrations: MatchRegistrationWithMatchOperator[];
  matchResults: Record<string, MatchResult>;
  playerMatchStats: Record<string, MatchPlayerStats>;
  careerStats: PlayerCareerStats | null;
  chatPreviews: Record<string, ChatMessageWithSender[]>;
  chatCounts: Record<string, number>;
  currentUserId: string;
}

type TimeFilter = "all" | "upcoming" | "past";
type TerrainFilter = "all" | TerrainType;

// ─── Helpers ─────────────────────────────────────────────

function getCountdownText(dateStr: string, timeStr: string): string {
  const now = new Date();
  const matchDate = new Date(dateStr + "T" + timeStr);
  const diffMs = matchDate.getTime() - now.getTime();

  if (diffMs < 0) return "En cours";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMin = Math.floor(diffMs / (1000 * 60));
    return `Dans ${diffMin} min`;
  }
  if (diffHours < 24) return `Dans ${diffHours}h`;
  if (diffDays === 1) return "Demain";
  if (diffDays < 7) return `Dans ${diffDays} jours`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Dans ${weeks} sem.`;
  }
  return `Dans ${diffDays} jours`;
}

function getResultBadge(
  result: MatchResult,
  playerStats: MatchPlayerStats | undefined
): { label: string; class: string } | null {
  if (!playerStats?.team) return null;

  const userTeam = playerStats.team;
  const userScore =
    userTeam === "A" ? result.score_team_a : result.score_team_b;
  const opponentScore =
    userTeam === "A" ? result.score_team_b : result.score_team_a;

  if (userScore > opponentScore)
    return { label: "V", class: "bg-pitch-500/20 text-pitch-400" };
  if (userScore < opponentScore)
    return { label: "D", class: "bg-danger-500/20 text-danger-500" };
  return { label: "N", class: "bg-amber-500/20 text-amber-500" };
}

// ─── Component ───────────────────────────────────────────

export default function MyMatchesClient({
  registrations,
  matchResults,
  playerMatchStats,
  careerStats,
  chatPreviews,
  chatCounts,
  currentUserId,
}: MyMatchesClientProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [terrainFilter, setTerrainFilter] = useState<TerrainFilter>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // Split and filter
  const allUpcoming = registrations.filter((r) => r.match.date >= today);
  const allPast = registrations.filter((r) => r.match.date < today);

  let filtered = registrations;
  if (timeFilter === "upcoming") filtered = allUpcoming;
  if (timeFilter === "past") filtered = allPast;

  if (terrainFilter !== "all") {
    filtered = filtered.filter(
      (r) => r.match.terrain_type === terrainFilter
    );
  }

  // Unique cities for reference
  const terrainTypes = Array.from(
    new Set(registrations.map((r) => r.match.terrain_type))
  );

  // Stats
  const completedWithResults = allPast.filter(
    (r) => matchResults[r.match.id]
  );
  const wins = completedWithResults.filter((r) => {
    const badge = getResultBadge(
      matchResults[r.match.id],
      playerMatchStats[r.match.id]
    );
    return badge?.label === "V";
  }).length;

  // Cancel handler
  async function handleCancel(matchId: string) {
    setCancellingId(matchId);
    setCancelError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCancelError(t.auth.mustBeLoggedIn);
      setCancellingId(null);
      return;
    }

    const { error } = await supabase
      .from("match_registrations")
      .update({ status: "canceled" })
      .eq("match_id", matchId)
      .eq("player_id", user.id)
      .eq("status", "confirmed");

    if (error) {
      setCancelError(error.message);
      setCancellingId(null);
      return;
    }

    setCancellingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6 mt-6">
      {/* ─── Stats Header ─────────────────────────── */}
      {registrations.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox
            label={t.common.upcoming}
            value={allUpcoming.length}
            accent="text-pitch-400"
          />
          <StatBox
            label={t.common.totalPlayed}
            value={allPast.length}
            accent="text-foreground"
          />
          <StatBox
            label={t.common.wins}
            value={wins}
            accent="text-pitch-400"
          />
          <StatBox
            label={t.common.reliability}
            value={
              careerStats
                ? formatAttendanceRate(careerStats.attendance_rate)
                : "—"
            }
            accent="text-foreground"
          />
        </div>
      )}

      {/* ─── Filters ──────────────────────────────── */}
      {registrations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* Time filters */}
          {(["all", "upcoming", "past"] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
                timeFilter === f
                  ? "bg-pitch-500 text-white"
                  : "bg-surface-800 text-surface-400 hover:text-surface-200"
              }`}
            >
              {f === "all"
                ? t.common.viewAll
                : f === "upcoming"
                  ? t.common.upcoming
                  : t.common.past}
            </button>
          ))}

          {/* Separator */}
          {terrainTypes.length > 1 && (
            <div className="w-px h-6 bg-surface-700 self-center mx-1" />
          )}

          {/* Terrain filters */}
          {terrainTypes.length > 1 &&
            terrainTypes.map((t) => (
              <button
                key={t}
                onClick={() =>
                  setTerrainFilter(terrainFilter === t ? "all" : t)
                }
                className={`text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
                  terrainFilter === t
                    ? "bg-surface-600 text-foreground"
                    : "bg-surface-800 text-surface-400 hover:text-surface-200"
                }`}
              >
                {formatTerrainType(t)}
              </button>
            ))}
        </div>
      )}

      {/* ─── Cancel error ─────────────────────────── */}
      {cancelError && (
        <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl px-4 py-3">
          <p className="text-sm text-danger-500">{cancelError}</p>
        </div>
      )}

      {/* ─── Empty State ──────────────────────────── */}
      {registrations.length === 0 && (
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-8 text-center">
          <svg
            className="w-10 h-10 mx-auto text-surface-700 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6l1.5 3.5L17 11l-3.5 1.5L12 16l-1.5-3.5L7 11l3.5-1.5z" />
          </svg>
          <p className="text-sm text-surface-400">
            {t.matchList.noMatchesFound}
          </p>
          <p className="text-xs text-surface-500 mt-1">
            {t.matchList.tryAdjusting}{" "}
            <Link href="/matches" className="text-pitch-400 underline">
              {t.matchList.resetFilters}
            </Link>
          </p>
        </div>
      )}

      {/* ─── Filtered Empty ───────────────────────── */}
      {registrations.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-surface-400 text-center py-8">
          {t.matchList.noMatchesFound}
        </p>
      )}

      {/* ─── Upcoming Section ─────────────────────── */}
      {filtered.filter((r) => r.match.date >= today).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wide mb-3">
            {t.common.upcoming} ({filtered.filter((r) => r.match.date >= today).length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered
              .filter((r) => r.match.date >= today)
              .sort(
                (a, b) =>
                  a.match.date.localeCompare(b.match.date) ||
                  a.match.start_time.localeCompare(b.match.start_time)
              )
              .map((reg) => (
                <UpcomingCard
                  key={reg.id}
                  reg={reg}
                  onCancel={handleCancel}
                  cancelling={cancellingId === reg.match.id}
                  chatMessages={chatPreviews[reg.match.id] ?? []}
                  chatCount={chatCounts[reg.match.id] ?? 0}
                  currentUserId={currentUserId}
                />
              ))}
          </div>
        </div>
      )}

      {/* ─── Past Section ─────────────────────────── */}
      {filtered.filter((r) => r.match.date < today).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wide mb-3">
            {t.common.past} ({filtered.filter((r) => r.match.date < today).length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered
              .filter((r) => r.match.date < today)
              .map((reg) => (
                <PastCard
                  key={reg.id}
                  reg={reg}
                  result={matchResults[reg.match.id]}
                  stats={playerMatchStats[reg.match.id]}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-surface-800 bg-surface-900 px-4 py-3 text-center">
      <p className={`text-xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-surface-500 mt-0.5">{label}</p>
    </div>
  );
}

function UpcomingCard({
  reg,
  onCancel,
  cancelling,
  chatMessages,
  chatCount,
  currentUserId,
}: {
  reg: MatchRegistrationWithMatchOperator;
  onCancel: (matchId: string) => void;
  cancelling: boolean;
  chatMessages: ChatMessageWithSender[];
  chatCount: number;
  currentUserId: string;
}) {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const countdown = getCountdownText(reg.match.date, reg.match.start_time);

  return (
    <div className="bg-surface-900 rounded-2xl border border-surface-800 overflow-hidden hover:border-surface-700 transition-colors">
      <Link href={`/matches/${reg.match.id}`} className="block p-4 space-y-3">
        {/* Title + Countdown */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
            {reg.match.title}
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 shrink-0 bg-pitch-500/15 text-pitch-400">
            {countdown}
          </span>
        </div>

        {/* Date + Time */}
        <div className="flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-surface-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm text-surface-400">
            {formatDate(reg.match.date)} &middot;{" "}
            {formatTime(reg.match.start_time)} &middot;{" "}
            {formatDuration(reg.match.duration_minutes)}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-surface-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          <span className="text-sm text-surface-400 truncate">
            {reg.match.venue_name}, {reg.match.city}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-800">
          <span className="text-xs text-surface-500">
            {formatTerrainType(reg.match.terrain_type)}
          </span>
          <span className="text-xs text-surface-400">
            {formatSpots(reg.match.registered_count, reg.match.capacity)}{" "}
            {t.common.players.toLowerCase()}
          </span>
        </div>

        {/* Operator */}
        {reg.match.operator?.profile && (
          <OperatorBadge operator={reg.match.operator} />
        )}
      </Link>

      {/* ─── Chat Preview ─────────────────────────── */}
      <Link
        href={`/matches/${reg.match.id}/chat`}
        className="block border-t border-surface-800 hover:bg-surface-800/30 transition-colors"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-pitch-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                />
              </svg>
              <span className="text-xs font-semibold text-foreground">{t.matchDetail.chatHeader}</span>
              {chatCount > 0 && (
                <span className="text-[10px] font-medium text-surface-500">
                  {chatCount} {t.common.messages.toLowerCase()}
                </span>
              )}
            </div>
            <svg
              className="w-3.5 h-3.5 text-surface-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>

          {chatMessages.length > 0 ? (
            <div className="space-y-1.5">
              {chatMessages.map((msg) => {
                const isOwn = msg.sender_id === currentUserId;
                const senderName = isOwn
                  ? "Vous"
                  : msg.sender
                    ? `${msg.sender.first_name}`
                    : "?";
                const content =
                  msg.type === "text"
                    ? msg.content ?? ""
                    : msg.type === "image"
                      ? "Photo"
                      : "Audio";

                return (
                  <div
                    key={msg.id}
                    className="flex items-baseline gap-1.5 text-xs"
                  >
                    <span
                      className={`font-medium shrink-0 ${
                        isOwn ? "text-pitch-400" : "text-surface-300"
                      }`}
                    >
                      {senderName}
                    </span>
                    <span className="text-surface-400 truncate">
                      {content}
                    </span>
                    <span className="text-surface-600 shrink-0 text-[10px] ml-auto">
                      {formatChatTime(msg.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-surface-500 italic">
              {t.matchDetail.chatDescription}
            </p>
          )}
        </div>
      </Link>

      {/* ─── Cancel action ────────────────────────── */}
      <div className="border-t border-surface-800">
        {showConfirm ? (
          <div className="flex">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2.5 text-xs font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-colors"
            >
              {t.common.cancel}
            </button>
            <div className="w-px bg-surface-800" />
            <button
              onClick={() => {
                setShowConfirm(false);
                onCancel(reg.match.id);
              }}
              disabled={cancelling}
              className="flex-1 py-2.5 text-xs font-medium text-danger-500 hover:bg-danger-500/10 transition-colors disabled:opacity-50"
            >
              {cancelling ? "..." : t.common.confirm}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-surface-500 hover:text-danger-500 hover:bg-surface-800/50 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {t.matchCard.cancelRegistration}
          </button>
        )}
      </div>
    </div>
  );
}

function PastCard({
  reg,
  result,
  stats,
}: {
  reg: MatchRegistrationWithMatchOperator;
  result?: MatchResult;
  stats?: MatchPlayerStats;
}) {
  const { t } = useTranslation();
  const badge = result && stats ? getResultBadge(result, stats) : null;
  const hasPersonalStats =
    stats && (stats.goals > 0 || stats.assists > 0 || stats.mvp || stats.yellow_card || stats.red_card);

  return (
    <Link
      href={`/matches/${reg.match.id}`}
      className={`block bg-surface-900 rounded-2xl border overflow-hidden hover:border-surface-700 transition-colors ${
        badge?.label === "V"
          ? "border-pitch-500/20"
          : badge?.label === "D"
            ? "border-danger-500/15"
            : "border-surface-800"
      }`}
    >
      <div className="p-4">
        {/* Top row: badges */}
        <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
          {badge && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${badge.class}`}
            >
              {badge.label === "V" ? t.common.victory : badge.label === "D" ? t.common.defeat : t.common.draw}
            </span>
          )}
          {!badge && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                MATCH_STATUS_STYLES[reg.match.status] ??
                "bg-surface-800 text-surface-400"
              }`}
            >
              {MATCH_STATUS_LABELS[reg.match.status]}
            </span>
          )}
          {stats?.mvp && (
            <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-500 rounded-full px-2 py-0.5 flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              MVP
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-1">
          {reg.match.title}
        </h3>

        {/* Score block */}
        {result && (
          <div className="mt-2.5 rounded-lg bg-surface-800/50 py-2.5 px-3">
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-surface-500 uppercase tracking-wide mb-0.5">
                  Éq. A{stats?.team === "A" ? " (vous)" : ""}
                </span>
                <span
                  className={`text-2xl font-bold ${
                    stats?.team === "A" ? "text-pitch-400" : "text-surface-300"
                  }`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {result.score_team_a}
                </span>
              </div>
              <span className="text-surface-600 font-light text-lg">—</span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-surface-500 uppercase tracking-wide mb-0.5">
                  Éq. B{stats?.team === "B" ? " (vous)" : ""}
                </span>
                <span
                  className={`text-2xl font-bold ${
                    stats?.team === "B" ? "text-pitch-400" : "text-surface-300"
                  }`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {result.score_team_b}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Personal stats row */}
        {hasPersonalStats && (
          <div className="flex items-center justify-center flex-wrap gap-2 mt-2.5">
            {stats.goals > 0 && (
              <span className="text-[10px] font-semibold bg-pitch-500/15 text-pitch-400 rounded-full px-2 py-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {stats.goals} {t.common.goals.toLowerCase()}
              </span>
            )}
            {stats.assists > 0 && (
              <span className="text-[10px] font-semibold bg-blue-500/15 text-blue-400 rounded-full px-2 py-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                {stats.assists} {t.common.assists.toLowerCase()}
              </span>
            )}
            {stats.yellow_card && (
              <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-500 rounded-full px-2 py-0.5">
                {t.common.yellowCards}
              </span>
            )}
            {stats.red_card && (
              <span className="text-[10px] font-semibold bg-danger-500/15 text-danger-500 rounded-full px-2 py-0.5">
                {t.common.redCards}
              </span>
            )}
            {stats.rating != null && stats.rating > 0 && (
              <span className="text-[10px] font-semibold bg-surface-800 text-surface-300 rounded-full px-2 py-0.5 flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {stats.rating.toFixed(1)}
              </span>
            )}
          </div>
        )}

        {/* Date + time + duration */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <svg className="w-3.5 h-3.5 text-surface-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-surface-400">
            {formatDate(reg.match.date)} &middot; {formatTime(reg.match.start_time)} &middot; {formatDuration(reg.match.duration_minutes)}
          </span>
        </div>

        {/* Location block */}
        <div className="mt-1.5 rounded-lg bg-surface-800/40 px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-pitch-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
            <span className="text-xs font-medium text-foreground truncate">
              {reg.match.city}
            </span>
          </div>
          <p className="text-[10px] text-surface-500 mt-0.5 ml-5 line-clamp-1">
            {reg.match.venue_name}
            {reg.match.venue_address && (
              <span> &middot; {reg.match.venue_address}</span>
            )}
          </p>
        </div>

        {/* Description */}
        {reg.match.description && (
          <p className="text-[11px] text-surface-500 mt-2 line-clamp-2 leading-relaxed">
            {reg.match.description}
          </p>
        )}

        {/* Operator notes */}
        {result?.notes && (
          <div className="mt-2 rounded-lg bg-surface-800/30 px-2.5 py-1.5 border-l-2 border-surface-700">
            <p className="text-[10px] text-surface-500 italic line-clamp-2">
              &ldquo;{result.notes}&rdquo;
            </p>
          </div>
        )}

        {/* Footer: terrain + format + joueurs */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-surface-800">
          <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5">
            {formatTerrainType(reg.match.terrain_type)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5">
            {reg.match.capacity}v{reg.match.capacity}
          </span>
          <span className="text-[10px] text-surface-500 ml-auto">
            {formatSpots(reg.match.registered_count, reg.match.capacity)} {t.common.players.toLowerCase()}
          </span>
        </div>

        {/* Operator */}
        {reg.match.operator?.profile && (
          <OperatorBadge operator={reg.match.operator} />
        )}
      </div>
    </Link>
  );
}

function OperatorBadge({ operator }: { operator: Operator & { profile: Profile } }) {
  const { t } = useTranslation();
  const router = useRouter();
  const name = operator.profile.first_name;
  const avatar = operator.profile.avatar_url;

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/operators/${operator.id}`);
      }}
      className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-surface-800 cursor-pointer group/op"
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-5 h-5 rounded-full object-cover" />
      ) : (
        <span className="w-5 h-5 rounded-full bg-surface-700 flex items-center justify-center text-[9px] font-bold text-surface-400">
          {name[0]}
        </span>
      )}
      <span className="text-[11px] text-surface-400 group-hover/op:text-foreground transition-colors">
        {t.common.organizedBy} <span className="font-medium text-surface-300 group-hover/op:text-pitch-400 transition-colors">{name}</span>
      </span>
      {operator.rating > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
          <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {operator.rating.toFixed(1)}
        </span>
      )}
      {operator.total_matches > 0 && (
        <span className="text-[9px] text-surface-500">
          {operator.total_matches} {operator.total_matches > 1 ? t.common.matchPlural : t.common.match}
        </span>
      )}
      <svg className="w-3 h-3 text-surface-600 ml-auto group-hover/op:text-pitch-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </span>
  );
}
