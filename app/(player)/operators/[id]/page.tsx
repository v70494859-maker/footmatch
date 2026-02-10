import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OperatorWithProfile, Match } from "@/types";
import OperatorProfileView from "@/components/operator/OperatorProfileView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: operator } = await supabase
    .from("operators")
    .select("profile:profiles(first_name, last_name)")
    .eq("id", id)
    .single();

  const raw = operator?.profile;
  const p = Array.isArray(raw) ? raw[0] : raw;
  if (!p) {
    return { title: "Organisateur introuvable - FootMatch" };
  }

  return {
    title: `${p.first_name} ${p.last_name} - Organisateur FootMatch`,
    description: `Profil organisateur de ${p.first_name} ${p.last_name} sur FootMatch`,
  };
}

export default async function OperatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: operator } = await supabase
    .from("operators")
    .select("*, profile:profiles(*)")
    .eq("id", id)
    .single();

  if (!operator?.profile) notFound();

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: completedCount },
    { count: canceledCount },
    { data: allMatchRows },
    { data: upcomingMatchesList },
    { data: recentCompleted },
    { data: playerRatings },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("operator_id", id)
      .eq("status", "completed"),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("operator_id", id)
      .eq("status", "canceled"),
    supabase
      .from("matches")
      .select("registered_count, capacity, terrain_type")
      .eq("operator_id", id),
    supabase
      .from("matches")
      .select("*")
      .eq("operator_id", id)
      .in("status", ["upcoming", "full"])
      .gte("date", today)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("matches")
      .select("*, match_results(*)")
      .eq("operator_id", id)
      .eq("status", "completed")
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("match_player_stats")
      .select("rating, match:matches!inner(operator_id)")
      .eq("match.operator_id", id)
      .not("rating", "is", null),
  ]);

  const allMatches = allMatchRows ?? [];
  const totalParticipants = allMatches.reduce((sum, m) => sum + m.registered_count, 0);
  const completed = completedCount ?? 0;
  const canceled = canceledCount ?? 0;

  const avgFillRate =
    allMatches.length > 0
      ? allMatches.reduce(
          (sum, m) => sum + (m.capacity > 0 ? m.registered_count / m.capacity : 0),
          0
        ) / allMatches.length
      : 0;

  const reliabilityTotal = completed + canceled;
  const reliability = reliabilityTotal > 0 ? Math.round((completed / reliabilityTotal) * 100) : 100;

  const ratings = (playerRatings ?? []).map((r) => r.rating as number);
  const totalRatings = ratings.length;
  const avgPlayerRating = totalRatings > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / totalRatings
    : 0;

  const terrainCounts = { indoor: 0, outdoor: 0, covered: 0 };
  for (const m of allMatches) {
    const t = m.terrain_type as keyof typeof terrainCounts;
    if (t in terrainCounts) terrainCounts[t]++;
  }

  return (
    <OperatorProfileView
      operator={operator as OperatorWithProfile}
      stats={{
        completedMatches: completed,
        canceledMatches: canceled,
        totalParticipants,
        fillRate: Math.round(avgFillRate * 100),
        reliability,
        avgPlayerRating,
        totalRatings,
        avgPlayersPerMatch: completed > 0 ? Number((totalParticipants / completed).toFixed(1)) : 0,
        terrainCounts,
      }}
      upcomingMatches={(upcomingMatchesList ?? []) as Match[]}
      recentMatches={(recentCompleted ?? []) as (Match & { match_results: unknown })[]}
    />
  );
}
