"use client";

import { useState } from "react";
import Link from "next/link";
import type { FriendshipWithProfile, Profile } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

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

  const getInitials = () =>
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();

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
          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-pitch-900 flex items-center justify-center text-pitch-400 text-sm font-semibold">
            {getInitials()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-surface-100 truncate">{profile.first_name} {profile.last_name}</p>
          {profile.city && <p className="text-xs text-surface-500">{profile.city}</p>}
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
