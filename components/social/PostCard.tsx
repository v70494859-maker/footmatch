"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostWithDetails } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import PostMediaCarousel from "@/components/social/PostMediaCarousel";
import PostLikeButton from "@/components/social/PostLikeButton";
import PostComments from "@/components/social/PostComments";

interface PostCardProps {
  post: PostWithDetails;
  currentUserId: string;
  onLikeToggle: (postId: string, liked: boolean) => void;
  onCommentAdded: (postId: string) => void;
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

export default function PostCard({ post, currentUserId, onLikeToggle, onCommentAdded }: PostCardProps) {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);

  const author = post.author;
  const initials = `${author?.first_name?.[0] ?? ""}${author?.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Link href={`/players/${author?.id}`} className="shrink-0">
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={`${author.first_name} ${author.last_name}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-pitch-900 flex items-center justify-center text-pitch-400 text-sm font-semibold">
              {initials}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/players/${author?.id}`}
            className="text-sm font-semibold text-surface-100 hover:text-pitch-400 transition-colors truncate block"
          >
            {author?.first_name} {author?.last_name}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-surface-500">
            {author?.city && <span>{author.city}</span>}
            {author?.city && <span>&middot;</span>}
            <span>{timeAgo(post.created_at)}</span>
            <span>&middot;</span>
            <span className="capitalize">
              {post.visibility === "public"
                ? t.social.feed.public
                : post.visibility === "friends"
                  ? t.social.feed.friendsOnly
                  : t.social.feed.teamOnly}
            </span>
          </div>
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-2">
          <p className="text-sm text-surface-200 whitespace-pre-wrap break-words leading-relaxed">
            {post.caption}
          </p>
        </div>
      )}

      {/* Media */}
      {post.post_media && post.post_media.length > 0 && (
        <PostMediaCarousel media={post.post_media} />
      )}

      {/* Like + comment counts */}
      {(post.like_count > 0 || post.comment_count > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-surface-500">
          <span>
            {post.like_count > 0
              ? `${post.like_count} ${t.social.feed.like}${post.like_count > 1 ? "s" : ""}`
              : ""}
          </span>
          {post.comment_count > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:text-surface-300 transition-colors"
            >
              {post.comment_count} {t.social.feed.comments.toLowerCase()}
            </button>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-surface-800 mx-4" />

      {/* Action buttons */}
      <div className="flex items-center px-2 py-1">
        <PostLikeButton
          postId={post.id}
          userId={currentUserId}
          initialLiked={post.user_has_liked ?? false}
          likeCount={post.like_count}
          onToggle={(liked) => onLikeToggle(post.id, liked)}
        />
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
            />
          </svg>
          <span>{t.social.feed.comment}</span>
        </button>
      </div>

      {/* Comments section */}
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
