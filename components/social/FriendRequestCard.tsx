"use client";

import { useState } from "react";
import Link from "next/link";
import type { FriendshipWithProfile, Profile } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { getClubLogo } from "@/lib/clubs";
import { getFlagForCountry } from "@/lib/cities";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

interface FriendRequestCardProps {
  friendship: FriendshipWithProfile;
  profile: Profile;
  type: "incoming" | "outgoing";
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

export default function FriendRequestCard({ friendship, profile, type, onAccept, onReject, onCancel }: FriendRequestCardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const flag = getFlagForCountry(profile.origin_country);

  const handleAccept = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendship.id);
    onAccept?.();
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("friendships")
      .update({ status: "rejected" })
      .eq("id", friendship.id);
    onReject?.();
    setLoading(false);
  };

  const handleCancel = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("friendships").delete().eq("id", friendship.id);
    onCancel?.();
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3 bg-surface-900 border border-surface-800 rounded-xl p-3">
      <Link href={`/players/${profile.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={`${profile.first_name} ${profile.last_name}`}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <ProfileAvatar
            firstName={profile.first_name}
            lastName={profile.last_name}
            size="md"
          />
        )}
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
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        {type === "incoming" && (
          <>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="px-3 py-1.5 bg-pitch-400 text-surface-950 text-xs font-semibold rounded-lg hover:bg-pitch-300 transition-colors disabled:opacity-50"
            >
              {t.social.friends.accept}
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="px-3 py-1.5 bg-surface-800 text-surface-300 text-xs font-semibold rounded-lg hover:bg-surface-700 transition-colors disabled:opacity-50"
            >
              {t.social.friends.reject}
            </button>
          </>
        )}
        {type === "outgoing" && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1.5 bg-surface-800 text-surface-400 text-xs font-medium rounded-lg hover:bg-surface-700 transition-colors disabled:opacity-50"
          >
            {t.social.friends.cancelRequest}
          </button>
        )}
      </div>
    </div>
  );
}
