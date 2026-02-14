"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TrendingPost {
  id: string;
  caption: string | null;
  like_count: number;
  created_at: string;
}

interface PendingRequest {
  id: string;
  requester: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface ActivityWidgetProps {
  pendingRequests: PendingRequest[];
  trendingPosts: TrendingPost[];
  userId: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ActivityWidget({ pendingRequests, trendingPosts, userId }: ActivityWidgetProps) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<PendingRequest[]>(pendingRequests);

  const handleAccept = async (friendshipId: string) => {
    const supabase = createClient();
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  };

  const hasActivity = requests.length > 0;
  const hasTrending = trendingPosts.length > 0;

  if (!hasActivity && !hasTrending) return null;

  return (
    <div className="sticky top-4 space-y-4">
      {/* ---- CARD 1 — Activité ---- */}
      {hasActivity && (
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-surface-100 mb-3">{t.social.activity.title}</h3>

          {/* Friend requests */}
          {requests.length > 0 && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-surface-500">
                {t.social.activity.friendRequests}
              </span>

              <div className="mt-2 space-y-2">
                {requests.map((req) => (
                  <div key={req.id} className="flex items-center gap-2">
                    <ProfileAvatar
                      firstName={req.requester.first_name}
                      lastName={req.requester.last_name}
                      size="xs"
                    />
                    <Link
                      href={`/social/profile/${req.requester.id}`}
                      className="text-xs text-surface-50 hover:text-pitch-400 transition-colors truncate flex-1"
                    >
                      {req.requester.first_name} {req.requester.last_name}
                    </Link>
                    <button
                      onClick={() => handleAccept(req.id)}
                      className="px-2 py-1 bg-pitch-400 text-surface-950 text-[10px] font-bold rounded-lg hover:bg-pitch-300 transition-colors shrink-0"
                    >
                      {t.social.friends.accept}
                    </button>
                  </div>
                ))}
              </div>

              <Link
                href="/social/friends"
                className="block mt-2 text-[10px] text-surface-500 hover:text-pitch-400 transition-colors"
              >
                {t.social.activity.seeMore} &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ---- CARD 2 — Tendances ---- */}
      {hasTrending && (
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-surface-100 mb-3">{t.social.trending.title}</h3>

          <div className="space-y-3">
            {trendingPosts.map((post) => (
              <Link
                key={post.id}
                href={`/social/post/${post.id}`}
                className="block group"
              >
                <p className="text-xs text-surface-200 group-hover:text-pitch-400 transition-colors line-clamp-1">
                  {post.caption ?? "..."}
                </p>
                <span className="text-[10px] text-surface-500">
                  {post.like_count} {t.social.trending.likes} &middot; {timeAgo(post.created_at)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
