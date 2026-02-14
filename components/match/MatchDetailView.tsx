"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  MatchWithOperator,
  MatchRegistrationWithProfile,
  MatchResult,
  MatchPlayerStatsWithProfile,
  ChatMessageWithSender,
} from "@/types";
import { MATCH_STATUS_LABELS, MATCH_STATUS_STYLES } from "@/types";
import {
  formatDate,
  formatTime,
  formatDuration,
  formatSpots,
  formatTerrainType,
} from "@/lib/format";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import RegisterButton from "@/components/match/RegisterButton";
import PitchFormation from "@/components/match/PitchFormation";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import MatchResultsSummary from "@/components/results/MatchResultsSummary";
import MatchRating from "@/components/match/MatchRating";
import MatchChat from "@/components/chat/MatchChat";

interface MatchDetailViewProps {
  match: MatchWithOperator;
  registrations: MatchRegistrationWithProfile[];
  isRegistered: boolean;
  isStandby: boolean;
  standbyPosition?: number;
  canStandby: boolean;
  cancelTokens: number;
  hasSubscription: boolean;
  currentUserId: string | null;
  matchResult?: MatchResult | null;
  playerStats?: MatchPlayerStatsWithProfile[];
  initialMessages: ChatMessageWithSender[];
  chatMessageCount: number;
}

export default function MatchDetailView({
  match,
  registrations,
  isRegistered,
  isStandby,
  standbyPosition,
  canStandby,
  cancelTokens,
  hasSubscription,
  currentUserId,
  matchResult,
  playerStats,
  initialMessages,
  chatMessageCount,
}: MatchDetailViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"info" | "chat">("info");

  const confirmedCount = registrations.filter(
    (r) => r.status === "confirmed"
  ).length;
  const isFull = confirmedCount >= match.capacity;
  const fillPercent =
    match.capacity > 0
      ? Math.min((confirmedCount / match.capacity) * 100, 100)
      : 0;
  const operator = match.operator;
  const operatorProfile = operator?.profile;

  // Countdown
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const matchDate = new Date(match.date + "T00:00:00");
  matchDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (matchDate.getTime() - today.getTime()) / 86400000
  );

  let countdownText: string;
  let countdownColor: string;
  if (match.status === "completed") {
    countdownText = t.common.completed;
    countdownColor = "text-surface-400";
  } else if (match.status === "canceled") {
    countdownText = t.common.canceled;
    countdownColor = "text-danger-500";
  } else if (diffDays === 0) {
    countdownText = t.common.today;
    countdownColor = "text-amber-400";
  } else if (diffDays === 1) {
    countdownText = t.common.tomorrow;
    countdownColor = "text-amber-400";
  } else if (diffDays > 0 && diffDays <= 3) {
    countdownText = `J-${diffDays}`;
    countdownColor = "text-amber-400";
  } else if (diffDays > 3) {
    countdownText = `J-${diffDays}`;
    countdownColor = "text-foreground";
  } else {
    countdownText = t.common.past;
    countdownColor = "text-surface-400";
  }

  return (
    <div className="pb-24 lg:pb-8">
      {/* Back link */}
      <div className="px-4 pt-4 max-w-6xl mx-auto">
        <Link
          href="/matches"
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
          {t.matchDetail.backToMatches}
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-4">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-foreground">{match.title}</h1>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-1 shrink-0 ${
              MATCH_STATUS_STYLES[match.status] ??
              "bg-surface-800 text-surface-400"
            }`}
          >
            {MATCH_STATUS_LABELS[match.status]}
          </span>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden mt-4">
          <div className="flex bg-surface-900 border border-surface-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 text-sm font-medium rounded-lg py-2 transition-colors ${
                activeTab === "info"
                  ? "bg-surface-800 text-foreground"
                  : "text-surface-400 hover:text-surface-300"
              }`}
            >
              {t.matchDetail.info}
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 text-sm font-medium rounded-lg py-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "chat"
                  ? "bg-surface-800 text-foreground"
                  : "text-surface-400 hover:text-surface-300"
              }`}
            >
              {t.matchDetail.chat}
              {chatMessageCount > 0 && (
                <span className="bg-pitch-500/20 text-pitch-400 text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {chatMessageCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="mt-6 md:grid md:grid-cols-[3fr_1fr] md:gap-6">
          {/* Left column: match info */}
          <div
            className={`space-y-5 ${activeTab !== "info" ? "hidden md:block" : ""}`}
          >
            {/* Stats strip */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-surface-900 border border-surface-800 rounded-xl px-2 py-2.5 text-center">
                <p className={`text-base font-bold ${countdownColor}`}>
                  {countdownText}
                </p>
                <p className="text-[10px] text-surface-500 mt-0.5">{t.common.deadline}</p>
              </div>
              <div className="bg-surface-900 border border-surface-800 rounded-xl px-2 py-2.5 text-center">
                <p
                  className={`text-base font-bold ${isFull ? "text-amber-400" : "text-pitch-400"}`}
                >
                  {confirmedCount}/{match.capacity}
                </p>
                <p className="text-[10px] text-surface-500 mt-0.5">{t.common.players}</p>
              </div>
              <div className="bg-surface-900 border border-surface-800 rounded-xl px-2 py-2.5 text-center">
                <p className="text-base font-bold text-foreground">
                  {formatDuration(match.duration_minutes)}
                </p>
                <p className="text-[10px] text-surface-500 mt-0.5">{t.common.duration}</p>
              </div>
              <div className="bg-surface-900 border border-surface-800 rounded-xl px-2 py-2.5 text-center">
                <p className="text-base font-bold text-foreground">
                  {chatMessageCount}
                </p>
                <p className="text-[10px] text-surface-500 mt-0.5">{t.common.messages}</p>
              </div>
            </div>

            {/* Fill progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-surface-400">
                  {confirmedCount} {t.matchDetail.registeredOf}{" "}
                  {match.capacity} {t.matchDetail.spotsLabel}
                </span>
                <span
                  className={`font-semibold ${isFull ? "text-amber-400" : "text-pitch-400"}`}
                >
                  {Math.round(fillPercent)}%
                </span>
              </div>
              <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFull ? "bg-amber-500" : "bg-pitch-400"
                  }`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>

            {/* Completed banner */}
            {match.status === "completed" && (
              <div className="bg-pitch-500/10 border border-pitch-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-pitch-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-pitch-400">
                  {t.matchDetail.matchCompleted}
                </span>
              </div>
            )}

            {/* Canceled banner */}
            {match.status === "canceled" && (
              <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-danger-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <span className="text-sm font-medium text-danger-500">
                  {t.matchDetail.matchCanceled}
                </span>
              </div>
            )}

            {/* Match results */}
            {matchResult && playerStats && playerStats.length > 0 && (
              <>
                <MatchResultsSummary
                  result={matchResult}
                  playerStats={playerStats}
                />

                {/* Your stats highlight + rating */}
                {currentUserId &&
                  (() => {
                    const myStats = playerStats.find(
                      (p) => p.user_id === currentUserId && p.attended
                    );
                    if (!myStats) return null;
                    const myTeam = myStats.team;
                    const won =
                      myTeam === "A"
                        ? matchResult.score_team_a > matchResult.score_team_b
                        : matchResult.score_team_b > matchResult.score_team_a;
                    const draw =
                      matchResult.score_team_a === matchResult.score_team_b;
                    return (
                      <>
                        <div className="bg-pitch-500/10 border border-pitch-500/20 rounded-xl p-4">
                          <h3 className="text-sm font-semibold text-pitch-400 mb-3">
                            {t.matchDetail.yourStats}
                          </h3>
                          <div className="grid grid-cols-5 gap-2 text-center">
                            <div>
                              <p className="text-lg font-bold text-foreground">
                                {myStats.goals}
                              </p>
                              <p className="text-[10px] text-surface-500">
                                {t.common.goals}
                              </p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-foreground">
                                {myStats.assists}
                              </p>
                              <p className="text-[10px] text-surface-500">
                                {t.common.assists}
                              </p>
                            </div>
                            <div>
                              <p
                                className={`text-lg font-bold ${won ? "text-pitch-400" : draw ? "text-surface-300" : "text-danger-500"}`}
                              >
                                {won ? t.common.win : draw ? t.common.drawAbbr : t.common.loss}
                              </p>
                              <p className="text-[10px] text-surface-500">
                                {t.matchDetail.result}
                              </p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-foreground">
                                {myStats.yellow_card ? "1" : "0"}
                              </p>
                              <p className="text-[10px] text-surface-500">{t.matchDetail.yc}</p>
                            </div>
                            <div>
                              <p
                                className={`text-lg font-bold ${myStats.mvp ? "text-amber-400" : "text-surface-500"}`}
                              >
                                {myStats.mvp ? "★" : "—"}
                              </p>
                              <p className="text-[10px] text-surface-500">
                                MVP
                              </p>
                            </div>
                          </div>
                        </div>
                        <MatchRating
                          matchId={match.id}
                          statsId={myStats.id}
                          initialRating={myStats.rating ?? null}
                        />
                      </>
                    );
                  })()}
              </>
            )}

            {/* Operator section */}
            <Link
              href={operator ? `/operators/${operator.id}` : "#"}
              className="flex items-center gap-3 group"
            >
              <ProfileAvatar
                firstName={operatorProfile?.first_name ?? "?"}
                lastName={operatorProfile?.last_name ?? "?"}
                country={operatorProfile?.origin_country}
                clubSlug={operatorProfile?.favorite_club}
                size="md"
              />
              <div className="flex-1">
                <p className="text-xs text-surface-500">{t.common.organizedBy}</p>
                <p className="text-sm font-medium text-foreground group-hover:text-pitch-400 transition-colors">
                  {operatorProfile?.first_name ?? "Organisateur"}{" "}
                  {operatorProfile?.last_name ?? "inconnu"}
                </p>
              </div>
              <svg
                className="w-4 h-4 text-surface-600 group-hover:text-surface-400 transition-colors shrink-0"
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
            </Link>

            {/* Info card */}
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 space-y-3">
              {/* Date + Time */}
              <div className="flex items-center gap-3">
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
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
                <div>
                  <p className="text-sm text-foreground">
                    {formatDate(match.date)}
                  </p>
                  <p className="text-xs text-surface-400">
                    {formatTime(match.start_time)} &middot;{" "}
                    {formatDuration(match.duration_minutes)}
                  </p>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-center gap-3">
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
                <div>
                  <p className="text-sm text-foreground">{match.venue_name}</p>
                  <p className="text-xs text-surface-400">
                    {match.venue_address}, {match.city}
                  </p>
                </div>
              </div>

              {/* Terrain type */}
              <div className="flex items-center gap-3">
                <svg
                  className="w-4 h-4 text-surface-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <p className="text-sm text-foreground">
                  {formatTerrainType(match.terrain_type)}
                </p>
              </div>

              {/* Capacity */}
              <div className="flex items-center gap-3">
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
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
                <p className="text-sm text-foreground">
                  {formatSpots(confirmedCount, match.capacity)} {t.common.players.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Description */}
            {match.description && (
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-surface-300 mb-2">
                  {t.common.about}
                </h3>
                <p className="text-sm text-surface-400 whitespace-pre-wrap">
                  {match.description}
                </p>
              </div>
            )}

            {/* Register button */}
            {currentUserId &&
              match.status !== "completed" &&
              match.status !== "canceled" && (
                <RegisterButton
                  matchId={match.id}
                  matchDate={match.date}
                  matchStartTime={match.start_time}
                  isRegistered={isRegistered}
                  isStandby={isStandby}
                  standbyPosition={standbyPosition}
                  hasSubscription={hasSubscription}
                  isFull={isFull}
                  canStandby={canStandby}
                  cancelTokens={cancelTokens}
                />
              )}

            {/* Not logged in CTA */}
            {!currentUserId &&
              match.status !== "completed" &&
              match.status !== "canceled" && (
                <Link href="/login" className="block">
                  <div className="bg-surface-900 border border-surface-800 rounded-xl px-4 py-3 text-center hover:border-surface-700 transition-colors">
                    <p className="text-sm font-medium text-pitch-400">
                      {t.auth.loginToJoin}
                    </p>
                  </div>
                </Link>
              )}

            {/* Registered players */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {t.matchDetail.registeredPlayers} ({confirmedCount})
              </h3>
              <PitchFormation registrations={registrations} capacity={match.capacity} />
            </div>

            {/* Standby list */}
            {(() => {
              const standbyRegs = registrations
                .filter((r) => r.status === "standby")
                .sort((a, b) => (a.standby_position ?? 99) - (b.standby_position ?? 99));
              if (standbyRegs.length === 0) return null;
              return (
                <div className="bg-amber-400/5 border border-amber-400/15 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t.reliability.standbyList} ({standbyRegs.length})
                  </h3>
                  <div className="space-y-2">
                    {standbyRegs.map((reg) => (
                      <div key={reg.id} className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold text-amber-400/60 w-4 text-center">
                          {reg.standby_position}
                        </span>
                        <ProfileAvatar
                          firstName={reg.profile?.first_name ?? "?"}
                          lastName={reg.profile?.last_name ?? "?"}
                          size="sm"
                        />
                        <span className="text-sm text-surface-300">
                          {reg.profile?.first_name} {reg.profile?.last_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right column: chat panel */}
          <div
            className={`${activeTab !== "chat" ? "hidden md:flex" : "flex"} flex-col md:sticky md:top-4 mt-6 md:mt-0`}
          >
            <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden flex flex-col h-[calc(100dvh-200px)] md:h-[calc(100vh-100px)]">
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-surface-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
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
                      d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                    />
                  </svg>
                  <h3 className="text-sm font-semibold text-foreground">
                    {t.matchDetail.chatHeader}
                  </h3>
                  {chatMessageCount > 0 && (
                    <span className="bg-surface-800 text-surface-400 text-[10px] font-medium rounded-full px-1.5 py-0.5">
                      {chatMessageCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-surface-500">
                  {confirmedCount} {confirmedCount !== 1 ? t.matchDetail.participants : t.matchDetail.participant}
                </span>
              </div>

              {/* Chat body */}
              <div className="flex-1 min-h-0">
                {isRegistered && currentUserId ? (
                  <MatchChat
                    matchId={match.id}
                    matchTitle={match.title}
                    participantCount={confirmedCount}
                    initialMessages={initialMessages}
                    currentUserId={currentUserId}
                    embedded
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-800 mb-3">
                      <svg
                        className="w-6 h-6 text-surface-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-surface-400 mb-1">
                      {hasSubscription
                        ? t.matchDetail.registerForChat
                        : t.matchDetail.subscribeForChat}
                    </p>
                    <p className="text-xs text-surface-500">
                      {t.matchDetail.chatDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
