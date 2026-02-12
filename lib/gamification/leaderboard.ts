import type { SupabaseClient } from "@supabase/supabase-js";

export type LeaderboardPeriod = "weekly" | "monthly" | "all_time";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  city: string | null;
  xp: number;
  level: number;
  levelName: string;
  badgeCount: number;
}

// ─── Get Leaderboard ────────────────────────────────────
export async function getLeaderboard(
  sc: SupabaseClient,
  period: LeaderboardPeriod,
  city?: string,
  limit = 50
): Promise<LeaderboardEntry[]> {
  if (period === "all_time") {
    return getAllTimeLeaderboard(sc, city, limit);
  }
  return getPeriodLeaderboard(sc, period, city, limit);
}

// ─── All-time: direct from player_gamification ──────────
async function getAllTimeLeaderboard(
  sc: SupabaseClient,
  city?: string,
  limit = 50
): Promise<LeaderboardEntry[]> {
  let query = sc
    .from("player_gamification")
    .select(
      `
      user_id,
      total_xp,
      level,
      level_name,
      profiles!inner (
        first_name,
        last_name,
        avatar_url,
        city,
        role
      )
    `
    )
    .eq("profiles.role", "player")
    .gt("total_xp", 0)
    .order("total_xp", { ascending: false })
    .limit(limit);

  if (city) {
    query = query.eq("profiles.city", city);
  }

  const { data } = await query;
  if (!data) return [];

  // Get badge counts for all users
  const userIds = data.map((d: Record<string, unknown>) => d.user_id as string);
  const { data: badgeCounts } = await sc
    .from("user_badges")
    .select("user_id")
    .in("user_id", userIds);

  const countMap = new Map<string, number>();
  for (const b of badgeCounts ?? []) {
    countMap.set(b.user_id, (countMap.get(b.user_id) ?? 0) + 1);
  }

  return data.map((d: Record<string, unknown>, i: number) => {
    const profile = d.profiles as Record<string, unknown>;
    return {
      rank: i + 1,
      userId: d.user_id as string,
      firstName: profile.first_name as string,
      lastName: profile.last_name as string,
      avatarUrl: (profile.avatar_url as string) ?? null,
      city: (profile.city as string) ?? null,
      xp: d.total_xp as number,
      level: d.level as number,
      levelName: d.level_name as string,
      badgeCount: countMap.get(d.user_id as string) ?? 0,
    };
  });
}

// ─── Period: aggregate from xp_transactions ─────────────
async function getPeriodLeaderboard(
  sc: SupabaseClient,
  period: "weekly" | "monthly",
  city?: string,
  limit = 50
): Promise<LeaderboardEntry[]> {
  const periodStart = getPeriodStart(period);

  // Get XP aggregated per user for this period
  const { data: txns } = await sc
    .from("xp_transactions")
    .select("user_id, xp_amount")
    .gte("created_at", periodStart.toISOString());

  if (!txns || txns.length === 0) return [];

  // Aggregate XP by user
  const xpMap = new Map<string, number>();
  for (const t of txns) {
    xpMap.set(t.user_id, (xpMap.get(t.user_id) ?? 0) + t.xp_amount);
  }

  // Sort by XP desc and take top N
  const sorted = Array.from(xpMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const userIds = sorted.map(([id]) => id);
  if (userIds.length === 0) return [];

  // Fetch profiles + gamification data
  const [profilesRes, gamRes, badgesRes] = await Promise.all([
    sc
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, city, role")
      .in("id", userIds)
      .eq("role", "player"),
    sc
      .from("player_gamification")
      .select("user_id, level, level_name")
      .in("user_id", userIds),
    sc.from("user_badges").select("user_id").in("user_id", userIds),
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p])
  );
  const gamMap = new Map(
    (gamRes.data ?? []).map((g) => [g.user_id, g])
  );
  const badgeCountMap = new Map<string, number>();
  for (const b of badgesRes.data ?? []) {
    badgeCountMap.set(b.user_id, (badgeCountMap.get(b.user_id) ?? 0) + 1);
  }

  const results: LeaderboardEntry[] = [];
  let rank = 0;

  for (const [userId, xp] of sorted) {
    const profile = profileMap.get(userId);
    if (!profile) continue; // skip non-player or missing
    if (city && profile.city !== city) continue;

    rank++;
    const gam = gamMap.get(userId);

    results.push({
      rank,
      userId,
      firstName: profile.first_name,
      lastName: profile.last_name,
      avatarUrl: profile.avatar_url,
      city: profile.city,
      xp,
      level: gam?.level ?? 1,
      levelName: gam?.level_name ?? "Débutant",
      badgeCount: badgeCountMap.get(userId) ?? 0,
    });
  }

  return results;
}

// ─── Get player's rank + neighbors ──────────────────────
export async function getPlayerRank(
  sc: SupabaseClient,
  userId: string,
  period: LeaderboardPeriod,
  city?: string
): Promise<{ rank: number; total: number } | null> {
  const leaderboard = await getLeaderboard(sc, period, city, 1000);
  const idx = leaderboard.findIndex((e) => e.userId === userId);

  if (idx < 0) return null;

  return {
    rank: leaderboard[idx].rank,
    total: leaderboard.length,
  };
}

// ─── Helpers ────────────────────────────────────────────
function getPeriodStart(period: "weekly" | "monthly"): Date {
  const now = new Date();
  if (period === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
  // Monthly: first day of current month
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
