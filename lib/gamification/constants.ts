// ─── XP Sources ─────────────────────────────────────────
export const XP_SOURCES = {
  MATCH_PLAYED: { key: "match_played", amount: 100 },
  CONFIRM_H24: { key: "confirm_h24", amount: 15 },
  FIRST_MATCH_WEEK: { key: "first_match_week", amount: 25 },
  SECOND_MATCH_WEEK: { key: "second_match_week", amount: 50 },
  STREAK_BONUS: { key: "streak_bonus", amount: 10 }, // per week, capped at 100
  NEW_CITY: { key: "new_city", amount: 50 },
  REFERRAL: { key: "referral", amount: 75 },
  BADGE_UNLOCK: { key: "badge_unlock", amount: 50 },
} as const;

export const DAILY_XP_CAP = 500;
export const STREAK_BONUS_CAP = 100;

// ─── Levels ─────────────────────────────────────────────
export interface LevelDef {
  level: number;
  name: string;
  xpCumulative: number;
}

export const LEVELS: LevelDef[] = [
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

export function computeLevel(totalXp: number): {
  level: number;
  levelName: string;
  currentLevelXp: number;
  nextLevelXp: number | null;
  progress: number;
} {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.xpCumulative) {
      current = lvl;
    } else {
      break;
    }
  }

  const nextIdx = LEVELS.findIndex((l) => l.level === current.level + 1);
  const next = nextIdx >= 0 ? LEVELS[nextIdx] : null;

  const xpIntoLevel = totalXp - current.xpCumulative;
  const xpNeeded = next ? next.xpCumulative - current.xpCumulative : 0;
  const progress = xpNeeded > 0 ? Math.min(xpIntoLevel / xpNeeded, 1) : 1;

  return {
    level: current.level,
    levelName: current.name,
    currentLevelXp: current.xpCumulative,
    nextLevelXp: next?.xpCumulative ?? null,
    progress,
  };
}

// ─── ISO Week helper ────────────────────────────────────
export function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}
