import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard, getPlayerRank } from "@/lib/gamification/leaderboard";
import type { LeaderboardPeriod } from "@/lib/gamification/leaderboard";
import LeaderboardView from "@/components/gamification/LeaderboardView";

export const dynamic = "force-dynamic";
export const metadata = { title: "FootMatch - Classement" };

const VALID_PERIODS: LeaderboardPeriod[] = ["weekly", "monthly", "all_time"];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; city?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Validate period
  const rawPeriod = params.period ?? "weekly";
  const period: LeaderboardPeriod = VALID_PERIODS.includes(
    rawPeriod as LeaderboardPeriod
  )
    ? (rawPeriod as LeaderboardPeriod)
    : "weekly";

  const city = params.city || undefined;

  // Parallel data fetching
  const [entries, playerRank, citiesRes] = await Promise.all([
    getLeaderboard(supabase, period, city),
    getPlayerRank(supabase, user.id, period, city),
    supabase
      .from("profiles")
      .select("city")
      .eq("role", "player")
      .not("city", "is", null)
      .order("city"),
  ]);

  // Extract distinct cities
  const cities = Array.from(
    new Set(
      (citiesRes.data ?? [])
        .map((p) => p.city as string)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <LeaderboardView
      entries={entries}
      currentUserId={user.id}
      currentUserRank={playerRank}
      period={period}
      cities={cities}
    />
  );
}
