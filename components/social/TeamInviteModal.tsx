"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

interface FriendProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface TeamInviteModalProps {
  teamId: string;
  userId: string;
  friends: FriendProfile[];
  onClose: () => void;
}

export default function TeamInviteModal({ teamId, userId, friends, onClose }: TeamInviteModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const filtered = friends.filter((f) => {
    const name = `${f.first_name} ${f.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const getInitials = (f: FriendProfile) =>
    `${f.first_name?.[0] ?? ""}${f.last_name?.[0] ?? ""}`.toUpperCase();

  const handleInvite = async (friendId: string) => {
    setSending(friendId);
    const supabase = createClient();

    const { error } = await supabase
      .from("team_invitations")
      .insert({
        team_id: teamId,
        inviter_id: userId,
        invitee_id: friendId,
        status: "pending",
      });

    if (!error) {
      setSentIds((prev) => new Set(prev).add(friendId));
    }
    setSending(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-800">
          <h2 className="text-lg font-semibold text-surface-100">
            {t.social.teams.inviteFriends}
          </h2>
          <button
            onClick={onClose}
            className="text-surface-500 hover:text-surface-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-surface-800">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.social.friends.searchPlayers}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-950 border border-surface-800 rounded-xl text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-pitch-500"
            />
          </div>
        </div>

        {/* Friends list */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((friend) => {
                const alreadySent = sentIds.has(friend.id);
                return (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 bg-surface-950 border border-surface-800 rounded-xl p-3"
                  >
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-pitch-900 flex items-center justify-center text-pitch-400 text-sm font-semibold shrink-0">
                        {getInitials(friend)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-100 truncate">
                        {friend.first_name} {friend.last_name}
                      </p>
                    </div>

                    {alreadySent ? (
                      <span className="text-xs text-pitch-400 font-medium px-3 py-1.5">
                        {t.social.teams.inviteSent}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInvite(friend.id)}
                        disabled={sending === friend.id}
                        className="px-3 py-1.5 bg-pitch-400 text-surface-950 text-xs font-semibold rounded-lg hover:bg-pitch-300 transition-colors disabled:opacity-50"
                      >
                        {sending === friend.id ? "..." : t.social.teams.invite}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-surface-500 text-center py-8">
              {t.social.friends.noResults}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
