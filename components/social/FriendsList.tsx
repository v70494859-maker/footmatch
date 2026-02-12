"use client";

import { useState } from "react";
import Link from "next/link";
import type { FriendshipWithProfile, Profile } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import AddFriendButton from "./AddFriendButton";

interface FriendsListProps {
  userId: string;
  friends: FriendshipWithProfile[];
  getFriendProfile: (f: FriendshipWithProfile) => Profile;
  onRemoveFriend: (friendshipId: string) => void;
}

export default function FriendsList({ userId, friends, getFriendProfile, onRemoveFriend }: FriendsListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const filteredFriends = friends.filter((f) => {
    const profile = getFriendProfile(f);
    const name = `${profile.first_name} ${profile.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", userId)
      .eq("role", "player")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .limit(10);

    setSearchResults(data ?? []);
    setSearching(false);
  };

  const handleRemove = async (friendshipId: string) => {
    setRemovingId(friendshipId);
    const supabase = createClient();
    await supabase.from("friendships").delete().eq("id", friendshipId);
    onRemoveFriend(friendshipId);
    setRemovingId(null);
  };

  const friendIds = new Set(friends.map((f) => getFriendProfile(f).id));

  const getInitials = (p: Profile) =>
    `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t.social.friends.searchPlayers}
          className="w-full pl-10 pr-4 py-2.5 bg-surface-900 border border-surface-800 rounded-xl text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-pitch-500"
        />
      </div>

      {/* Search results (non-friends) */}
      {search.length >= 2 && searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-medium text-surface-500 uppercase mb-2">{t.common.search}</h3>
          <div className="space-y-2">
            {searchResults
              .filter((p) => !friendIds.has(p.id))
              .map((profile) => (
                <div key={profile.id} className="flex items-center gap-3 bg-surface-900 border border-surface-800 rounded-xl p-3">
                  <Link href={`/players/${profile.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-pitch-900 flex items-center justify-center text-pitch-400 text-sm font-semibold">
                        {getInitials(profile)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-100 truncate">{profile.first_name} {profile.last_name}</p>
                      {profile.city && <p className="text-xs text-surface-500">{profile.city}</p>}
                    </div>
                  </Link>
                  <AddFriendButton targetUserId={profile.id} currentUserId={userId} />
                </div>
              ))}
          </div>
        </div>
      )}

      {search.length >= 2 && searchResults.filter((p) => !friendIds.has(p.id)).length === 0 && !searching && (
        <p className="text-center text-surface-500 py-4 text-sm">{t.social.friends.noResults}</p>
      )}

      {/* Friends list */}
      {filteredFriends.length > 0 ? (
        <div className="space-y-2">
          {filteredFriends.map((friendship) => {
            const profile = getFriendProfile(friendship);
            return (
              <div key={friendship.id} className="flex items-center gap-3 bg-surface-900 border border-surface-800 rounded-xl p-3">
                <Link href={`/players/${profile.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-pitch-900 flex items-center justify-center text-pitch-400 text-sm font-semibold">
                      {getInitials(profile)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-100 truncate">{profile.first_name} {profile.last_name}</p>
                    {profile.city && <p className="text-xs text-surface-500">{profile.city}</p>}
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(friendship.id)}
                  disabled={removingId === friendship.id}
                  className="text-xs text-surface-500 hover:text-danger-500 transition-colors px-2 py-1 disabled:opacity-50"
                >
                  {t.social.friends.removeFriend}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        search.length < 2 && (
          <p className="text-center text-surface-500 py-12">{t.social.friends.noFriends}</p>
        )
      )}
    </div>
  );
}
