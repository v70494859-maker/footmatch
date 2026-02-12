"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { FriendshipStatus } from "@/types";

interface AddFriendButtonProps {
  targetUserId: string;
  currentUserId: string;
  className?: string;
}

export default function AddFriendButton({ targetUserId, currentUserId, className }: AddFriendButtonProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<FriendshipStatus | "none" | "loading">("loading");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("friendships")
      .select("id, status, requester_id")
      .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStatus(data.status as FriendshipStatus);
          setFriendshipId(data.id);
        } else {
          setStatus("none");
        }
      });
  }, [currentUserId, targetUserId]);

  const handleAdd = async () => {
    setStatus("loading");
    const supabase = createClient();
    const { data } = await supabase
      .from("friendships")
      .insert({ requester_id: currentUserId, addressee_id: targetUserId, status: "pending" })
      .select("id")
      .single();
    if (data) {
      setFriendshipId(data.id);
      setStatus("pending");
    }
  };

  const handleCancel = async () => {
    if (!friendshipId) return;
    setStatus("loading");
    const supabase = createClient();
    await supabase.from("friendships").delete().eq("id", friendshipId);
    setStatus("none");
    setFriendshipId(null);
  };

  if (status === "loading") {
    return <div className={`w-24 h-8 bg-surface-800 rounded-lg animate-pulse ${className ?? ""}`} />;
  }

  if (status === "accepted") {
    return (
      <span className={`text-xs text-pitch-400 font-medium ${className ?? ""}`}>
        {t.social.friends.alreadyFriends}
      </span>
    );
  }

  if (status === "pending") {
    return (
      <button
        onClick={handleCancel}
        className={`px-3 py-1.5 bg-surface-800 text-surface-400 text-xs font-medium rounded-lg hover:bg-surface-700 transition-colors ${className ?? ""}`}
      >
        {t.social.friends.pending}
      </button>
    );
  }

  if (status === "blocked" || status === "rejected") {
    return null;
  }

  return (
    <button
      onClick={handleAdd}
      className={`px-3 py-1.5 bg-pitch-400 text-surface-950 text-xs font-semibold rounded-lg hover:bg-pitch-300 transition-colors ${className ?? ""}`}
    >
      {t.social.friends.addFriend}
    </button>
  );
}
