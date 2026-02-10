import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  PlayerCareerStats,
  PlayerMatchHistory,
  MatchPlayerStats,
  Match,
  MatchResult,
} from "@/types";
import PlayerProfileView from "@/components/player/PlayerProfileView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", id)
    .single();

  if (!profile) {
    return { title: "Player Not Found - FootMatch" };
  }

  return {
    title: `${profile.first_name} ${profile.last_name} - FootMatch`,
    description: `Player profile for ${profile.first_name} ${profile.last_name}`,
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Viewing own profile → redirect to /profile
  if (user.id === id) redirect("/profile");

  // Fetch target player profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  // Check viewer's role — operators & admins bypass subscription gate
  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let hasSubscription = viewerProfile?.role === "operator" || viewerProfile?.role === "admin";

  if (!hasSubscription) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("player_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    hasSubscription = !!subscription;
  }

  // Fetch career stats for target player
  const { data: careerStats } = await supabase
    .from("player_career_stats")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  // Fetch recent match history (last 10) with results in a single query
  const { data: rawStats } = await supabase
    .from("match_player_stats")
    .select("*, match:matches(*), match_result:match_results(score_team_a, score_team_b, duration_minutes, match_quality, notes, submitted_at, updated_at, id, match_id, operator_id)")
    .eq("user_id", id)
    .eq("attended", true)
    .order("match_id", { ascending: false })
    .limit(10);

  const recentMatches: PlayerMatchHistory[] = (rawStats ?? [])
    .filter((s) => s.match !== null)
    .map((s) => ({
      ...(s as MatchPlayerStats),
      match: s.match as Match,
      match_result: (Array.isArray(s.match_result) ? s.match_result[0] : s.match_result) as MatchResult | null,
    }));

  return (
    <PlayerProfileView
      profile={profile as Profile}
      careerStats={careerStats as PlayerCareerStats | null}
      recentMatches={recentMatches}
      hasSubscription={hasSubscription}
    />
  );
}
