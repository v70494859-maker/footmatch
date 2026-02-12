"use client";

import { useState } from "react";
import Link from "next/link";
import type { FriendshipWithProfile, Profile } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { getClubLogo } from "@/lib/clubs";
import { getFlagForCountry } from "@/lib/cities";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import AddFriendButton from "./AddFriendButton";

interface FriendsListProps {
  userId: string;
  friends: FriendshipWithProfile[];
  getFriendProfile: (f: FriendshipWithProfile) => Profile;
  onRemoveFriend: (friendshipId: string) => void;
}

function FriendAvatar({ profile }: { profile: Profile }) {
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={`${profile.first_name} ${profile.last_name}`}
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }
  return (
    <ProfileAvatar
      firstName={profile.first_name}
      lastName={profile.last_name}
      size="md"
    />
  );
}

function FriendInfo({ profile }: { profile: Profile }) {
  const flag = getFlagForCountry(profile.origin_country);

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-surface-100 truncate">
          {profile.first_name} {profile.last_name}
        </p>
        {flag && <span className="text-sm shrink-0">{flag}</span>}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        {profile.city && (
          <span className="text-xs text-surface-500 flex items-center gap-0.5">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {profile.city}
          </span>
        )}
        {profile.favorite_club && (
          <span className="flex items-center gap-1 text-xs text-surface-500">
            <img
              src={getClubLogo(profile.favorite_club)}
              alt={profile.favorite_club}
              className="w-4 h-4 inline object-contain"
            />
          </span>
        )}
      </div>
    </div>
  );
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
                    <FriendAvatar profile={profile} />
                    <FriendInfo profile={profile} />
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
                  <FriendAvatar profile={profile} />
                  <FriendInfo profile={profile} />
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
