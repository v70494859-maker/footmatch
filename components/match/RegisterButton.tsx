"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import Button from "@/components/ui/Button";

interface RegisterButtonProps {
  matchId: string;
  isRegistered: boolean;
  hasSubscription: boolean;
  isFull: boolean;
}

export default function RegisterButton({
  matchId,
  isRegistered,
  hasSubscription,
  isFull,
}: RegisterButtonProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Not subscribed: link to subscription page
  if (!hasSubscription) {
    return (
      <Link href="/subscription" className="block">
        <Button fullWidth variant="secondary">
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
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          {t.matchCard.subscribeToPlay}
        </Button>
      </Link>
    );
  }

  async function handleJoin() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(t.matchCard.mustBeLoggedToJoin);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("match_registrations")
      .insert({
        match_id: matchId,
        player_id: user.id,
        status: "confirmed",
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Fire-and-forget registration email
    fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "match_registration", data: { matchId } }),
    }).catch(() => {});

    setLoading(false);
    router.refresh();
  }

  async function handleCancel() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(t.auth.mustBeLoggedIn);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("match_registrations")
      .update({ status: "canceled" })
      .eq("match_id", matchId)
      .eq("player_id", user.id)
      .eq("status", "confirmed");

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      {error && (
        <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl px-4 py-3 mb-3">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {isRegistered ? (
        <Button
          fullWidth
          variant="danger"
          onClick={handleCancel}
          loading={loading}
        >
          {t.matchCard.cancelRegistration}
        </Button>
      ) : isFull ? (
        <Button fullWidth disabled>
          {t.matchCard.matchFull}
        </Button>
      ) : (
        <Button fullWidth onClick={handleJoin} loading={loading}>
          {t.matchCard.joinMatch}
        </Button>
      )}
    </div>
  );
}
