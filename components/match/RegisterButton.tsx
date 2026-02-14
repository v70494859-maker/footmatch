"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import Button from "@/components/ui/Button";

interface RegisterButtonProps {
  matchId: string;
  matchDate: string;
  matchStartTime: string;
  isRegistered: boolean;
  isStandby: boolean;
  standbyPosition?: number;
  hasSubscription: boolean;
  isFull: boolean;
  canStandby: boolean;
  cancelTokens: number;
}

export default function RegisterButton({
  matchId,
  matchDate,
  matchStartTime,
  isRegistered,
  isStandby,
  standbyPosition,
  hasSubscription,
  isFull,
  canStandby,
  cancelTokens,
}: RegisterButtonProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLateCancelModal, setShowLateCancelModal] = useState(false);

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

  function isWithin24h(): boolean {
    const matchStart = new Date(`${matchDate}T${matchStartTime}`);
    const now = new Date();
    const diffMs = matchStart.getTime() - now.getTime();
    return diffMs > 0 && diffMs < 24 * 60 * 60 * 1000;
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

  async function handleJoinStandby() {
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

    // Get current max standby position
    const { data: maxPos } = await supabase
      .from("match_registrations")
      .select("standby_position")
      .eq("match_id", matchId)
      .eq("status", "standby")
      .order("standby_position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = (maxPos?.standby_position ?? 0) + 1;

    const { error: insertError } = await supabase
      .from("match_registrations")
      .insert({
        match_id: matchId,
        player_id: user.id,
        status: "standby",
        standby_position: nextPosition,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  async function handleCancel() {
    // Check if this is a late cancellation (within 24h)
    if (isWithin24h() && isRegistered && !isStandby) {
      setShowLateCancelModal(true);
      return;
    }

    await performCancel(false);
  }

  async function performCancel(useToken: boolean) {
    setLoading(true);
    setError(null);
    setShowLateCancelModal(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(t.auth.mustBeLoggedIn);
      setLoading(false);
      return;
    }

    // Use token if requested
    if (useToken) {
      await supabase.rpc("use_cancel_token", { p_user_id: user.id });
    }

    const currentStatus = isStandby ? "standby" : "confirmed";
    const { error: updateError } = await supabase
      .from("match_registrations")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("match_id", matchId)
      .eq("player_id", user.id)
      .eq("status", currentStatus);

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

      {/* Late cancellation modal */}
      {showLateCancelModal && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 mb-3 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h3 className="text-sm font-semibold text-amber-400">{t.matchCard.lateCancel}</h3>
          </div>
          <p className="text-xs text-surface-400">{t.matchCard.lateCancelWarning}</p>

          {cancelTokens > 0 ? (
            <>
              <p className="text-xs text-surface-300">
                {t.matchCard.useTokenConfirm}
              </p>
              <p className="text-[10px] text-surface-500">
                {t.matchCard.useTokenDesc.replace("{count}", String(cancelTokens))}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => performCancel(true)}
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-lg bg-pitch-400 text-surface-950 text-xs font-semibold hover:bg-pitch-300 transition-colors disabled:opacity-50"
                >
                  {t.matchCard.useToken}
                </button>
                <button
                  onClick={() => performCancel(false)}
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-lg bg-danger-500/15 text-danger-500 text-xs font-semibold hover:bg-danger-500/25 transition-colors disabled:opacity-50"
                >
                  {t.matchCard.cancelWithoutToken}
                </button>
              </div>
              <button
                onClick={() => setShowLateCancelModal(false)}
                className="w-full text-xs text-surface-500 hover:text-surface-300 transition-colors"
              >
                {t.common.back}
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => performCancel(false)}
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-lg bg-danger-500/15 text-danger-500 text-xs font-semibold hover:bg-danger-500/25 transition-colors disabled:opacity-50"
                >
                  {t.matchCard.cancelRegistration}
                </button>
                <button
                  onClick={() => setShowLateCancelModal(false)}
                  className="flex-1 px-3 py-2 rounded-lg bg-surface-800 text-surface-300 text-xs font-semibold hover:bg-surface-700 transition-colors"
                >
                  {t.common.back}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Standby status */}
      {isStandby ? (
        <div className="space-y-2">
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 text-center">
            <p className="text-sm font-medium text-amber-400">
              {t.matchCard.standbyPosition.replace("{pos}", String(standbyPosition ?? "?"))}
            </p>
          </div>
          <Button
            fullWidth
            variant="danger"
            onClick={() => performCancel(false)}
            loading={loading}
          >
            {t.matchCard.cancelStandby}
          </Button>
        </div>
      ) : isRegistered ? (
        !showLateCancelModal && (
          <Button
            fullWidth
            variant="danger"
            onClick={handleCancel}
            loading={loading}
          >
            {t.matchCard.cancelRegistration}
          </Button>
        )
      ) : isFull ? (
        canStandby ? (
          <Button fullWidth variant="secondary" onClick={handleJoinStandby} loading={loading}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.matchCard.joinStandby}
          </Button>
        ) : (
          <Button fullWidth disabled>
            {t.matchCard.matchFull}
          </Button>
        )
      ) : (
        <Button fullWidth onClick={handleJoin} loading={loading}>
          {t.matchCard.joinMatch}
        </Button>
      )}
    </div>
  );
}
