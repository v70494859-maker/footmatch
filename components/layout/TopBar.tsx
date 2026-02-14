"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function TopBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const pageTitle = getPageTitle(pathname, t);

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800 px-4 py-3">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <Logo variant="full" />
        {pageTitle && (
          <span className="text-sm font-medium text-surface-400 truncate ml-3">
            {pageTitle}
          </span>
        )}
        <Link
          href="/profile"
          className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
          aria-label="Profile"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

function getPageTitle(pathname: string, t: ReturnType<typeof useTranslation>["t"]): string | null {
  if (pathname.startsWith("/matches")) return t.nav.matches;
  if (pathname.startsWith("/my-matches")) return t.nav.myMatches;
  if (pathname.startsWith("/subscription")) return t.nav.subscription;
  if (pathname.startsWith("/social")) return t.nav.social;
  if (pathname.startsWith("/profile")) return t.nav.profile;
  if (pathname.startsWith("/operator/payouts")) return t.nav.payments;
  if (pathname.startsWith("/operator/matches")) return t.nav.matches;
  if (pathname === "/operator") return t.nav.dashboard;
  return null;
}
