"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { PostReactionType } from "@/types";

const REACTIONS: { type: PostReactionType; emoji: string }[] = [
  { type: "like", emoji: "\u2764\uFE0F" },
  { type: "fire", emoji: "\uD83D\uDD25" },
  { type: "goal", emoji: "\u26BD" },
  { type: "clap", emoji: "\uD83D\uDC4F" },
  { type: "laugh", emoji: "\uD83D\uDE02" },
];

interface PostReactionButtonProps {
  postId: string;
  userId: string;
  initialReaction: PostReactionType | null;
  onReactionChange: (postId: string, reaction: PostReactionType | null) => void;
}

export default function PostReactionButton({
  postId,
  userId,
  initialReaction,
  onReactionChange,
}: PostReactionButtonProps) {
  const { t } = useTranslation();
  const [reaction, setReaction] = useState<PostReactionType | null>(initialReaction);
  const [showPicker, setShowPicker] = useState(false);
  const [animating, setAnimating] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  const handleReactionSelect = async (type: PostReactionType) => {
    const prevReaction = reaction;
    const newReaction = reaction === type ? null : type;

    setReaction(newReaction);
    setShowPicker(false);
    onReactionChange(postId, newReaction);

    if (newReaction && newReaction !== prevReaction) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }

    const supabase = createClient();

    try {
      if (newReaction === null) {
        // Remove reaction
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      } else if (prevReaction === null) {
        // New reaction
        const { error } = await supabase
          .from("post_reactions")
          .insert({ post_id: postId, user_id: userId, reaction_type: newReaction });
        if (error) throw error;
      } else {
        // Change reaction
        const { error } = await supabase
          .from("post_reactions")
          .update({ reaction_type: newReaction })
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    } catch {
      // Rollback
      setReaction(prevReaction);
      onReactionChange(postId, prevReaction);
    }
  };

  const currentEmoji = REACTIONS.find((r) => r.type === reaction)?.emoji;

  return (
    <div ref={pickerRef} className="relative flex-1">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-xl transition-colors ${
          reaction
            ? "text-red-500 hover:bg-red-500/10"
            : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
        }`}
      >
        <span className={`text-lg transition-transform ${animating ? "scale-125" : "scale-100"}`}>
          {currentEmoji || "\u2764\uFE0F"}
        </span>
        <span>{reaction ? t.social.feed.reacted : t.social.feed.react}</span>
      </button>

      {showPicker && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-surface-800 border border-surface-700 rounded-xl p-1.5 shadow-xl z-20 flex gap-0.5">
          {REACTIONS.map(({ type, emoji }) => (
            <button
              key={type}
              onClick={() => handleReactionSelect(type)}
              className={`w-10 h-10 flex items-center justify-center text-2xl rounded-lg hover:bg-surface-700 hover:scale-110 transition-all ${
                reaction === type ? "bg-surface-700 ring-2 ring-pitch-400" : ""
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
