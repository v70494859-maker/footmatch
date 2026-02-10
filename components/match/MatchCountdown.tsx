"use client";

import { useState, useEffect } from "react";

interface MatchCountdownProps {
  matchDate: string;
  matchTime: string;
}

export default function MatchCountdown({
  matchDate,
  matchTime,
}: MatchCountdownProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const time = matchTime.length === 5 ? `${matchTime}:00` : matchTime;
  const target = new Date(`${matchDate}T${time}`);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0 || diff > 24 * 60 * 60 * 1000) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  const isUrgent = diff <= 60 * 60 * 1000;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isUrgent ? "bg-amber-400" : "bg-pitch-400"
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
            isUrgent ? "bg-amber-400" : "bg-pitch-400"
          }`}
        />
      </span>
      <span
        className={`text-[10px] font-semibold uppercase tracking-wide ${
          isUrgent ? "text-amber-400/80" : "text-pitch-400/80"
        }`}
      >
        Coup d&apos;envoi
      </span>
      <span
        className="font-mono text-xs font-bold tracking-[0.12em]"
        style={{
          fontVariantNumeric: "tabular-nums",
          color: isUrgent ? "#fbbf24" : "#4ade80",
          textShadow: isUrgent
            ? "0 0 6px rgba(251, 191, 36, 0.5), 0 0 12px rgba(251, 191, 36, 0.2)"
            : "0 0 6px rgba(74, 222, 128, 0.5), 0 0 12px rgba(74, 222, 128, 0.2)",
        }}
      >
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </span>
  );
}
