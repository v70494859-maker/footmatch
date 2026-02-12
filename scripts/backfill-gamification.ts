/**
 * Backfill script: Initialize player_gamification for all existing players.
 *
 * For each player with career stats:
 *   - total_xp = total_matches * 100 (MATCH_PLAYED XP)
 *   - Level computed from total_xp
 *   - Streak set to 0 (no historical data to compute)
 *   - Cities from their distinct match registrations
 *
 * Also runs badge checks for each player.
 *
 * Usage:
 *   export $(cat .env.local | grep -v '^#' | xargs)
 *   npx tsx scripts/backfill-gamification.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sc = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Level thresholds (mirrored from lib/gamification/constants.ts)
const LEVELS = [
  { level: 1, name: "Débutant", xpCumulative: 0 },
  { level: 2, name: "Joueur du dimanche", xpCumulative: 300 },
  { level: 3, name: "Régulier", xpCumulative: 800 },
  { level: 4, name: "Pilier", xpCumulative: 1_600 },
  { level: 5, name: "Warrior", xpCumulative: 2_800 },
  { level: 6, name: "Vétéran", xpCumulative: 4_600 },
  { level: 7, name: "Titan", xpCumulative: 7_100 },
  { level: 8, name: "Légende", xpCumulative: 10_600 },
  { level: 9, name: "GOAT", xpCumulative: 15_600 },
];

function computeLevel(totalXp: number) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.xpCumulative) current = lvl;
    else break;
  }
  return { level: current.level, levelName: current.name };
}

async function main() {
  console.log("=== Backfill Gamification ===\n");

  // 1. Get all players with career stats
  const { data: players, error: playersError } = await sc
    .from("player_career_stats")
    .select("user_id, total_matches, total_goals, total_assists, total_mvp, attendance_rate");

  if (playersError) {
    console.error("Error fetching players:", playersError.message);
    process.exit(1);
  }

  if (!players || players.length === 0) {
    console.log("No players found with career stats.");
    return;
  }

  console.log(`Found ${players.length} players with career stats.\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const player of players) {
    const userId = player.user_id;
    const totalMatches = player.total_matches ?? 0;

    // Check if already backfilled
    const { data: existing } = await sc
      .from("player_gamification")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    // Calculate XP: 100 XP per match played
    const totalXp = totalMatches * 100;
    const { level, levelName } = computeLevel(totalXp);

    // Get distinct cities played
    const { data: cityData } = await sc
      .from("match_registrations")
      .select("match:matches!inner(city)")
      .eq("player_id", userId)
      .eq("status", "confirmed");

    const cities = Array.from(
      new Set(
        (cityData ?? [])
          .map((r: Record<string, unknown>) => {
            const match = r.match as Record<string, unknown> | null;
            return match?.city as string | undefined;
          })
          .filter(Boolean) as string[]
      )
    );

    // Insert player_gamification
    const { error: insertError } = await sc.from("player_gamification").insert({
      user_id: userId,
      total_xp: totalXp,
      level,
      level_name: levelName,
      current_streak: 0,
      best_streak: 0,
      cities_played: cities,
      xp_today: 0,
      xp_today_date: new Date().toISOString().split("T")[0],
    });

    if (insertError) {
      console.error(`  [ERROR] ${userId}: ${insertError.message}`);
      errors++;
      continue;
    }

    // Insert a single backfill XP transaction
    if (totalXp > 0) {
      await sc.from("xp_transactions").insert({
        user_id: userId,
        source: "backfill",
        xp_amount: totalXp,
        metadata: { reason: "backfill", matches: totalMatches },
      });
    }

    // Initialize badge progress
    const badgeDefinitions = [
      { id: "joueur_bronze", target: 10, current: totalMatches },
      { id: "joueur_silver", target: 50, current: totalMatches },
      { id: "joueur_gold", target: 100, current: totalMatches },
      { id: "explorateur_bronze", target: 2, current: cities.length },
      { id: "explorateur_silver", target: 5, current: cities.length },
      { id: "explorateur_gold", target: 10, current: cities.length },
      { id: "fiable_bronze", target: 85, current: Math.round((player.attendance_rate ?? 0) * 100) },
      { id: "fiable_silver", target: 90, current: Math.round((player.attendance_rate ?? 0) * 100) },
      { id: "fiable_gold", target: 95, current: Math.round((player.attendance_rate ?? 0) * 100) },
      { id: "special_first_match", target: 1, current: totalMatches },
      { id: "special_mvp_bronze", target: 1, current: player.total_mvp ?? 0 },
      { id: "special_mvp_silver", target: 5, current: player.total_mvp ?? 0 },
      { id: "special_mvp_gold", target: 10, current: player.total_mvp ?? 0 },
      { id: "special_buteur_bronze", target: 10, current: player.total_goals ?? 0 },
      { id: "special_buteur_silver", target: 25, current: player.total_goals ?? 0 },
      { id: "special_buteur_gold", target: 50, current: player.total_goals ?? 0 },
    ];

    const progressRows = badgeDefinitions.map((b) => ({
      user_id: userId,
      badge_id: b.id,
      current: Math.min(b.current, b.target),
      target: b.target,
    }));

    await sc.from("badge_progress").upsert(progressRows, { onConflict: "user_id,badge_id" });

    // Unlock badges that are already completed
    const unlockedBadges = badgeDefinitions
      .filter((b) => b.current >= b.target)
      .map((b) => {
        const cat = b.id.startsWith("joueur") ? "volume"
          : b.id.startsWith("explorateur") ? "exploration"
          : b.id.startsWith("fiable") ? "reliability"
          : "special";
        const tier = b.id.includes("gold") ? "gold"
          : b.id.includes("silver") ? "silver"
          : "bronze";
        // special_first_match is gold tier
        if (b.id === "special_first_match") return { user_id: userId, badge_id: b.id, category: "special", tier: "gold" };
        return { user_id: userId, badge_id: b.id, category: cat, tier };
      });

    if (unlockedBadges.length > 0) {
      await sc.from("user_badges").upsert(unlockedBadges, { onConflict: "user_id,badge_id" });
    }

    created++;
    console.log(
      `  [OK] ${userId}: ${totalXp} XP, level ${level} (${levelName}), ${cities.length} cities, ${unlockedBadges.length} badges`
    );
  }

  console.log(`\n=== Done ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
