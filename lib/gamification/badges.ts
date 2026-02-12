import type { SupabaseClient } from "@supabase/supabase-js";
import type { BadgeCategory, BadgeTier } from "@/types";
import { XP_SOURCES } from "./constants";

// ─── Badge Definition ───────────────────────────────────
export interface BadgeDefinition {
  id: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string;
  target: number;
  getValue: (ctx: BadgeContext) => number;
}

interface BadgeContext {
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  totalMvp: number;
  attendanceRate: number;
  currentStreak: number;
  bestStreak: number;
  citiesPlayed: number;
  // Computed from queries
  matchesInOneDay: number;
  distinctOperators: number;
}

// ─── Badge Definitions ──────────────────────────────────
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ─── Volume ─────────────────
  { id: "joueur_bronze", category: "volume", tier: "bronze", icon: "⚽", target: 10, getValue: (c) => c.totalMatches },
  { id: "joueur_silver", category: "volume", tier: "silver", icon: "⚽", target: 50, getValue: (c) => c.totalMatches },
  { id: "joueur_gold", category: "volume", tier: "gold", icon: "⚽", target: 100, getValue: (c) => c.totalMatches },
  { id: "marathonien_bronze", category: "volume", tier: "bronze", icon: "🏃", target: 2, getValue: (c) => c.matchesInOneDay },
  { id: "marathonien_silver", category: "volume", tier: "silver", icon: "🏃", target: 3, getValue: (c) => c.matchesInOneDay },
  { id: "marathonien_gold", category: "volume", tier: "gold", icon: "🏃", target: 4, getValue: (c) => c.matchesInOneDay },
  { id: "abitudinaire_bronze", category: "volume", tier: "bronze", icon: "📅", target: 4, getValue: (c) => c.bestStreak },
  { id: "abitudinaire_silver", category: "volume", tier: "silver", icon: "📅", target: 12, getValue: (c) => c.bestStreak },
  { id: "abitudinaire_gold", category: "volume", tier: "gold", icon: "📅", target: 26, getValue: (c) => c.bestStreak },

  // ─── Exploration ────────────
  { id: "explorateur_bronze", category: "exploration", tier: "bronze", icon: "🌍", target: 2, getValue: (c) => c.citiesPlayed },
  { id: "explorateur_silver", category: "exploration", tier: "silver", icon: "🌍", target: 5, getValue: (c) => c.citiesPlayed },
  { id: "explorateur_gold", category: "exploration", tier: "gold", icon: "🌍", target: 10, getValue: (c) => c.citiesPlayed },

  // ─── Social ─────────────────
  { id: "operateur_fan_bronze", category: "social", tier: "bronze", icon: "🤝", target: 10, getValue: (c) => c.distinctOperators },
  { id: "operateur_fan_silver", category: "social", tier: "silver", icon: "🤝", target: 25, getValue: (c) => c.distinctOperators },

  // ─── Reliability ────────────
  { id: "fiable_bronze", category: "reliability", tier: "bronze", icon: "✅", target: 85, getValue: (c) => Math.round(c.attendanceRate * 100) },
  { id: "fiable_silver", category: "reliability", tier: "silver", icon: "✅", target: 90, getValue: (c) => Math.round(c.attendanceRate * 100) },
  { id: "fiable_gold", category: "reliability", tier: "gold", icon: "✅", target: 95, getValue: (c) => Math.round(c.attendanceRate * 100) },

  // ─── Special ────────────────
  { id: "special_first_match", category: "special", tier: "gold", icon: "🎉", target: 1, getValue: (c) => c.totalMatches },
  { id: "special_mvp_bronze", category: "special", tier: "bronze", icon: "⭐", target: 1, getValue: (c) => c.totalMvp },
  { id: "special_mvp_silver", category: "special", tier: "silver", icon: "⭐", target: 5, getValue: (c) => c.totalMvp },
  { id: "special_mvp_gold", category: "special", tier: "gold", icon: "⭐", target: 10, getValue: (c) => c.totalMvp },
  { id: "special_buteur_bronze", category: "special", tier: "bronze", icon: "🎯", target: 10, getValue: (c) => c.totalGoals },
  { id: "special_buteur_silver", category: "special", tier: "silver", icon: "🎯", target: 25, getValue: (c) => c.totalGoals },
  { id: "special_buteur_gold", category: "special", tier: "gold", icon: "🎯", target: 50, getValue: (c) => c.totalGoals },
];

// ─── Check & Unlock Badges ──────────────────────────────
export async function checkBadges(
  sc: SupabaseClient,
  userId: string,
  matchId?: string
): Promise<string[]> {
  // Build context
  const ctx = await buildBadgeContext(sc, userId);

  // Get already unlocked badges
  const { data: unlocked } = await sc
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const unlockedIds = new Set((unlocked ?? []).map((b) => b.badge_id));
  const newlyUnlocked: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (unlockedIds.has(badge.id)) continue;

    const current = badge.getValue(ctx);

    // Update progress
    await sc
      .from("badge_progress")
      .upsert(
        {
          user_id: userId,
          badge_id: badge.id,
          current: Math.min(current, badge.target),
          target: badge.target,
        },
        { onConflict: "user_id,badge_id" }
      );

    // Check if badge unlocked
    if (current >= badge.target) {
      await sc.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
        category: badge.category,
        tier: badge.tier,
      });

      newlyUnlocked.push(badge.id);

      // Notification
      await sc.from("notifications").insert({
        user_id: userId,
        type: "badge_unlocked",
        title: "Nouveau badge débloqué !",
        body: `Tu as obtenu le badge ${badge.icon} (${badge.tier}). +${XP_SOURCES.BADGE_UNLOCK.amount} XP !`,
        data: { badge_id: badge.id, match_id: matchId ?? "" },
      });
    }
  }

  // Award XP for each new badge (after the loop to avoid badge_unlock triggering more badge checks)
  for (const badgeId of newlyUnlocked) {
    // Direct XP insert without re-triggering badge check
    const { data: gam } = await sc
      .from("player_gamification")
      .select("total_xp, xp_today, xp_today_date")
      .eq("user_id", userId)
      .single();

    if (gam) {
      const todayStr = new Date().toISOString().split("T")[0];
      const xpToday = gam.xp_today_date === todayStr ? gam.xp_today : 0;
      const remaining = Math.max(0, 500 - xpToday);
      const xp = Math.min(XP_SOURCES.BADGE_UNLOCK.amount, remaining);

      if (xp > 0) {
        await sc.from("xp_transactions").insert({
          user_id: userId,
          source: XP_SOURCES.BADGE_UNLOCK.key,
          xp_amount: xp,
          metadata: { badge_id: badgeId },
        });

        const { level, levelName } = await import("./constants").then((m) =>
          m.computeLevel(gam.total_xp + xp)
        );

        await sc
          .from("player_gamification")
          .update({
            total_xp: gam.total_xp + xp,
            level,
            level_name: levelName,
            xp_today: xpToday + xp,
            xp_today_date: todayStr,
          })
          .eq("user_id", userId);
      }
    }
  }

  return newlyUnlocked;
}

// ─── Build Context ──────────────────────────────────────
async function buildBadgeContext(
  sc: SupabaseClient,
  userId: string
): Promise<BadgeContext> {
  const [careerRes, gamRes, maxMatchesDayRes, distinctOpsRes] =
    await Promise.all([
      sc
        .from("player_career_stats")
        .select("total_matches, total_goals, total_assists, total_mvp, attendance_rate")
        .eq("user_id", userId)
        .maybeSingle(),

      sc
        .from("player_gamification")
        .select("current_streak, best_streak, cities_played")
        .eq("user_id", userId)
        .maybeSingle(),

      // Max matches in a single day (for Marathonien badge)
      sc.rpc("get_max_matches_in_day", { p_user_id: userId }).maybeSingle(),

      // Distinct operators played with
      sc.rpc("get_distinct_operators_count", { p_user_id: userId }).maybeSingle(),
    ]);

  const career = careerRes.data;
  const gam = gamRes.data;

  return {
    totalMatches: career?.total_matches ?? 0,
    totalGoals: career?.total_goals ?? 0,
    totalAssists: career?.total_assists ?? 0,
    totalMvp: career?.total_mvp ?? 0,
    attendanceRate: career?.attendance_rate ?? 0,
    currentStreak: gam?.current_streak ?? 0,
    bestStreak: gam?.best_streak ?? 0,
    citiesPlayed: gam?.cities_played?.length ?? 0,
    matchesInOneDay: (maxMatchesDayRes.data as number) ?? 0,
    distinctOperators: (distinctOpsRes.data as number) ?? 0,
  };
}

// ─── Get badge definitions (for UI) ────────────────────
export function getBadgeDefinitions(): BadgeDefinition[] {
  return BADGE_DEFINITIONS;
}
