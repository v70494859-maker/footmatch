import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  PlayerCareerStats,
  Match,
  MatchRegistrationWithMatch,
  MatchResult,
  MatchPlayerStats,
} from "@/types";
import ProfileView from "@/components/profile/ProfileView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FootMatch - Mon profil",
  description: "Votre profil FootMatch",
};

export default async function ProfilePage() {
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

  const today = new Date().toISOString().split("T")[0];

  // Batch 1: all independent queries
  const [
    careerStatsRes,
    rawStatsRes,
    subscriptionRes,
    upcomingRegsRes,
    totalRegsRes,
    chatCountRes,
    terrainRegsRes,
    recentCompletedRes,
  ] = await Promise.all([
    // Career stats
    supabase
      .from("player_career_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),

    // Recent form (last 5 match results for W/D/L display)
    supabase
      .from("match_player_stats")
      .select(
        "team, match:matches(id), match_result:match_results(score_team_a, score_team_b)"
      )
      .eq("user_id", user.id)
      .eq("attended", true)
      .order("match_id", { ascending: false })
      .limit(5),

    // Subscription
    supabase
      .from("subscriptions")
      .select("status, current_period_end, created_at")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Registered match IDs (for upcoming matches)
    supabase
      .from("match_registrations")
      .select("match_id")
      .eq("player_id", user.id)
      .eq("status", "confirmed"),

    // Total all-time registrations count
    supabase
      .from("match_registrations")
      .select("id", { count: "exact", head: true })
      .eq("player_id", user.id)
      .eq("status", "confirmed"),

    // Chat messages sent count
    supabase
      .from("match_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id),

    // Terrain type distribution
    supabase
      .from("match_registrations")
      .select("match:matches!inner(terrain_type)")
      .eq("player_id", user.id)
      .eq("status", "confirmed"),

    // Recent completed match registrations (for activity feed)
    supabase
      .from("match_registrations")
      .select("*, match:matches!inner(*)")
      .eq("player_id", user.id)
      .eq("status", "confirmed")
      .eq("match.status", "completed")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const careerStats = careerStatsRes.data as PlayerCareerStats | null;

  // Process recent form
  const recentForm = (rawStatsRes.data ?? [])
    .filter((s) => s.match && s.team)
    .map((s) => {
      const result = Array.isArray(s.match_result)
        ? s.match_result[0]
        : s.match_result;
      if (!result) return null;
      const won =
        s.team === "A"
          ? result.score_team_a > result.score_team_b
          : result.score_team_b > result.score_team_a;
      const draw = result.score_team_a === result.score_team_b;
      return won ? ("V" as const) : draw ? ("N" as const) : ("D" as const);
    })
    .filter((r): r is "V" | "N" | "D" => r !== null);

  const subscription = subscriptionRes.data;
  const totalRegistrations = totalRegsRes.count ?? 0;
  const chatMessagesSent = chatCountRes.count ?? 0;

  // Terrain counts
  const terrainCounts = { indoor: 0, outdoor: 0, covered: 0 };
  for (const reg of (terrainRegsRes.data ?? []) as unknown as {
    match: { terrain_type: string };
  }[]) {
    const tt = reg.match?.terrain_type;
    if (tt === "indoor" || tt === "outdoor" || tt === "covered") {
      terrainCounts[tt]++;
    }
  }

  // Recent completed matches
  const recentCompleted = (
    (recentCompletedRes.data ?? []) as MatchRegistrationWithMatch[]
  ).filter((r) => r.match !== null);
  const recentMatchIds = recentCompleted.map((r) => r.match.id);

  // All registered match IDs for upcoming lookup
  const allRegMatchIds = (upcomingRegsRes.data ?? []).map(
    (r) => r.match_id as string
  );

  // Batch 2: queries that depend on batch 1 IDs
  const [upcomingMatchesRes, chatForUpcomingRes, recentResultsRes, recentStatsRes] =
    await Promise.all([
      // Upcoming matches (limit 3)
      allRegMatchIds.length > 0
        ? supabase
            .from("matches")
            .select("*")
            .in("id", allRegMatchIds)
            .gte("date", today)
            .in("status", ["upcoming", "full"])
            .order("date", { ascending: true })
            .order("start_time", { ascending: true })
            .limit(3)
        : Promise.resolve({ data: [] }),

      // Chat counts for upcoming matches
      allRegMatchIds.length > 0
        ? supabase
            .from("match_messages")
            .select("match_id")
            .in("match_id", allRegMatchIds)
        : Promise.resolve({ data: [] }),

      // Results for recent completed
      recentMatchIds.length > 0
        ? supabase
            .from("match_results")
            .select("*")
            .in("match_id", recentMatchIds)
        : Promise.resolve({ data: [] }),

      // Player stats for recent completed
      recentMatchIds.length > 0
        ? supabase
            .from("match_player_stats")
            .select("*")
            .eq("user_id", user.id)
            .in("match_id", recentMatchIds)
        : Promise.resolve({ data: [] }),
    ]);

  const upcomingMatches = (upcomingMatchesRes.data as Match[]) ?? [];

  // Chat counts map
  const chatCountsMap: Record<string, number> = {};
  for (const msg of (chatForUpcomingRes.data ?? []) as {
    match_id: string;
  }[]) {
    chatCountsMap[msg.match_id] = (chatCountsMap[msg.match_id] ?? 0) + 1;
  }

  // Results map
  const resultsMap: Record<string, MatchResult> = {};
  for (const r of (recentResultsRes.data ?? []) as MatchResult[]) {
    resultsMap[r.match_id] = r;
  }

  // Player stats map
  const playerStatsMap: Record<string, MatchPlayerStats> = {};
  for (const s of (recentStatsRes.data ?? []) as MatchPlayerStats[]) {
    playerStatsMap[s.match_id] = s;
  }

  // Build recent activity
  const recentActivity = recentCompleted.map((reg) => {
    const match = reg.match;
    const result = resultsMap[match.id];
    const pStats = playerStatsMap[match.id];

    let badge: "V" | "N" | "D" | null = null;
    if (result && pStats?.team) {
      const myScore =
        pStats.team === "A" ? result.score_team_a : result.score_team_b;
      const otherScore =
        pStats.team === "A" ? result.score_team_b : result.score_team_a;
      badge = myScore > otherScore ? "V" : myScore < otherScore ? "D" : "N";
    }

    return {
      matchId: match.id,
      title: match.title,
      date: match.date,
      terrainType: match.terrain_type,
      scoreA: result?.score_team_a ?? null,
      scoreB: result?.score_team_b ?? null,
      badge,
      goals: pStats?.goals ?? 0,
      assists: pStats?.assists ?? 0,
      mvp: pStats?.mvp ?? false,
    };
  });

  // Build upcoming match list
  const upcomingMatchList = upcomingMatches.map((m) => ({
    id: m.id,
    title: m.title,
    date: m.date,
    startTime: m.start_time,
    venueName: m.venue_name,
    city: m.city,
    terrainType: m.terrain_type,
    registeredCount: m.registered_count,
    capacity: m.capacity,
    chatCount: chatCountsMap[m.id] ?? 0,
  }));

  // Member since days
  const memberSinceDays = Math.max(
    1,
    Math.floor(
      (new Date().getTime() - new Date(profile.created_at).getTime()) / 86400000
    )
  );

  // Current streak
  let currentStreak: { type: "V" | "N" | "D"; count: number } | null = null;
  if (recentForm.length > 0) {
    const streakType = recentForm[0];
    let count = 0;
    for (const r of recentForm) {
      if (r === streakType) count++;
      else break;
    }
    if (count >= 2) {
      currentStreak = { type: streakType, count };
    }
  }

  return (
    <ProfileView
      profile={profile as Profile}
      careerStats={careerStats}
      recentForm={recentForm}
      playerExtra={{
        upcomingMatches: upcomingMatches.length,
        subscriptionStatus: subscription?.status ?? null,
        subscriptionEnd: subscription?.current_period_end ?? null,
        memberSince: profile.created_at,
        memberSinceDays,
        totalRegistrations,
        chatMessagesSent,
        terrainCounts,
        recentActivity,
        upcomingMatchList,
        currentStreak,
      }}
    />
  );
}
