"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PostWithDetails, PostReactionType } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import PostCard from "@/components/social/PostCard";
import PostCreationForm from "@/components/social/PostCreationForm";

interface SocialFeedProps {
  userId: string;
  initialPosts: PostWithDetails[];
  isAdmin?: boolean;
}

export default function SocialFeed({ userId, initialPosts, isAdmin }: SocialFeedProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const [posts, setPosts] = useState<PostWithDetails[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 20);
  const [newPostCount, setNewPostCount] = useState(0);
  const observerRef = useRef<HTMLDivElement>(null);

  // Realtime subscription for new posts
  useEffect(() => {
    const channel = supabase
      .channel("social-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        async (payload) => {
          const newPost = payload.new as { id: string; author_id: string };

          // Don't add our own posts (already added via handleNewPost)
          if (newPost.author_id === userId) return;

          // Fetch full post details
          const { data: fullPost } = await supabase
            .from("posts")
            .select("*, author:profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url, city, origin_country, favorite_club), post_media(*)")
            .eq("id", newPost.id)
            .single();

          if (!fullPost) return;

          const enriched: PostWithDetails = {
            ...fullPost,
            user_has_liked: false,
          };

          setPosts((prev) => {
            if (prev.some((p) => p.id === enriched.id)) return prev;
            return [enriched, ...prev];
          });
          setNewPostCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // Clear new post indicator after 5 seconds
  useEffect(() => {
    if (newPostCount > 0) {
      const timer = setTimeout(() => setNewPostCount(0), 5000);
      return () => clearTimeout(timer);
    }
  }, [newPostCount]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || posts.length === 0) return;
    setLoading(true);
    setError(false);

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
      setError(true);
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

  const handleReactionChange = (postId: string, reaction: PostReactionType | null) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const prevReaction = p.user_reaction ?? (p.user_has_liked ? "like" as const : null);
        const countDelta = reaction && !prevReaction ? 1 : !reaction && prevReaction ? -1 : 0;
        return {
          ...p,
          user_reaction: reaction,
          user_has_liked: reaction !== null,
          like_count: Math.max(0, p.like_count + countDelta),
        };
      })
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
    <div>
      {/* Post creation */}
      <div className="mb-4">
        <PostCreationForm userId={userId} onPostCreated={handleNewPost} />
      </div>

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
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              onReactionChange={handleReactionChange}
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
        {error && (
          <button
            onClick={() => { setError(false); loadMore(); }}
            className="text-xs text-pitch-400 hover:text-pitch-300 transition-colors px-3 py-1.5 bg-surface-900 rounded-lg border border-surface-800"
          >
            {t.common.error} — {t.common.retry}
          </button>
        )}
      </div>
    </div>
  );
}
