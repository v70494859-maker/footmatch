"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface MessageButtonProps {
  targetUserId: string;
  currentUserId: string;
  className?: string;
}

export default function MessageButton({
  targetUserId,
  currentUserId,
  className = "",
}: MessageButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = createClient();
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (targetUserId === currentUserId) return;

    async function checkFriendship() {
      const { data } = await supabase
        .from("friendships")
        .select("id")
        .eq("status", "accepted")
        .or(
          `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
        )
        .maybeSingle();

      setIsFriend(!!data);
      setChecked(true);
    }

    checkFriendship();
  }, [targetUserId, currentUserId, supabase]);

  if (!checked || !isFriend || targetUserId === currentUserId) return null;

  async function handleMessage() {
    if (loading) return;
    setLoading(true);

    const { data, error } = await supabase.rpc(
      "get_or_create_direct_conversation",
      { user_a: currentUserId, user_b: targetUserId }
    );

    if (error || !data) {
      setLoading(false);
      return;
    }

    router.push(`/social/messages/${data}`);
  }

  return (
    <button
      type="button"
      onClick={handleMessage}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-800 text-surface-100 text-sm font-medium hover:bg-surface-700 transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
      ) : (
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
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
          />
        </svg>
      )}
      {t.social.messages.title}
    </button>
  );
}
