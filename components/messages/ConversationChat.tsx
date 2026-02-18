"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { formatChatTime } from "@/lib/format";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import ImagePreview from "@/components/chat/ImagePreview";
import ConversationInput from "@/components/messages/ConversationInput";
import type {
  Profile,
  DirectMessage,
  DirectMessageWithSender,
  ConversationType,
} from "@/types";

interface ParticipantProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface ConversationData {
  id: string;
  type: ConversationType;
  name: string | null;
  last_message_at: string | null;
  created_at: string;
  conversation_participants: {
    id: string;
    conversation_id: string;
    user_id: string;
    last_read_at: string | null;
    muted: boolean;
    joined_at: string;
    profile: ParticipantProfile;
  }[];
}

interface ConversationChatProps {
  conversationId: string;
  userId: string;
  conversation: ConversationData;
  initialMessages: DirectMessageWithSender[];
  totalCount?: number;
}

const PAGE_SIZE = 50;

export default function ConversationChat({
  conversationId,
  userId,
  conversation,
  initialMessages,
  totalCount,
}: ConversationChatProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const [messages, setMessages] =
    useState<DirectMessageWithSender[]>(initialMessages);
  const [replyTo, setReplyTo] = useState<DirectMessageWithSender | null>(null);
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(
    totalCount ? initialMessages.length < totalCount : initialMessages.length >= PAGE_SIZE
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const profileCache = useRef<Map<string, Profile>>(new Map());

  // Determine display name and other participant
  const otherParticipants = conversation.conversation_participants.filter(
    (p) => p.user_id !== userId
  );
  const otherUser = otherParticipants[0]?.profile;

  const chatTitle =
    conversation.type === "group" && conversation.name
      ? conversation.name
      : otherUser
        ? `${otherUser.first_name} ${otherUser.last_name}`
        : t.social.messages.title;

  const participantCount = conversation.conversation_participants.length;

  // Seed profile cache with initial senders
  useEffect(() => {
    for (const msg of initialMessages) {
      if (msg.sender) {
        profileCache.current.set(msg.sender_id, msg.sender as Profile);
      }
    }
    for (const p of conversation.conversation_participants) {
      if (p.profile) {
        profileCache.current.set(p.user_id, p.profile as Profile);
      }
    }
  }, [initialMessages, conversation.conversation_participants]);

  // Scroll to bottom on mount and new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Realtime subscription for new messages + deletions
  useEffect(() => {
    const channel = supabase
      .channel(`dm:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as DirectMessage;

          let sender = profileCache.current.get(newMsg.sender_id);
          if (!sender) {
            const { data } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, avatar_url")
              .eq("id", newMsg.sender_id)
              .single();
            if (data) {
              sender = data as Profile;
              profileCache.current.set(newMsg.sender_id, sender);
            }
          }

          const msgWithSender: DirectMessageWithSender = {
            ...newMsg,
            sender: sender!,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, msgWithSender];
          });

          // Update last_read_at
          supabase
            .from("conversation_participants")
            .update({ last_read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .eq("user_id", userId)
            .then(() => {});
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as DirectMessage;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? { ...m, deleted_at: updated.deleted_at }
                : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, supabase]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  // Load older messages
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    const { data } = await supabase
      .from("direct_messages")
      .select(
        "*, sender:profiles!direct_messages_sender_id_fkey(id, first_name, last_name, avatar_url)"
      )
      .eq("conversation_id", conversationId)
      .lt("created_at", messages[0]?.created_at ?? new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data && data.length > 0) {
      const older = data.reverse() as DirectMessageWithSender[];
      for (const msg of older) {
        if (msg.sender) {
          profileCache.current.set(msg.sender_id, msg.sender as Profile);
        }
      }
      setMessages((prev) => [...older, ...prev]);
      setHasMore(data.length >= PAGE_SIZE);

      // Preserve scroll position
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  }, [loadingMore, hasMore, messages, conversationId, supabase]);

  // Delete message (soft)
  async function handleDelete(msgId: string) {
    setContextMenu(null);
    await supabase
      .from("direct_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", msgId)
      .eq("sender_id", userId);
  }

  // Find replied-to message text for display
  function getReplyPreview(replyToId: string | null): string | null {
    if (!replyToId) return null;
    const original = messages.find((m) => m.id === replyToId);
    if (!original) return null;
    if (original.deleted_at) return t.social.messages.messageDeleted;
    if (original.type === "image") return t.social.messages.image;
    if (original.type === "voice") return t.social.messages.voice;
    return original.content?.slice(0, 80) ?? null;
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-950/60 backdrop-blur-2xl border-b border-white/[0.04] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/social/messages"
            className="text-surface-400 hover:text-foreground transition-colors shrink-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </Link>

          {/* Avatar */}
          {conversation.type === "direct" && otherUser ? (
            <ProfileAvatar
              firstName={otherUser.first_name}
              lastName={otherUser.last_name}
              size="sm"
              href={`/players/${otherUser.id}`}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-surface-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                />
              </svg>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-foreground truncate">
              {chatTitle}
            </h1>
            {conversation.type === "group" && (
              <p className="text-xs text-surface-500">
                {participantCount} {t.social.messages.participants}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs text-surface-400 hover:text-foreground transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <div className="w-4 h-4 border-2 border-surface-400 border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                t.social.messages.loadMore
              )}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
              className="w-10 h-10 text-surface-700 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
              />
            </svg>
            <p className="text-sm text-surface-500">
              {t.social.messages.noMessages}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            const sender = msg.sender;
            const isDeleted = !!msg.deleted_at;
            const replyPreview = getReplyPreview(msg.reply_to_id);

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar (others only) */}
                {!isOwn && sender && (
                  <div className="mt-1">
                    <ProfileAvatar
                      firstName={sender.first_name}
                      lastName={sender.last_name}
                      size="xs"
                      href={`/players/${sender.id}`}
                    />
                  </div>
                )}

                {/* Bubble */}
                <div className="relative max-w-[75%] group">
                  {/* Reply context */}
                  {replyPreview && (
                    <div
                      className={`text-[10px] px-2.5 py-1 mb-0.5 rounded-lg bg-surface-800/50 text-surface-400 truncate border-l-2 ${
                        isOwn ? "border-pitch-500/40" : "border-surface-600"
                      }`}
                    >
                      {replyPreview}
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-3 py-2 ${
                      isDeleted
                        ? "bg-surface-800/40"
                        : isOwn
                          ? "bg-pitch-500/20 rounded-tr-md"
                          : "bg-surface-800 rounded-tl-md"
                    }`}
                  >
                    {/* Sender name (others only) */}
                    {!isOwn && sender && !isDeleted && (
                      <p className="text-[10px] font-semibold text-pitch-400 mb-0.5">
                        {sender.first_name} {sender.last_name}
                      </p>
                    )}

                    {isDeleted ? (
                      <p className="text-sm text-surface-500 italic">
                        {t.social.messages.messageDeleted}
                      </p>
                    ) : (
                      <>
                        {/* Text message */}
                        {msg.type === "text" && msg.content && (
                          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}

                        {/* Image message */}
                        {msg.type === "image" && msg.media_url && (
                          <DmImage url={msg.media_url} />
                        )}

                        {/* Voice message */}
                        {msg.type === "voice" && msg.media_url && (
                          <DmVoicePlayer
                            url={msg.media_url}
                            duration={msg.media_duration}
                          />
                        )}
                      </>
                    )}

                    {/* Timestamp */}
                    <p
                      className={`text-[10px] mt-1 ${
                        isOwn
                          ? "text-pitch-400/60 text-right"
                          : "text-surface-500"
                      }`}
                    >
                      {formatChatTime(msg.created_at)}
                    </p>
                  </div>

                  {/* Actions (reply + delete) */}
                  {!isDeleted && (
                    <div
                      className={`absolute top-0 ${
                        isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"
                      } hidden group-hover:flex items-center gap-0.5 px-1`}
                    >
                      {/* Reply */}
                      <button
                        type="button"
                        onClick={() => setReplyTo(msg)}
                        className="p-1 text-surface-500 hover:text-foreground transition-colors rounded"
                        title={t.social.messages.reply}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                        </svg>
                      </button>
                      {/* Delete (own messages only) */}
                      {isOwn && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu(contextMenu === msg.id ? null : msg.id);
                          }}
                          className="p-1 text-surface-500 hover:text-danger-500 transition-colors rounded"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Delete confirmation */}
                  {contextMenu === msg.id && (
                    <div
                      className={`absolute z-20 ${
                        isOwn ? "right-0" : "left-0"
                      } top-full mt-1 bg-surface-800 border border-surface-700 rounded-lg shadow-lg overflow-hidden`}
                    >
                      <button
                        type="button"
                        onClick={() => handleDelete(msg.id)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-danger-500 hover:bg-surface-700 transition-colors whitespace-nowrap"
                      >
                        {t.social.messages.deleteMessage}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview banner */}
      {replyTo && (
        <div className="px-3 pt-2 border-t border-surface-800 bg-surface-900/80">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/60 border-l-2 border-pitch-500/50">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-pitch-400">
                {replyTo.sender_id === userId
                  ? t.social.messages.you
                  : `${replyTo.sender?.first_name ?? ""}`}
              </p>
              <p className="text-xs text-surface-400 truncate">
                {replyTo.type === "image"
                  ? t.social.messages.image
                  : replyTo.type === "voice"
                    ? t.social.messages.voice
                    : replyTo.content?.slice(0, 60)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="p-0.5 text-surface-500 hover:text-foreground transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <ConversationInput
        conversationId={conversationId}
        currentUserId={userId}
        replyToId={replyTo?.id ?? null}
        onReplySent={() => setReplyTo(null)}
      />
    </div>
  );
}

function DmImage({ url }: { url: string }) {
  const [showPreview, setShowPreview] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setShowPreview(true)}
        className="block rounded-lg overflow-hidden"
      >
        <Image
          src={url}
          alt="Chat image"
          width={256}
          height={256}
          className="object-cover max-w-64 rounded-lg"
          unoptimized
        />
      </button>
      {showPreview && (
        <ImagePreview
          src={url}
          alt="Chat image"
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

function DmVoicePlayer({
  url,
  duration,
}: {
  url: string;
  duration: number | null;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function handlePlay() {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
        return;
      }
      audioRef.current.play();
      setPlaying(true);
      return;
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
      audioRef.current = null;
    };

    audio.play();
    setPlaying(true);
  }

  const formatDur = (s: number | null) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <button
        type="button"
        onClick={handlePlay}
        className="w-8 h-8 rounded-full bg-pitch-500/20 flex items-center justify-center shrink-0"
      >
        {playing ? (
          <svg
            className="w-4 h-4 text-pitch-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-pitch-400 ml-0.5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1 bg-surface-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-pitch-400 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-surface-500 mt-0.5">
          {formatDur(duration)}
        </p>
      </div>
    </div>
  );
}
