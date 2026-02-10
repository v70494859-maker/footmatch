import type { MatchWithOperator } from "@/types";
import MatchCard from "@/components/match/MatchCard";

interface MatchListProps {
  matches: MatchWithOperator[];
}

export default function MatchList({ matches }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="bg-surface-900 rounded-2xl border border-surface-800 p-8 text-center">
        <svg
          className="w-10 h-10 mx-auto text-surface-700 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
        <p className="text-sm text-surface-400">No matches found</p>
        <p className="text-xs text-surface-500 mt-1">
          Try adjusting your filters or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
