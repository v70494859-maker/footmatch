"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { PostCommentWithAuthor } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import MentionAutocomplete from "@/components/social/MentionAutocomplete";
import { renderTextWithMentions, parseMentions } from "@/lib/mentions";

interface PostCommentsProps {
  postId: string;
  currentUserId: string;
  onCommentAdded: () => void;
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

export default function PostComments({ postId, currentUserId, onCommentAdded }: PostCommentsProps) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<PostCommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const [showMentions, setShowMentions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch comments on mount
  useEffect(() => {
    const fetchComments = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("post_comments")
        .select("*, author:profiles!post_comments_author_id_fkey(id, first_name, last_name, avatar_url, city)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      setComments((data as PostCommentWithAuthor[]) ?? []);
      setLoading(false);
    };

    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data: newComment, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          author_id: currentUserId,
          content: content.trim(),
        })
        .select("*, author:profiles!post_comments_author_id_fkey(id, first_name, last_name, avatar_url, city)")
        .single();

      if (error) throw error;

      // Insert mentions
      const mentions = parseMentions(content);
      if (mentions.length > 0 && newComment) {
        const { data: matchedProfiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .or(mentions.map((m) => `and(first_name.ilike.${m.firstName},last_name.ilike.${m.lastName})`).join(","));

        if (matchedProfiles && matchedProfiles.length > 0) {
          const mentionRecords = matchedProfiles.map((p: any) => ({
            comment_id: newComment.id,
            mentioned_user_id: p.id,
            mentioner_user_id: currentUserId,
          }));
          await supabase.from("post_mentions").insert(mentionRecords);
        }
      }

      setComments((prev) => [...prev, newComment as PostCommentWithAuthor]);
      setContent("");
      onCommentAdded();
    } catch {
      setError(t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-3">
      {/* Comments list */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-4 h-4 border-2 border-surface-700 border-t-pitch-400 rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-surface-500 text-center py-3">{t.social.feed.noComments}</p>
      ) : (
        <div className="space-y-3 mb-3 max-h-80 overflow-y-auto">
          {comments.map((comment) => {
            const author = comment.author;

            return (
              <div key={comment.id} className="flex items-start gap-2.5">
                <Link href={`/players/${author?.id}`} className="shrink-0">
                  {author?.avatar_url ? (
                    <img
                      src={author.avatar_url}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <ProfileAvatar
                      firstName={author?.first_name ?? ""}
                      lastName={author?.last_name ?? ""}
                      size="xs"
                    />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="bg-surface-800/50 rounded-xl px-3 py-2">
                    <Link
                      href={`/players/${author?.id}`}
                      className="text-xs font-semibold text-surface-200 hover:text-pitch-400 transition-colors"
                    >
                      {author?.first_name} {author?.last_name}
                    </Link>
                    <p className="text-sm text-surface-300 mt-0.5 whitespace-pre-wrap break-words">
                      {renderTextWithMentions(comment.content)}
                    </p>
                  </div>
                  <span className="text-[10px] text-surface-600 mt-1 ml-3 block">
                    {timeAgo(comment.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5 mb-2">{error}</p>
      )}

      {/* Comment input */}
      <form ref={formRef} onSubmit={handleSubmit} className="relative flex items-center gap-2">
        {showMentions && (
          <MentionAutocomplete
            text={content}
            cursorPosition={cursorPos}
            containerRef={formRef}
            onSelect={(mentionText) => {
              const beforeCursor = content.slice(0, cursorPos);
              const atIndex = beforeCursor.lastIndexOf("@");
              const afterCursor = content.slice(cursorPos);
              const newContent = beforeCursor.slice(0, atIndex) + mentionText + " " + afterCursor;
              setContent(newContent);
              setShowMentions(false);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            onClose={() => setShowMentions(false)}
          />
        )}
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setCursorPos(e.target.selectionStart ?? 0);
            const val = e.target.value.slice(0, e.target.selectionStart ?? 0);
            setShowMentions(/@[A-Za-zÀ-ÿ.]*$/.test(val));
          }}
          onKeyUp={(e) => setCursorPos((e.target as HTMLInputElement).selectionStart ?? 0)}
          placeholder={t.social.feed.addComment}
          className="flex-1 bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-pitch-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="text-pitch-400 hover:text-pitch-300 disabled:text-surface-600 disabled:cursor-not-allowed transition-colors p-2"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-surface-600 border-t-pitch-400 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
