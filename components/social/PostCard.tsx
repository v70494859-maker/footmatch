"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostWithDetails } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import PostMediaCarousel from "@/components/social/PostMediaCarousel";
import PostLikeButton from "@/components/social/PostLikeButton";
import PostComments from "@/components/social/PostComments";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import { getClubLogo } from "@/lib/clubs";
import { getFlagForCountry } from "@/lib/cities";

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

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Link href={`/players/${author?.id}`} className="shrink-0">
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <ProfileAvatar
              firstName={author?.first_name ?? ""}
              lastName={author?.last_name ?? ""}
              size="md"
            />
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/players/${author?.id}`}
              className="text-sm font-semibold text-surface-100 hover:text-pitch-400 transition-colors truncate"
            >
              {author?.first_name} {author?.last_name}
            </Link>
            {author?.origin_country && getFlagForCountry(author.origin_country) && (
              <span className="text-xs">{getFlagForCountry(author.origin_country)}</span>
            )}
            {author?.favorite_club && (
              <img
                src={getClubLogo(author.favorite_club)}
                alt=""
                className="w-4 h-4 inline-block"
              />
            )}
          </div>
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
          <span className="flex items-center gap-1">
            {post.like_count > 0 && (
              <>
                <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
                <span>
                  {post.like_count} {t.social.feed.like}{post.like_count > 1 ? "s" : ""}
                </span>
              </>
            )}
          </span>
          {post.comment_count > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 hover:text-surface-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              <span>{post.comment_count} {t.social.feed.comments.toLowerCase()}</span>
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
