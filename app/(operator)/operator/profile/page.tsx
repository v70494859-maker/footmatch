import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Operator, Match } from "@/types";
import OperatorProfileClient from "@/components/operator/OperatorProfileClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FootMatch Opérateur - Profil",
  description: "Votre profil opérateur",
};

export default async function OperatorProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const { data: operator } = await supabase
    .from("operators")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (!operator) redirect("/matches");

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: completedMatches },
    { count: canceledMatches },
    { data: upcomingMatchesList },
    { data: allOperatorMatches },
    { data: payouts },
    { data: recentCompleted },
    { data: playerRatings },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("operator_id", operator.id)
      .eq("status", "completed"),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("operator_id", operator.id)
      .eq("status", "canceled"),
    supabase
      .from("matches")
      .select("*")
      .eq("operator_id", operator.id)
      .in("status", ["upcoming", "full"])
      .gte("date", today)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(3),
    supabase
      .from("matches")
      .select("registered_count, capacity, terrain_type")
      .eq("operator_id", operator.id),
    supabase
      .from("operator_payouts")
      .select("net_amount")
      .eq("operator_id", operator.id)
      .eq("status", "completed"),
    supabase
      .from("matches")
      .select("*, match_results(*)")
      .eq("operator_id", operator.id)
      .eq("status", "completed")
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("match_player_stats")
      .select("rating, match:matches!inner(operator_id)")
      .eq("match.operator_id", operator.id)
      .not("rating", "is", null),
  ]);

  // Computed stats
  const allMatches = allOperatorMatches ?? [];
  const totalRegistrations = allMatches.reduce((sum, m) => sum + m.registered_count, 0);
  const avgFillRate =
    allMatches.length > 0
      ? allMatches.reduce(
          (sum, m) => sum + (m.capacity > 0 ? m.registered_count / m.capacity : 0),
          0
        ) / allMatches.length
      : 0;

  const totalRevenue = (payouts ?? []).reduce(
    (sum, p) => sum + (p.net_amount ?? 0),
    0
  );

  const completed = completedMatches ?? 0;
  const canceled = canceledMatches ?? 0;
  const reliabilityTotal = completed + canceled;
  const reliability = reliabilityTotal > 0 ? Math.round((completed / reliabilityTotal) * 100) : 100;
  const avgPlayersPerMatch = completed > 0 ? Number((totalRegistrations / completed).toFixed(1)) : 0;

  const ratings = (playerRatings ?? []).map((r) => r.rating as number);
  const totalRatings = ratings.length;
  const avgPlayerRating = totalRatings > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / totalRatings
    : 0;

  // Terrain distribution
  const terrainCounts = { indoor: 0, outdoor: 0, covered: 0 };
  for (const m of allMatches) {
    const t = m.terrain_type as keyof typeof terrainCounts;
    if (t in terrainCounts) terrainCounts[t]++;
  }

  return (
    <OperatorProfileClient
      profile={profile as Profile}
      operator={operator as Operator}
      stats={{
        completedMatches: completed,
        canceledMatches: canceled,
        totalRegistrations,
        fillRate: Math.round(avgFillRate * 100),
        totalRevenue,
        reliability,
        avgPlayersPerMatch,
        avgPlayerRating,
        totalRatings,
        terrainCounts,
      }}
      upcomingMatches={(upcomingMatchesList ?? []) as Match[]}
      recentMatches={(recentCompleted ?? []) as (Match & { match_results: unknown })[]}
    />
  );
}
