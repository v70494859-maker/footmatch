"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessageWithSender, Profile, ChatMessage } from "@/types";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";

interface MatchChatProps {
  matchId: string;
  matchTitle: string;
  participantCount: number;
  initialMessages: ChatMessageWithSender[];
  currentUserId: string;
  embedded?: boolean;
}

export default function MatchChat({
  matchId,
  matchTitle,
  participantCount,
  initialMessages,
  currentUserId,
  embedded = false,
}: MatchChatProps) {
  const supabase = createClient();
  const [messages, setMessages] =
    useState<ChatMessageWithSender[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const profileCache = useRef<Map<string, Profile>>(new Map());

  // Seed cache with initial senders
  useEffect(() => {
    for (const msg of initialMessages) {
      if (msg.sender) {
        profileCache.current.set(msg.sender_id, msg.sender);
      }
    }
  }, [initialMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_messages",
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;

          // Skip if we already have this message (from optimistic update or duplicate)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return prev; // will be updated below
          });

          // Fetch sender profile (use cache if available)
          let sender = profileCache.current.get(newMsg.sender_id);
          if (!sender) {
            const { data } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", newMsg.sender_id)
              .single();
            if (data) {
              sender = data as Profile;
              profileCache.current.set(newMsg.sender_id, sender);
            }
          }

          const msgWithSender: ChatMessageWithSender = {
            ...newMsg,
            sender: sender!,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, msgWithSender];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, supabase]);

  return (
    <div className={`flex flex-col ${embedded ? "h-full" : "h-[100dvh]"}`}>
      {!embedded && (
        <ChatHeader
          matchId={matchId}
          matchTitle={matchTitle}
          participantCount={participantCount}
        />
      )}

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
              Aucun message pour l&apos;instant. Lancez la conversation !
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === currentUserId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput matchId={matchId} currentUserId={currentUserId} />
    </div>
  );
}
