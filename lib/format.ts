import type { TerrainType, MatchStatus, SubscriptionStatus, MatchQuality } from "@/types";
import { TERRAIN_TYPE_LABELS, MATCH_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS, MATCH_QUALITY_LABELS } from "@/types";

export function formatDate(dateStr: string): string {
  // Handle both "2026-02-09" (date only) and "2026-02-09T12:00:00.000Z" (full timestamp)
  const date = dateStr.includes("T")
    ? new Date(dateStr)
    : new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  return `${h}:${m}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

export function formatPrice(price: number, currency: string = "EUR"): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

export function formatCurrency(price: number, currency: string): string {
  return formatPrice(price, currency);
}

export function formatSpots(count: number, max: number): string {
  return `${count}/${max}`;
}

export function formatTerrainType(type: TerrainType): string {
  return TERRAIN_TYPE_LABELS[type] ?? type;
}

export function formatMatchStatus(status: MatchStatus): string {
  return MATCH_STATUS_LABELS[status] ?? status;
}

export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  return SUBSCRIPTION_STATUS_LABELS[status] ?? status;
}

export function formatMatchQuality(quality: MatchQuality): string {
  return MATCH_QUALITY_LABELS[quality] ?? quality;
}

export function formatAttendanceRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function formatChatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (diffDays === 0 && date.toDateString() === now.toDateString()) {
    return time;
  }

  if (diffDays < 7) {
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    return `${day} ${time}`;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
