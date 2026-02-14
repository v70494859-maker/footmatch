"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostWithDetails } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import PostCard from "@/components/social/PostCard";

interface SavedFeedProps {
  userId: string;
  initialPosts: PostWithDetails[];
}

export default function SavedFeed({ userId, initialPosts }: SavedFeedProps) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostWithDetails[]>(initialPosts);

  const handleLikeToggle = (postId: string, liked: boolean) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, user_has_liked: liked, like_count: liked ? p.like_count + 1 : Math.max(0, p.like_count - 1) }
          : p
      )
    );
  };

  const handleCommentAdded = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
      )
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/social"
          className="text-surface-400 hover:text-surface-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-surface-50">{t.social.feed.savedPosts}</h1>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="w-12 h-12 text-surface-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
          </svg>
          <p className="text-sm text-surface-500">{t.social.feed.noSavedPosts}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              onLikeToggle={handleLikeToggle}
              onCommentAdded={handleCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
