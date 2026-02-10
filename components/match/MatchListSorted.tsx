"use client";

import { useMemo } from "react";
import type { MatchWithOperator } from "@/types";
import MatchCard from "@/components/match/MatchCard";

interface MatchListSortedProps {
  matches: MatchWithOperator[];
  registeredMatchIds?: string[];
  chatCounts?: Record<string, number>;
  distances?: Record<string, number>;
}

export default function MatchListSorted({
  matches,
  registeredMatchIds,
  chatCounts,
  distances,
}: MatchListSortedProps) {
  const registeredSet = useMemo(
    () => new Set(registeredMatchIds ?? []),
    [registeredMatchIds]
  );

  const sorted = useMemo(() => {
    if (!distances || Object.keys(distances).length === 0) return matches;

    return [...matches].sort((a, b) => {
      const distA = distances[a.id] ?? Infinity;
      const distB = distances[b.id] ?? Infinity;

      if (distA !== distB) return distA - distB;

      // Tiebreaker: date + time ascending
      const timeA = `${a.date}T${a.start_time}`;
      const timeB = `${b.date}T${b.start_time}`;
      return timeA.localeCompare(timeB);
    });
  }, [matches, distances]);

  if (sorted.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          distance={distances?.[match.id] ?? null}
          isRegistered={registeredSet.has(match.id)}
          chatCount={chatCounts?.[match.id]}
        />
      ))}
    </div>
  );
}
