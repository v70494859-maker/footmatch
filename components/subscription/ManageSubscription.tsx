"use client";

import { useState } from "react";
import type { Subscription } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import Button from "@/components/ui/Button";

interface ManageSubscriptionProps {
  subscription: Subscription;
}

export default function ManageSubscription({ subscription }: ManageSubscriptionProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isActive = subscription.status === "active";
  const isCanceled = subscription.status === "canceled";
  const isPendingCancel = isActive && subscription.cancel_at_period_end;

  async function handleCancel() {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.common.error);
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
      setConfirmCancel(false);
    }
  }

  async function handleReactivate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/reactivate-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.common.error);
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleResubscribe() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.subscription.cannotCreateSession);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-danger-500 text-sm text-center">{error}</p>
      )}

      {isActive && !isPendingCancel && (
        <>
          {confirmCancel ? (
            <div className="space-y-3">
              <p className="text-sm text-surface-300 text-center">
                {t.subscription.cancelConfirmMessage}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setConfirmCancel(false)}
                  disabled={loading}
                >
                  {t.subscription.keepSubscription}
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  loading={loading}
                  onClick={handleCancel}
                >
                  {t.subscription.confirmCancellation}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              fullWidth
              onClick={handleCancel}
            >
              {t.subscription.cancelSubscription}
            </Button>
          )}
        </>
      )}

      {isPendingCancel && (
        <Button
          variant="primary"
          fullWidth
          loading={loading}
          onClick={handleReactivate}
        >
          {t.subscription.reactivateSubscription}
        </Button>
      )}

      {isCanceled && (
        <Button
          variant="primary"
          fullWidth
          loading={loading}
          onClick={handleResubscribe}
        >
          {t.subscription.resubscribe}
        </Button>
      )}
    </div>
  );
}
