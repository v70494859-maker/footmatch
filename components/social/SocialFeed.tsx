"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PostWithDetails } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import PostCard from "@/components/social/PostCard";
import PostCreationForm from "@/components/social/PostCreationForm";

interface SocialFeedProps {
  userId: string;
  initialPosts: PostWithDetails[];
}

export default function SocialFeed({ userId, initialPosts }: SocialFeedProps) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostWithDetails[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 20);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || posts.length === 0) return;
    setLoading(true);

    const lastPost = posts[posts.length - 1];
    const cursor = lastPost.created_at;

    try {
      const res = await fetch(`/api/social/feed?cursor=${encodeURIComponent(cursor)}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const newPosts: PostWithDetails[] = data.posts ?? [];

      if (newPosts.length < 20) {
        setHasMore(false);
      }

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const unique = newPosts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...unique];
      });
    } catch {
      // Silently fail, user can scroll again
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, posts]);

  // Infinite scroll observer
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleNewPost = (post: PostWithDetails) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handlePostLikeToggle = (postId: string, liked: boolean) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              user_has_liked: liked,
              like_count: liked ? p.like_count + 1 : Math.max(0, p.like_count - 1),
            }
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-surface-50 mb-6">
        {t.social.feed.title}
      </h1>

      <PostCreationForm userId={userId} onPostCreated={handleNewPost} />

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg
            className="w-12 h-12 text-surface-700 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
            />
          </svg>
          <p className="text-sm text-surface-500">{t.social.feed.noPosts}</p>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              onLikeToggle={handlePostLikeToggle}
              onCommentAdded={handleCommentAdded}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={observerRef} className="h-10 flex items-center justify-center">
        {loading && (
          <div className="w-5 h-5 border-2 border-surface-700 border-t-pitch-400 rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}
