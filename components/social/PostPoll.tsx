"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { PostPollWithOptions } from "@/types";

interface PostPollProps {
  poll: PostPollWithOptions;
  currentUserId: string;
}

export default function PostPoll({ poll, currentUserId }: PostPollProps) {
  const { t } = useTranslation();
  const [votedOptionId, setVotedOptionId] = useState<string | null>(poll.user_voted_option_id ?? null);
  const [options, setOptions] = useState(poll.poll_options);

  const totalVotes = options.reduce((sum, opt) => sum + opt.vote_count, 0);
  const hasVoted = votedOptionId !== null;
  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;

  const handleVote = async (optionId: string) => {
    if (hasVoted || isExpired) return;

    setVotedOptionId(optionId);
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === optionId ? { ...opt, vote_count: opt.vote_count + 1 } : opt
      )
    );

    const supabase = createClient();
    try {
      const { error } = await supabase.from("poll_votes").insert({
        poll_id: poll.id,
        option_id: optionId,
        user_id: currentUserId,
      });
      if (error) throw error;
    } catch {
      setVotedOptionId(null);
      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === optionId ? { ...opt, vote_count: Math.max(0, opt.vote_count - 1) } : opt
        )
      );
    }
  };

  return (
    <div className="px-4 pb-3">
      <p className="text-sm font-semibold text-surface-100 mb-3">{poll.question}</p>
      <div className="space-y-2">
        {options
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((option) => {
            const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0;
            const isVoted = votedOptionId === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted || isExpired}
                className={`w-full relative rounded-xl border overflow-hidden transition-all text-left ${
                  isVoted
                    ? "border-pitch-400 bg-pitch-500/5"
                    : hasVoted
                      ? "border-surface-700 bg-surface-800/30 cursor-default"
                      : "border-surface-700 bg-surface-800/50 hover:border-surface-600 cursor-pointer"
                }`}
              >
                {/* Progress bar */}
                {hasVoted && (
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                      isVoted ? "bg-pitch-500/15" : "bg-surface-700/30"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {isVoted && (
                      <svg className="w-4 h-4 text-pitch-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                    <span className={`text-sm ${isVoted ? "text-pitch-400 font-medium" : "text-surface-200"}`}>
                      {option.text}
                    </span>
                  </div>
                  {hasVoted && (
                    <span className={`text-xs font-semibold shrink-0 ml-2 ${isVoted ? "text-pitch-400" : "text-surface-400"}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-surface-500">
        <span>
          {totalVotes} {t.social.feed.votes}
        </span>
        {poll.expires_at && (
          <span>
            {isExpired
              ? t.social.feed.voted
              : `${t.social.feed.pollExpires} ${new Date(poll.expires_at).toLocaleDateString()}`}
          </span>
        )}
      </div>
    </div>
  );
}
