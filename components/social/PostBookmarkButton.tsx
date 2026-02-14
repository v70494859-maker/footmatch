"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

interface PostBookmarkButtonProps {
  postId: string;
  userId: string;
  initialBookmarked: boolean;
}

export default function PostBookmarkButton({
  postId,
  userId,
  initialBookmarked,
}: PostBookmarkButtonProps) {
  const { t } = useTranslation();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [error, setError] = useState(false);

  const handleToggle = async () => {
    setError(false);
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);

    const supabase = createClient();

    try {
      if (newBookmarked) {
        const { error } = await supabase
          .from("post_bookmarks")
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_bookmarks")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    } catch {
      setBookmarked(!newBookmarked);
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-xl transition-colors ${
        bookmarked
          ? "text-pitch-400 hover:bg-pitch-500/10"
          : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
      }`}
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill={bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
        />
      </svg>
      <span>{error ? "!" : bookmarked ? t.social.feed.saved : t.social.feed.save}</span>
    </button>
  );
}
