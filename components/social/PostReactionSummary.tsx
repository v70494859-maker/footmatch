"use client";

import type { PostReactionType } from "@/types";

const EMOJI_MAP: Record<PostReactionType, string> = {
  like: "\u2764\uFE0F",
  fire: "\uD83D\uDD25",
  goal: "\u26BD",
  clap: "\uD83D\uDC4F",
  laugh: "\uD83D\uDE02",
};

interface PostReactionSummaryProps {
  breakdown: { type: PostReactionType; count: number }[];
  totalCount: number;
}

export default function PostReactionSummary({ breakdown, totalCount }: PostReactionSummaryProps) {
  if (totalCount === 0) return null;

  const topReactions = [...breakdown]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <span className="flex items-center gap-1">
      <span className="flex items-center -space-x-0.5">
        {topReactions.map(({ type }) => (
          <span key={type} className="text-sm">{EMOJI_MAP[type]}</span>
        ))}
      </span>
      <span>{totalCount}</span>
    </span>
  );
}
