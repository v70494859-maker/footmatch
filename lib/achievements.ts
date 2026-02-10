import type { PlayerCareerStats } from "@/types";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  current: number;
  unlocked: boolean;
}

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  field: keyof PlayerCareerStats;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Matches
  { id: "match_1", name: "Premier match", description: "Jouer son premier match", icon: "⚽", threshold: 1, field: "total_matches" },
  { id: "match_10", name: "Habitu\u00e9", description: "Jouer 10 matchs", icon: "🏟️", threshold: 10, field: "total_matches" },
  { id: "match_25", name: "Passionn\u00e9", description: "Jouer 25 matchs", icon: "🔥", threshold: 25, field: "total_matches" },
  { id: "match_50", name: "V\u00e9t\u00e9ran", description: "Jouer 50 matchs", icon: "🏅", threshold: 50, field: "total_matches" },
  { id: "match_100", name: "L\u00e9gende", description: "Jouer 100 matchs", icon: "👑", threshold: 100, field: "total_matches" },

  // Goals
  { id: "goal_1", name: "Buteur", description: "Marquer son premier but", icon: "🎯", threshold: 1, field: "total_goals" },
  { id: "goal_10", name: "Sniper", description: "Marquer 10 buts", icon: "💥", threshold: 10, field: "total_goals" },
  { id: "goal_25", name: "Machine", description: "Marquer 25 buts", icon: "⚡", threshold: 25, field: "total_goals" },
  { id: "goal_50", name: "Goleador", description: "Marquer 50 buts", icon: "🏆", threshold: 50, field: "total_goals" },

  // Assists
  { id: "assist_1", name: "Passeur", description: "D\u00e9livrer sa premi\u00e8re passe d\u00e9cisive", icon: "🤝", threshold: 1, field: "total_assists" },
  { id: "assist_10", name: "Meneur", description: "D\u00e9livrer 10 passes d\u00e9cisives", icon: "🎩", threshold: 10, field: "total_assists" },
  { id: "assist_25", name: "Maestro", description: "D\u00e9livrer 25 passes d\u00e9cisives", icon: "🪄", threshold: 25, field: "total_assists" },

  // MVP
  { id: "mvp_1", name: "\u00c9toile", description: "\u00catre \u00e9lu MVP pour la premi\u00e8re fois", icon: "⭐", threshold: 1, field: "total_mvp" },
  { id: "mvp_5", name: "Star", description: "\u00catre \u00e9lu MVP 5 fois", icon: "🌟", threshold: 5, field: "total_mvp" },
  { id: "mvp_10", name: "Ballon d'Or", description: "\u00catre \u00e9lu MVP 10 fois", icon: "✨", threshold: 10, field: "total_mvp" },

  // Wins
  { id: "win_5", name: "Gagnant", description: "Remporter 5 matchs", icon: "✅", threshold: 5, field: "win_count" },
  { id: "win_15", name: "Champion", description: "Remporter 15 matchs", icon: "🥇", threshold: 15, field: "win_count" },
  { id: "win_30", name: "Imbattable", description: "Remporter 30 matchs", icon: "💎", threshold: 30, field: "win_count" },
];

export function computeAchievements(stats: PlayerCareerStats): Achievement[] {
  return BADGE_DEFINITIONS.map((badge) => {
    const current = Number(stats[badge.field]) || 0;
    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      threshold: badge.threshold,
      current,
      unlocked: current >= badge.threshold,
    };
  });
}
