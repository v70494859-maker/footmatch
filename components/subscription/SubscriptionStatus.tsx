"use client";

import type { Subscription } from "@/types";
import { SUBSCRIPTION_STATUS_LABELS } from "@/types";
import { formatDate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import ManageSubscription from "./ManageSubscription";

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-pitch-500/20 text-pitch-400",
  past_due: "bg-amber-500/20 text-amber-500",
  canceled: "bg-danger-500/20 text-danger-500",
  incomplete: "bg-surface-600/20 text-surface-400",
  trialing: "bg-pitch-500/20 text-pitch-400",
};

interface SubscriptionStatusProps {
  subscription: Subscription;
}

export default function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  const { t } = useTranslation();
  const badgeClass = STATUS_BADGE_CLASSES[subscription.status] || STATUS_BADGE_CLASSES.incomplete;

  return (
    <div className="rounded-2xl border border-surface-800 bg-surface-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-foreground">
          {t.subscription.yourSubscription}
        </h2>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}>
          {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
        </span>
      </div>

      <div className="space-y-4 mb-6">
        {subscription.current_period_end && (
          <div className="flex justify-between text-sm">
            <span className="text-surface-400">
              {subscription.cancel_at_period_end ? t.subscription.accessUntil : t.subscription.nextBilling}
            </span>
            <span className="text-foreground">
              {formatDate(subscription.current_period_end)}
            </span>
          </div>
        )}

        {subscription.current_period_start && (
          <div className="flex justify-between text-sm">
            <span className="text-surface-400">{t.subscription.memberSince}</span>
            <span className="text-foreground">
              {formatDate(subscription.current_period_start)}
            </span>
          </div>
        )}

        {subscription.cancel_at_period_end && subscription.status === "active" && (
          <p className="text-amber-500 text-sm">
            {t.subscription.cancelNotice}
          </p>
        )}
      </div>

      <ManageSubscription subscription={subscription} />
    </div>
  );
}
