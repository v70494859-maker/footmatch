"use client";

import Link from "next/link";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import { formatChatTime } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ConversationType } from "@/types";

interface ConversationItemProps {
  conversation: {
    id: string;
    type: ConversationType;
    name: string | null;
    last_message_at: string | null;
    conversation_participants: {
      user_id: string;
      last_read_at: string | null;
      muted: boolean;
      profile: {
        id: string;
        first_name: string;
        last_name: string;
        avatar_url: string | null;
        origin_country?: string | null;
        favorite_club?: string | null;
      };
    }[];
  };
  userId: string;
}

export default function ConversationItem({
  conversation,
  userId,
}: ConversationItemProps) {
  const { t } = useTranslation();

  // For direct conversations, show the other participant
  const otherParticipants = conversation.conversation_participants.filter(
    (p) => p.user_id !== userId
  );
  const currentParticipant = conversation.conversation_participants.find(
    (p) => p.user_id === userId
  );

  const otherUser = otherParticipants[0]?.profile;

  // Display name: for group conversations use the name, for direct use the other user's name
  const displayName =
    conversation.type === "group" && conversation.name
      ? conversation.name
      : otherUser
        ? `${otherUser.first_name} ${otherUser.last_name}`
        : t.social.messages.title;

  // Unread indicator: last_read_at is before last_message_at
  const hasUnread =
    conversation.last_message_at &&
    currentParticipant &&
    (!currentParticipant.last_read_at ||
      new Date(currentParticipant.last_read_at) <
        new Date(conversation.last_message_at));

  return (
    <Link
      href={`/social/messages/${conversation.id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-surface-900 border border-surface-800 hover:border-surface-700 transition-colors"
    >
      {/* Avatar */}
      {conversation.type === "direct" && otherUser ? (
        otherUser.avatar_url ? (
          <img
            src={otherUser.avatar_url}
            alt=""
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <ProfileAvatar
            firstName={otherUser.first_name}
            lastName={otherUser.last_name}
            size="md"
          />
        )
      ) : (
        <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center shrink-0">
          <svg
            className="w-5 h-5 text-surface-400"
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

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`text-sm truncate ${
              hasUnread
                ? "font-bold text-surface-50"
                : "font-medium text-surface-200"
            }`}
          >
            {displayName}
          </h3>
          {conversation.last_message_at && (
            <span className="text-[10px] text-surface-500 shrink-0">
              {formatChatTime(conversation.last_message_at)}
            </span>
          )}
        </div>
        {currentParticipant?.muted && (
          <span className="text-[10px] text-surface-600">
            {t.social.messages.mute}
          </span>
        )}
      </div>

      {/* Unread dot */}
      {hasUnread && (
        <div className="w-3 h-3 rounded-full bg-pitch-400 shrink-0 animate-pulse" />
      )}
    </Link>
  );
}
