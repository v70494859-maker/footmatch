"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostWithDetails, PostReactionType, MatchPlayerStatsWithProfile } from "@/types";
import { TERRAIN_TYPE_LABELS, MATCH_QUALITY_LABELS } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import PostMediaCarousel from "@/components/social/PostMediaCarousel";
import PostReactionButton from "@/components/social/PostReactionButton";
import PostReactionSummary from "@/components/social/PostReactionSummary";
import PostBookmarkButton from "@/components/social/PostBookmarkButton";
import PostShareButton from "@/components/social/PostShareButton";
import PostComments from "@/components/social/PostComments";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import { getClubLogo } from "@/lib/clubs";
import { getFlagForCountry } from "@/lib/cities";

interface MatchRecapCardProps {
  post: PostWithDetails;
  currentUserId: string;
  currentUserRole?: string;
  onReactionChange?: (postId: string, reaction: PostReactionType | null) => void;
  onCommentAdded: (postId: string) => void;
  onMediaAdded?: (postId: string, media: any[]) => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo`;
}

const QUALITY_COLORS: Record<string, string> = {
  excellent: "text-pitch-400 bg-pitch-500/10",
  good: "text-blue-400 bg-blue-500/10",
  average: "text-amber-400 bg-amber-500/10",
  poor: "text-red-400 bg-red-500/10",
};

function PlayerInlineStats({ stat }: { stat: MatchPlayerStatsWithProfile }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-surface-500">
      {stat.goals > 0 && <span>{"\\u26BD"} {stat.goals}</span>}
      {stat.assists > 0 && <span>{"\\ud83c\\udfaf"} {stat.assists}</span>}
      {stat.yellow_card && <span className="w-2.5 h-3.5 bg-yellow-400 rounded-[1px] inline-block" />}
      {stat.red_card && <span className="w-2.5 h-3.5 bg-red-500 rounded-[1px] inline-block" />}
    </span>
  );
}

export default function MatchRecapCard({
  post,
  currentUserId,
  currentUserRole,
  onReactionChange,
  onCommentAdded,
  onMediaAdded,
}: MatchRecapCardProps) {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [showTeamA, setShowTeamA] = useState(false);
  const [showTeamB, setShowTeamB] = useState(false);

  const recap = post.match_recap;
  if (!recap) return null;

  const { match, match_result, player_stats, operator } = recap;
  const attendedStats = player_stats.filter((s) => s.attended);
  const teamA = attendedStats.filter((s) => s.team === "A");
  const teamB = attendedStats.filter((s) => s.team === "B");
  const mvp = attendedStats.find((s) => s.mvp);
  const scorers = attendedStats.filter((s) => s.goals > 0).sort((a, b) => b.goals - a.goals);
  const assisters = attendedStats.filter((s) => s.assists > 0).sort((a, b) => b.assists - a.assists);
  const yellowCards = attendedStats.filter((s) => s.yellow_card);
  const redCards = attendedStats.filter((s) => s.red_card);
  const hasCards = yellowCards.length > 0 || redCards.length > 0;

  const isWinA = match_result.score_team_a > match_result.score_team_b;
  const isWinB = match_result.score_team_b > match_result.score_team_a;
  const isDraw = match_result.score_team_a === match_result.score_team_b;

  const resultLabel = isWinA
    ? `${t.social.feed.victory} ${t.social.feed.teamA}`
    : isWinB
      ? `${t.social.feed.victory} ${t.social.feed.teamB}`
      : t.social.feed.draw;

  const matchDate = new Date(match.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const canAddMedia = currentUserId === post.author_id || currentUserRole === "admin";

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-pitch-400 bg-pitch-500/10 px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            {t.social.feed.matchRecap}
          </span>
          <span className="text-[10px] text-surface-600">{timeAgo(post.created_at)}</span>
        </div>
        {operator && (
          <Link
            href={`/operators/${operator.id}`}
            className="flex items-center gap-2 text-xs text-surface-500 hover:text-surface-300 transition-colors"
          >
            <span>{t.social.feed.organizedBy}</span>
            {operator.profile?.avatar_url ? (
              <img src={operator.profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <ProfileAvatar
                firstName={operator.profile?.first_name ?? ""}
                lastName={operator.profile?.last_name ?? ""}
                size="xs"
              />
            )}
            <span className="font-medium text-surface-300">
              {operator.profile?.first_name} {operator.profile?.last_name}
            </span>
          </Link>
        )}
      </div>

      {/* ── Score Board ── */}
      <div className="mx-4 rounded-xl bg-gradient-to-br from-surface-800/80 to-surface-900 border border-surface-700/50 p-5 my-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className={`text-xs font-bold uppercase tracking-wider ${isWinA ? "text-pitch-400" : "text-surface-400"}`}>
              {t.social.feed.teamA}
            </p>
          </div>
          <div className="flex items-baseline gap-3 px-4">
            <span className={`text-4xl font-black tabular-nums ${isWinA ? "text-pitch-400" : "text-surface-200"}`}>
              {match_result.score_team_a}
            </span>
            <span className="text-lg text-surface-600 font-light">-</span>
            <span className={`text-4xl font-black tabular-nums ${isWinB ? "text-pitch-400" : "text-surface-200"}`}>
              {match_result.score_team_b}
            </span>
          </div>
          <div className="flex-1 text-center">
            <p className={`text-xs font-bold uppercase tracking-wider ${isWinB ? "text-pitch-400" : "text-surface-400"}`}>
              {t.social.feed.teamB}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className={`text-xs font-semibold ${isDraw ? "text-surface-400" : "text-pitch-400"}`}>
            {resultLabel}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${QUALITY_COLORS[match_result.match_quality] ?? "text-surface-400 bg-surface-800"}`}>
            {MATCH_QUALITY_LABELS[match_result.match_quality as keyof typeof MATCH_QUALITY_LABELS] ?? match_result.match_quality}
          </span>
        </div>
      </div>

      {/* ── Match Info ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-[11px] text-surface-500">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {match.venue_name}, {match.city}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {matchDate}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {match_result.duration_minutes} min
        </span>
        <span className="px-1.5 py-0.5 bg-surface-800 rounded text-[10px]">
          {TERRAIN_TYPE_LABELS[match.terrain_type as keyof typeof TERRAIN_TYPE_LABELS] ?? match.terrain_type}
        </span>
      </div>

      {/* ── MVP Highlight ── */}
      {mvp && (
        <div className="mx-4 my-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              {mvp.profile?.avatar_url ? (
                <img src={mvp.profile.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-500/50" />
              ) : (
                <ProfileAvatar firstName={mvp.profile?.first_name ?? ""} lastName={mvp.profile?.last_name ?? ""} size="md" />
              )}
              <span className="absolute -top-1 -right-1 text-sm">{"\\u2B50"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">MVP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/players/${mvp.profile?.id}`}
                  className="text-sm font-semibold text-surface-100 hover:text-amber-400 transition-colors truncate"
                >
                  {mvp.profile?.first_name} {mvp.profile?.last_name}
                </Link>
                {mvp.profile?.origin_country && getFlagForCountry(mvp.profile.origin_country) && (
                  <span className="text-xs">{getFlagForCountry(mvp.profile.origin_country)}</span>
                )}
                {mvp.profile?.favorite_club && (
                  <img src={getClubLogo(mvp.profile.favorite_club)} alt="" className="w-4 h-4" />
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-surface-400">
                {mvp.goals > 0 && <span>{mvp.goals} {"\\u26BD"}</span>}
                {mvp.assists > 0 && <span>{mvp.assists} {"\\ud83c\\udfaf"}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Performers ── */}
      {(scorers.length > 0 || assisters.length > 0) && (
        <div className="grid grid-cols-2 gap-3 px-4 py-2">
          {/* Scorers */}
          <div>
            {scorers.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-1.5">
                  {"\\u26BD"} {t.social.feed.scorers}
                </p>
                <div className="space-y-1.5">
                  {scorers.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      {s.profile?.avatar_url ? (
                        <img src={s.profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <ProfileAvatar firstName={s.profile?.first_name ?? ""} lastName={s.profile?.last_name ?? ""} size="xs" />
                      )}
                      <span className="text-xs text-surface-300 truncate">{s.profile?.first_name} {s.profile?.last_name}</span>
                      <span className="text-xs font-bold text-pitch-400 ml-auto shrink-0">{s.goals}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Assisters */}
          <div>
            {assisters.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-1.5">
                  {"\\ud83c\\udfaf"} {t.social.feed.assisters}
                </p>
                <div className="space-y-1.5">
                  {assisters.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      {s.profile?.avatar_url ? (
                        <img src={s.profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <ProfileAvatar firstName={s.profile?.first_name ?? ""} lastName={s.profile?.last_name ?? ""} size="xs" />
                      )}
                      <span className="text-xs text-surface-300 truncate">{s.profile?.first_name} {s.profile?.last_name}</span>
                      <span className="text-xs font-bold text-blue-400 ml-auto shrink-0">{s.assists}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Team Lineups (collapsible) ── */}
      {[
        { team: teamA, label: t.social.feed.teamA, score: match_result.score_team_a, open: showTeamA, toggle: () => setShowTeamA(!showTeamA) },
        { team: teamB, label: t.social.feed.teamB, score: match_result.score_team_b, open: showTeamB, toggle: () => setShowTeamB(!showTeamB) },
      ].map(({ team, label, score, open, toggle }) => (
        <div key={label} className="border-t border-surface-800/50">
          <button
            onClick={toggle}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-surface-400 hover:text-surface-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="font-semibold text-surface-300">{label}</span>
              <span className="text-surface-600">({score} {t.social.feed.scorers.toLowerCase()})</span>
              <span className="text-surface-600">&middot;</span>
              <span className="text-surface-600">{team.length} {t.social.feed.lineup.toLowerCase()}</span>
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {open && (
            <div className="px-4 pb-3 space-y-1.5">
              {team.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  {s.profile?.avatar_url ? (
                    <img src={s.profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <ProfileAvatar firstName={s.profile?.first_name ?? ""} lastName={s.profile?.last_name ?? ""} size="xs" />
                  )}
                  <Link
                    href={`/players/${s.profile?.id}`}
                    className="text-xs text-surface-300 hover:text-pitch-400 transition-colors truncate"
                  >
                    {s.profile?.first_name} {s.profile?.last_name}
                  </Link>
                  {s.mvp && <span className="text-[10px]">{"\\u2B50"}</span>}
                  <PlayerInlineStats stat={s} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* ── Discipline ── */}
      {hasCards && (
        <div className="border-t border-surface-800/50 px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-1.5">
            {t.social.feed.discipline}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-surface-400">
            {yellowCards.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-4 bg-yellow-400 rounded-[1px] inline-block" />
                {yellowCards.map((s) => `${s.profile?.first_name} ${s.profile?.last_name}`).join(", ")}
              </span>
            )}
            {redCards.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-4 bg-red-500 rounded-[1px] inline-block" />
                {redCards.map((s) => `${s.profile?.first_name} ${s.profile?.last_name}`).join(", ")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Operator Notes ── */}
      {match_result.notes && (
        <div className="border-t border-surface-800/50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-1">
            {t.social.feed.matchNotes}
          </p>
          <p className="text-sm text-surface-400 italic border-l-2 border-surface-700 pl-3">
            {match_result.notes}
          </p>
        </div>
      )}

      {/* ── Media ── */}
      {post.post_media && post.post_media.length > 0 && (
        <PostMediaCarousel media={post.post_media} />
      )}

      {/* ── Add Media (operator/admin only) ── */}
      {canAddMedia && (
        <div className="px-4 py-2 border-t border-surface-800/50">
          <MatchRecapMediaUploadInline postId={post.id} authorId={post.author_id} onMediaAdded={onMediaAdded} />
        </div>
      )}

      {/* ── Reaction + comment counts ── */}
      {(post.like_count > 0 || post.comment_count > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-surface-500 border-t border-surface-800/50">
          {post.like_count > 0 ? (
            post.reaction_summary && post.reaction_summary.length > 0 ? (
              <PostReactionSummary breakdown={post.reaction_summary} totalCount={post.like_count} />
            ) : (
              <span className="flex items-center gap-1">
                <span className="text-sm">{"\u2764\uFE0F"}</span>
                <span>{post.like_count}</span>
              </span>
            )
          ) : (
            <span />
          )}
          {post.comment_count > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 hover:text-surface-300 transition-colors"
            >
              <span>{post.comment_count} {t.social.feed.comments.toLowerCase()}</span>
            </button>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      <div className="border-t border-surface-800 mx-4" />

      {/* ── Action buttons ── */}
      <div className="flex items-center px-2 py-1">
        <PostReactionButton
          postId={post.id}
          userId={currentUserId}
          initialReaction={post.user_reaction ?? (post.user_has_liked ? "like" : null)}
          onReactionChange={onReactionChange ?? (() => {})}
        />
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          <span>{t.social.feed.comment}</span>
        </button>
        <PostShareButton postId={post.id} />
        <PostBookmarkButton
          postId={post.id}
          userId={currentUserId}
          initialBookmarked={post.user_has_bookmarked ?? false}
        />
      </div>

      {/* ── Comments ── */}
      {showComments && (
        <div className="border-t border-surface-800">
          <PostComments
            postId={post.id}
            currentUserId={currentUserId}
            onCommentAdded={() => onCommentAdded(post.id)}
          />
        </div>
      )}
    </div>
  );
}

// ── Inline media upload for operators/admins ──
function MatchRecapMediaUploadInline({
  postId,
  authorId,
  onMediaAdded,
}: {
  postId: string;
  authorId: string;
  onMediaAdded?: (postId: string, media: any[]) => void;
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch(`/api/social/posts/${postId}/media`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onMediaAdded?.(postId, data.media ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <label className="flex items-center gap-1.5 text-xs text-pitch-400 hover:text-pitch-300 cursor-pointer transition-colors">
      {uploading ? (
        <>
          <div className="w-4 h-4 border-2 border-surface-600 border-t-pitch-400 rounded-full animate-spin" />
          <span>{t.social.feed.uploadingMedia}</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <span>{t.social.feed.addPhotos}</span>
        </>
      )}
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFiles}
        className="hidden"
        disabled={uploading}
      />
    </label>
  );
}
