"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface ChatHeaderProps {
  matchId: string;
  matchTitle: string;
  participantCount: number;
}

export default function ChatHeader({
  matchId,
  matchTitle,
  participantCount,
}: ChatHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-surface-800 px-4 py-3">
      <div className="flex items-center gap-3">
        <Link
          href={`/matches/${matchId}`}
          className="text-surface-400 hover:text-foreground transition-colors shrink-0"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold text-foreground truncate">
            {matchTitle}
          </h1>
          <p className="text-xs text-surface-500">
            {participantCount} {participantCount !== 1 ? t.matchDetail.participants : t.matchDetail.participant}
          </p>
        </div>
      </div>
    </div>
  );
}
