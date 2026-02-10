import Link from "next/link";

interface SubscriptionGateProps {
  hasSubscription: boolean;
  children: React.ReactNode;
}

export default function SubscriptionGate({ hasSubscription, children }: SubscriptionGateProps) {
  if (hasSubscription) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-surface-800 bg-surface-900 p-10 text-center">
      <svg
        className="h-12 w-12 text-surface-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        Fonctionnalité Premium
      </h3>
      <p className="text-surface-400 text-sm mb-6 max-w-xs">
        Vous devez avoir un abonnement actif pour accéder à ce contenu. Passez
        au Premium pour débloquer les matchs illimités et plus encore.
      </p>

      <Link
        href="/subscription"
        className="inline-flex items-center justify-center rounded-xl bg-pitch-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-pitch-600 active:bg-pitch-700"
      >
        Passer au Premium
      </Link>
    </div>
  );
}
