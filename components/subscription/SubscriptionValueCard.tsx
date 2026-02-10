"use client";

import { SUBSCRIPTION_PRICE, SUBSCRIPTION_CURRENCY } from "@/lib/constants";
import { formatPrice, formatDate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface SubscriptionValueCardProps {
  matchesPlayed: number;
  periodStart: string;
  periodEnd: string;
  memberSinceDays: number;
}

export default function SubscriptionValueCard({
  matchesPlayed,
  periodStart,
  periodEnd,
  memberSinceDays,
}: SubscriptionValueCardProps) {
  const { t } = useTranslation();
  const costPerMatch =
    matchesPlayed > 0 ? SUBSCRIPTION_PRICE / matchesPlayed : 0;
  const avgIndoorPrice = 10;
  const savings =
    matchesPlayed > 0
      ? avgIndoorPrice * matchesPlayed - SUBSCRIPTION_PRICE
      : 0;

  // Membership label
  const memberLabel =
    memberSinceDays < 30
      ? `${memberSinceDays} ${memberSinceDays === 1 ? t.subscription.memberDay.toLowerCase() : t.subscription.memberDays.toLowerCase()}`
      : `${Math.floor(memberSinceDays / 30)} ${t.common.months}`;

  // Cost comparison bar width (your cost as % of indoor)
  const costBarPercent =
    matchesPlayed > 0
      ? Math.max(Math.round((costPerMatch / avgIndoorPrice) * 100), 5)
      : 100;

  return (
    <div className="rounded-2xl border border-surface-800 bg-surface-900 p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">
          {t.subscription.yourSubscription}
        </h3>
        <span className="text-[10px] font-semibold bg-pitch-500/15 text-pitch-400 rounded-full px-2.5 py-0.5">
          {t.subscription.memberSince} {memberLabel}
        </span>
      </div>
      <p className="text-xs text-surface-500 mb-5">
        {formatDate(periodStart)} — {formatDate(periodEnd)}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Matches played */}
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{matchesPlayed}</p>
          <p className="text-xs text-surface-400 mt-0.5">
            {t.subscription.matchesPlayed.toLowerCase()}
          </p>
        </div>

        {/* Cost per match */}
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">
            {matchesPlayed > 0
              ? formatPrice(costPerMatch, SUBSCRIPTION_CURRENCY)
              : "—"}
          </p>
          <p className="text-xs text-surface-400 mt-0.5">{t.subscription.costPerMatch.toLowerCase()}</p>
        </div>
      </div>

      {/* Cost comparison bar */}
      {matchesPlayed > 0 && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-pitch-400 font-semibold">
              {t.subscription.yourCost} : {formatPrice(costPerMatch, SUBSCRIPTION_CURRENCY)}
            </span>
            <span className="text-surface-500">
              {t.subscription.indoorAvg} : ~{avgIndoorPrice} EUR
            </span>
          </div>
          <div className="relative w-full h-2 bg-surface-800 rounded-full overflow-hidden">
            {/* Indoor ref (full bar, muted) */}
            <div className="absolute inset-0 bg-surface-700 rounded-full" />
            {/* Your cost (shorter bar, green) */}
            <div
              className="absolute inset-y-0 left-0 bg-pitch-400 rounded-full transition-all duration-500"
              style={{ width: `${costBarPercent}%` }}
            />
          </div>
        </div>
      )}

      {matchesPlayed > 0 && savings > 0 && (
        <div className="rounded-xl bg-pitch-500/10 px-4 py-3 text-center">
          <p className="text-sm text-pitch-400 font-medium">
            {t.subscription.youSave}{" "}
            <span className="font-bold">
              ~{formatPrice(savings, SUBSCRIPTION_CURRENCY)}
            </span>{" "}
            {t.common.thisMonth.toLowerCase()}
          </p>
        </div>
      )}

      {matchesPlayed === 0 && (
        <p className="text-xs text-surface-500 text-center">
          {t.subscription.playFirstMatch}
        </p>
      )}
    </div>
  );
}
