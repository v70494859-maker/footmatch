import Link from "next/link";
import type { ReactNode } from "react";

interface SubscriptionGateProps {
  hasSubscription: boolean;
  children: ReactNode;
}

export default function SubscriptionGate({
  hasSubscription,
  children,
}: SubscriptionGateProps) {
  if (hasSubscription) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-surface-900/90 border border-surface-800 rounded-xl px-6 py-4 text-center max-w-xs">
          <svg
            className="w-8 h-8 mx-auto text-surface-500 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <p className="text-sm font-medium text-foreground mb-1">
            Contenu premium
          </p>
          <p className="text-xs text-surface-400 mb-3">
            Abonne-toi pour voir les stats des joueurs
          </p>
          <Link
            href="/subscription"
            className="inline-flex items-center gap-1.5 bg-pitch-500 hover:bg-pitch-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            S&apos;abonner
          </Link>
        </div>
      </div>
    </div>
  );
}
