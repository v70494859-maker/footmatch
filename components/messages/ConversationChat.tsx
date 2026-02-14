"use client";

import { useState, useEffect, useRef } from "react";
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
}

export default function ConversationChat({
  conversationId,
  userId,
  conversation,
  initialMessages,
}: ConversationChatProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const [messages, setMessages] =
    useState<DirectMessageWithSender[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
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
    // Also seed from participant profiles
    for (const p of conversation.conversation_participants) {
      if (p.profile) {
        profileCache.current.set(p.user_id, p.profile as Profile);
      }
    }
  }, [initialMessages, conversation.conversation_participants]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription for new messages
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

          // Fetch sender profile (use cache if available)
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

          // Update last_read_at silently
          supabase
            .from("conversation_participants")
            .update({ last_read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .eq("user_id", userId)
            .then(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, supabase]);

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-surface-800 px-4 py-3">
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
                {participantCount}{" "}
                {participantCount !== 1 ? "participants" : "participant"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                    isOwn
                      ? "bg-pitch-500/20 rounded-tr-md"
                      : "bg-surface-800 rounded-tl-md"
                  }`}
                >
                  {/* Sender name (others only, in group or direct) */}
                  {!isOwn && sender && (
                    <p className="text-[10px] font-semibold text-pitch-400 mb-0.5">
                      {sender.first_name} {sender.last_name}
                    </p>
                  )}

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
                    <DmVoicePlayer url={msg.media_url} duration={msg.media_duration} />
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
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ConversationInput
        conversationId={conversationId}
        currentUserId={userId}
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

function DmVoicePlayer({ url, duration }: { url: string; duration: number | null }) {
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
          <svg className="w-4 h-4 text-pitch-400" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-pitch-400 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
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
