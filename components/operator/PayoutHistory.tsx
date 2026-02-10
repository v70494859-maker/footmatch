"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { OperatorPayout, PayoutStatus } from "@/types";
import { PAYOUT_STATUS_LABELS } from "@/types";

function fmtEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface PayoutHistoryProps {
  payouts: OperatorPayout[];
}

const STATUS_STYLES: Record<PayoutStatus, string> = {
  pending: "bg-amber-500/10 text-amber-500",
  processing: "bg-blue-500/10 text-blue-400",
  completed: "bg-pitch-500/10 text-pitch-400",
  failed: "bg-danger-500/10 text-danger-500",
};

function formatPeriod(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("fr-FR", opts)} - ${e.toLocaleDateString("fr-FR", opts)}`;
}

export default function PayoutHistory({ payouts }: PayoutHistoryProps) {
  const { t } = useTranslation();

  if (payouts.length === 0) {
    return (
      <div className="bg-surface-900 rounded-2xl border border-surface-800 p-8 text-center">
        <svg
          className="w-10 h-10 mx-auto text-surface-700 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-surface-400">{t.operator.noPayout}</p>
        <p className="text-xs text-surface-500 mt-1">
          {t.operator.payoutHistory}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-900 rounded-2xl border border-surface-800 overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">
                {t.operator.date}
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">
                {t.operator.totalRegistrations}
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">
                {t.operator.grossAmount}
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">
                {t.operator.platformFee}
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">
                {t.operator.netAmount}
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-surface-800/50 transition-colors">
                <td className="px-4 py-3 text-foreground">
                  {formatPeriod(payout.period_start, payout.period_end)}
                </td>
                <td className="px-4 py-3 text-right text-surface-300">
                  {payout.total_registrations}
                </td>
                <td className="px-4 py-3 text-right text-surface-300">
                  {fmtEur(payout.gross_amount)}
                </td>
                <td className="px-4 py-3 text-right text-surface-400">
                  {fmtEur(payout.platform_fee)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-foreground">
                  {fmtEur(payout.net_amount)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${STATUS_STYLES[payout.status]}`}
                  >
                    {PAYOUT_STATUS_LABELS[payout.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-surface-800">
        {payouts.map((payout) => (
          <div key={payout.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {formatPeriod(payout.period_start, payout.period_end)}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${STATUS_STYLES[payout.status]}`}
              >
                {PAYOUT_STATUS_LABELS[payout.status]}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-surface-500">{t.operator.totalRegistrations}</p>
                <p className="text-surface-300 font-medium">{payout.total_registrations}</p>
              </div>
              <div>
                <p className="text-surface-500">{t.operator.grossAmount}</p>
                <p className="text-surface-300 font-medium">{fmtEur(payout.gross_amount)}</p>
              </div>
              <div>
                <p className="text-surface-500">{t.operator.netAmount}</p>
                <p className="text-foreground font-semibold">{fmtEur(payout.net_amount)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
