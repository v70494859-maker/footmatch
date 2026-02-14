"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

interface PostLikeButtonProps {
  postId: string;
  userId: string;
  initialLiked: boolean;
  likeCount: number;
  onToggle: (liked: boolean) => void;
}

export default function PostLikeButton({
  postId,
  userId,
  initialLiked,
  likeCount,
  onToggle,
}: PostLikeButtonProps) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(likeCount);
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState(false);

  const handleToggle = async () => {
    setError(false);
    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    onToggle(newLiked);

    if (newLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }

    const supabase = createClient();

    try {
      if (newLiked) {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    } catch {
      setLiked(!newLiked);
      setCount((prev) => (!newLiked ? prev + 1 : Math.max(0, prev - 1)));
      onToggle(!newLiked);
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-xl transition-colors ${
        liked
          ? "text-red-500 hover:bg-red-500/10"
          : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
      }`}
    >
      <svg
        className={`w-5 h-5 transition-transform ${animating ? "scale-125" : "scale-100"}`}
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      <span>{error ? "!" : t.social.feed.like}</span>
    </button>
  );
}
