import type { SupabaseClient } from "@supabase/supabase-js";
import {
  XP_SOURCES,
  DAILY_XP_CAP,
  STREAK_BONUS_CAP,
  computeLevel,
  getISOWeek,
} from "./constants";
import { checkBadges } from "./badges";

// ─── Award XP (with daily cap) ─────────────────────────
async function awardXP(
  sc: SupabaseClient,
  userId: string,
  source: string,
  amount: number,
  matchId?: string,
  metadata?: Record<string, unknown>
): Promise<number> {
  // Get or create gamification row
  const { data: gam } = await sc
    .from("player_gamification")
    .select("total_xp, xp_today, xp_today_date")
    .eq("user_id", userId)
    .maybeSingle();

  let xpToday = gam?.xp_today ?? 0;
  const todayStr = new Date().toISOString().split("T")[0];

  // Reset daily counter if new day
  if (!gam || gam.xp_today_date !== todayStr) {
    xpToday = 0;
  }

  // Enforce daily cap
  const remaining = Math.max(0, DAILY_XP_CAP - xpToday);
  const actualXP = Math.min(amount, remaining);

  if (actualXP <= 0) return 0;

  // Log transaction
  await sc.from("xp_transactions").insert({
    user_id: userId,
    source,
    xp_amount: actualXP,
    match_id: matchId ?? null,
    metadata: metadata ?? {},
  });

  // Update gamification row
  const newTotalXp = (gam?.total_xp ?? 0) + actualXP;
  const { level, levelName } = computeLevel(newTotalXp);

  if (gam) {
    await sc
      .from("player_gamification")
      .update({
        total_xp: newTotalXp,
        level,
        level_name: levelName,
        xp_today: xpToday + actualXP,
        xp_today_date: todayStr,
      })
      .eq("user_id", userId);
  } else {
    await sc.from("player_gamification").insert({
      user_id: userId,
      total_xp: newTotalXp,
      level,
      level_name: levelName,
      xp_today: actualXP,
      xp_today_date: todayStr,
    });
  }

  return actualXP;
}

// ─── Check level up and notify ──────────────────────────
async function checkLevelUp(
  sc: SupabaseClient,
  userId: string,
  previousLevel: number
) {
  const { data: gam } = await sc
    .from("player_gamification")
    .select("level, level_name")
    .eq("user_id", userId)
    .single();

  if (gam && gam.level > previousLevel) {
    await sc.from("notifications").insert({
      user_id: userId,
      type: "level_up",
      title: "Niveau supérieur !",
      body: `Tu es passé au niveau ${gam.level} — ${gam.level_name} !`,
      data: { level: gam.level, level_name: gam.level_name },
    });
  }
}

// ─── Process a completed match ──────────────────────────
export async function processMatchCompletion(
  sc: SupabaseClient,
  matchId: string,
  matchData: { city: string; date: string; start_time: string },
  playerStats: Array<{
    user_id: string;
    attended: boolean;
    mvp: boolean;
  }>
) {
  const attendedPlayers = playerStats.filter((ps) => ps.attended);
  const matchDate = new Date(matchData.date);
  const matchWeek = getISOWeek(matchDate);

  for (const player of attendedPlayers) {
    const userId = player.user_id;

    // Get current state
    const { data: gam } = await sc
      .from("player_gamification")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const previousLevel = gam?.level ?? 1;

    // 1. Match played XP
    await awardXP(sc, userId, XP_SOURCES.MATCH_PLAYED.key, XP_SOURCES.MATCH_PLAYED.amount, matchId);

    // 2. Check first/second match of week
    const weekStart = getWeekStart(matchDate);
    const { count: xpMatchesThisWeek } = await sc
      .from("xp_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source", "match_played")
      .gte("created_at", weekStart.toISOString());

    const matchCountThisWeek = xpMatchesThisWeek ?? 0;

    if (matchCountThisWeek === 1) {
      // This is the first match_played XP we just inserted, so it's the 1st match
      await awardXP(sc, userId, XP_SOURCES.FIRST_MATCH_WEEK.key, XP_SOURCES.FIRST_MATCH_WEEK.amount, matchId);
    } else if (matchCountThisWeek === 2) {
      await awardXP(sc, userId, XP_SOURCES.SECOND_MATCH_WEEK.key, XP_SOURCES.SECOND_MATCH_WEEK.amount, matchId);
    }

    // 3. Check new city
    const citiesPlayed = gam?.cities_played ?? [];
    if (!citiesPlayed.includes(matchData.city)) {
      await awardXP(sc, userId, XP_SOURCES.NEW_CITY.key, XP_SOURCES.NEW_CITY.amount, matchId, { city: matchData.city });
      // Update cities_played array
      await sc
        .from("player_gamification")
        .update({ cities_played: [...citiesPlayed, matchData.city] })
        .eq("user_id", userId);
    }

    // 4. Update streak
    const lastWeek = gam?.last_match_week;
    let newStreak = gam?.current_streak ?? 0;

    if (!lastWeek) {
      newStreak = 1;
    } else if (lastWeek === matchWeek) {
      // Same week, streak unchanged
    } else if (isConsecutiveWeek(lastWeek, matchWeek)) {
      newStreak += 1;
    } else {
      newStreak = 1; // Streak broken
    }

    const bestStreak = Math.max(gam?.best_streak ?? 0, newStreak);

    await sc
      .from("player_gamification")
      .update({
        current_streak: newStreak,
        best_streak: bestStreak,
        last_match_week: matchWeek,
      })
      .eq("user_id", userId);

    // 5. Streak bonus XP (if streak > 1)
    if (newStreak > 1 && lastWeek !== matchWeek) {
      const streakBonus = Math.min(newStreak * XP_SOURCES.STREAK_BONUS.amount, STREAK_BONUS_CAP);
      await awardXP(sc, userId, XP_SOURCES.STREAK_BONUS.key, streakBonus, matchId, { streak: newStreak });
    }

    // 6. Check level up
    await checkLevelUp(sc, userId, previousLevel);

    // 7. Check badges
    await checkBadges(sc, userId, matchId);
  }
}

// ─── Helpers ────────────────────────────────────────────
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isConsecutiveWeek(prevWeek: string, currWeek: string): boolean {
  // Parse ISO weeks like "2026-W07"
  const [prevYear, prevW] = prevWeek.split("-W").map(Number);
  const [currYear, currW] = currWeek.split("-W").map(Number);

  if (currYear === prevYear) {
    return currW === prevW + 1;
  }
  // Year boundary: last week of prev year → week 1 of new year
  if (currYear === prevYear + 1 && currW === 1) {
    // Week 52 or 53 of previous year
    return prevW >= 52;
  }
  return false;
}
