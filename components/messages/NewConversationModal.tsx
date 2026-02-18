"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import type { Profile } from "@/types";

interface NewConversationModalProps {
  userId: string;
  friends: Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url">[];
  onClose: () => void;
}

export default function NewConversationModal({
  userId,
  friends,
  onClose,
}: NewConversationModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredFriends = friends.filter((f) => {
    const name = `${f.first_name} ${f.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  async function handleSelectFriend(friendId: string) {
    if (loading) return;
    setLoading(friendId);

    try {
      const { data, error } = await supabase.rpc(
        "get_or_create_direct_conversation",
        {
          user_a: userId,
          user_b: friendId,
        }
      );

      if (error) {
        console.error("Error creating conversation:", error);
        setLoading(null);
        return;
      }

      const conversationId = data;
      onClose();
      router.push(`/social/messages/${conversationId}`);
    } catch (err) {
      console.error("Error creating conversation:", err);
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
          <h2 className="text-lg font-semibold text-surface-50">
            {t.social.messages.newConversation}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-surface-400 hover:text-foreground transition-colors"
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-surface-800">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.social.messages.selectFriends}
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-surface-500 focus:outline-none focus:ring-1 focus:ring-pitch-500/50"
          />
        </div>

        {/* Friends list */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredFriends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-surface-500">
                {t.social.friends.noFriends}
              </p>
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <button
                key={friend.id}
                type="button"
                onClick={() => handleSelectFriend(friend.id)}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-800/60 transition-colors disabled:opacity-50"
              >
                <ProfileAvatar
                  firstName={friend.first_name}
                  lastName={friend.last_name}
                  size="sm"
                />
                <span className="text-sm font-medium text-surface-100">
                  {friend.first_name} {friend.last_name}
                </span>
                {loading === friend.id && (
                  <div className="ml-auto">
                    <div className="w-4 h-4 border-2 border-pitch-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
