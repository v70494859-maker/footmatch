"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { Profile } from "@/types";
import ConversationItem from "@/components/messages/ConversationItem";
import NewConversationModal from "@/components/messages/NewConversationModal";

interface ConversationListPageProps {
  userId: string;
  conversations: any[];
  friends: Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url">[];
}

export default function ConversationListPage({
  userId,
  conversations,
  friends,
}: ConversationListPageProps) {
  const { t } = useTranslation();
  const [showNewModal, setShowNewModal] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-surface-50">
          {t.social.messages.title}
        </h1>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pitch-400 text-surface-950 text-sm font-semibold hover:bg-pitch-300 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          {t.social.messages.newConversation}
        </button>
      </div>

      {/* Conversation list */}
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            className="w-12 h-12 text-surface-700 mb-3"
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
            {t.social.messages.noConversations}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              userId={userId}
            />
          ))}
        </div>
      )}

      {/* New conversation modal */}
      {showNewModal && (
        <NewConversationModal
          userId={userId}
          friends={friends}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}
