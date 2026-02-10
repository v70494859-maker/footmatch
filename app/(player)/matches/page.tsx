import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/lib/i18n/server";
import type { MatchWithOperator } from "@/types";
import {
  formatDate,
  formatTime,
  formatDuration,
  formatSpots,
  formatTerrainType,
} from "@/lib/format";
import { calculateDistance, formatDistance, geocodeCity } from "@/lib/geo";
import MatchFilters from "@/components/match/MatchFilters";
import MatchListSorted from "@/components/match/MatchListSorted";
import MatchCountdown from "@/components/match/MatchCountdown";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: `FootMatch - ${t.matchList.title}`,
    description: t.matchList.metaDesc,
  };
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; date?: string; terrain_type?: string }>;
}) {
  const supabase = await createClient();
  const t = await getTranslations();
  const filters = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  // Build the query for upcoming matches with operator info
  let query = supabase
    .from("matches")
    .select("*, operator:operators(*, profile:profiles(*))")
    .gte("date", today)
    .in("status", ["upcoming", "full"])
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  // Apply server-side filters from searchParams
  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }

  if (filters.date) {
    query = query.eq("date", filters.date);
  }

  if (filters.terrain_type) {
    query = query.eq("terrain_type", filters.terrain_type);
  }

  // Parallel fetches: matches + user registrations + chat counts + weekly stats + profile
  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const weekEnd = endOfWeek.toISOString().split("T")[0];

  const [matchesRes, regsRes, chatRes, weekRegsRes, profileRes] =
    await Promise.all([
      query,

      // User's confirmed registrations
      supabase
        .from("match_registrations")
        .select("match_id")
        .eq("player_id", user.id)
        .eq("status", "confirmed"),

      // Chat message counts (all upcoming match messages)
      supabase.from("match_messages").select("match_id"),

      // Registrations this week (for stats)
      supabase
        .from("match_registrations")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed"),

      // Player profile (for city-based distance)
      supabase
        .from("profiles")
        .select("city")
        .eq("id", user.id)
        .single(),
    ]);

  const typedMatches = (matchesRes.data as MatchWithOperator[] | null) ?? [];
  const hasFilters = !!(filters.city || filters.date || filters.terrain_type);

  // Build registration data
  const registeredMatchIdsList = (regsRes.data ?? []).map(
    (r) => r.match_id as string
  );
  const registeredMatchIds = new Set(registeredMatchIdsList);

  // Build chat counts map
  const chatCounts: Record<string, number> = {};
  for (const msg of (chatRes.data ?? []) as { match_id: string }[]) {
    chatCounts[msg.match_id] = (chatCounts[msg.match_id] ?? 0) + 1;
  }

  // Geocode player's profile city and compute distances
  const playerCity = profileRes.data?.city ?? null;
  const playerCoords = playerCity ? await geocodeCity(playerCity) : null;

  const distances: Record<string, number> = {};
  if (playerCoords) {
    // Matches with stored lat/lng
    for (const m of typedMatches) {
      if (m.lat != null && m.lng != null) {
        distances[m.id] = calculateDistance(
          playerCoords.lat,
          playerCoords.lng,
          m.lat,
          m.lng
        );
      }
    }

    // Fallback: geocode cities for matches missing lat/lng
    const missingCities = new Set<string>();
    for (const m of typedMatches) {
      if (m.lat == null || m.lng == null) missingCities.add(m.city);
    }

    if (missingCities.size > 0) {
      const cityCoords: Record<string, { lat: number; lng: number }> = {};
      await Promise.all(
        [...missingCities].map(async (city) => {
          const coords = await geocodeCity(city);
          if (coords) cityCoords[city] = coords;
        })
      );
      for (const m of typedMatches) {
        if ((m.lat == null || m.lng == null) && cityCoords[m.city]) {
          distances[m.id] = calculateDistance(
            playerCoords.lat,
            playerCoords.lng,
            cityCoords[m.city].lat,
            cityCoords[m.city].lng
          );
        }
      }
    }
  }

  // Find the "recommended" match: best combined score of proximity + time
  const nowMs = Date.now();
  let featuredMatch: MatchWithOperator | null = null;

  if (Object.keys(distances).length > 0) {
    const maxDist = Math.max(...Object.values(distances), 1);
    const maxHours = 7 * 24;
    let bestScore = Infinity;

    for (const m of typedMatches) {
      if (registeredMatchIds.has(m.id)) continue;
      if (m.status === "full") continue;
      const dist = distances[m.id];
      if (dist == null) continue;

      const matchTime = new Date(`${m.date}T${m.start_time}`).getTime();
      const hoursUntil = (matchTime - nowMs) / (1000 * 60 * 60);
      if (hoursUntil <= 0) continue;

      const score = (dist / maxDist) * 0.6 + (Math.min(hoursUntil / maxHours, 1)) * 0.4;
      if (score < bestScore) {
        bestScore = score;
        featuredMatch = m;
      }
    }
  }

  // Compute stats
  const totalPlayers = weekRegsRes.count ?? 0;
  const matchesThisWeek = typedMatches.filter(
    (m) => m.date >= today && m.date <= weekEnd
  ).length;
  const userUpcoming = typedMatches.filter((m) =>
    registeredMatchIds.has(m.id)
  ).length;

  // Separate "hot" matches (>=75% full, not the user's) for featured section
  const hotMatches = typedMatches
    .filter((m) => {
      const fill = m.capacity > 0 ? m.registered_count / m.capacity : 0;
      return fill >= 0.75 && fill < 1 && !registeredMatchIds.has(m.id);
    })
    .slice(0, 3);

  // Unique cities count
  const uniqueCities = new Set(typedMatches.map((m) => m.city)).size;

  return (
    <div className="pb-24 lg:pb-8">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground">{t.matchList.title}</h1>
        <p className="text-sm text-surface-400 mt-1">
          {typedMatches.length}{" "}
          {typedMatches.length === 1 ? t.matchList.upcomingMatch : t.matchList.upcomingMatches}
          {playerCity && (
            <span className="text-surface-500">
              {" "}
              &middot; {t.matchList.from} {playerCity}
            </span>
          )}
        </p>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-pitch-400">
              {matchesThisWeek}
            </p>
            <p className="text-[10px] text-surface-500">{t.matchList.thisWeek}</p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{uniqueCities}</p>
            <p className="text-[10px] text-surface-500">
              {uniqueCities === 1 ? t.matchList.city : t.matchList.cities}
            </p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{totalPlayers}</p>
            <p className="text-[10px] text-surface-500">{t.matchList.registrations}</p>
          </div>
          <div className="rounded-xl bg-surface-900 border border-surface-800 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-pitch-400">{userUpcoming}</p>
            <p className="text-[10px] text-surface-500">{t.myMatches.title}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4">
          <MatchFilters />
        </div>

        {/* Featured: closest + soonest match */}
        {featuredMatch && !hasFilters && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-pitch-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
              <h2 className="text-sm font-semibold text-foreground">
                {t.matchList.recommended}
              </h2>
              <span className="text-xs text-surface-500">
                — {t.matchList.closestToYou}
              </span>
            </div>
            <FeaturedMatchCard
              match={featuredMatch}
              distance={distances[featuredMatch.id] ?? null}
              chatCount={chatCounts[featuredMatch.id]}
              playerCity={playerCity}
              t={t}
            />
          </div>
        )}

        {/* Hot matches section */}
        {hotMatches.length > 0 && !hasFilters && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <h2 className="text-sm font-semibold text-foreground">
                {t.matchList.almostFull}
              </h2>
              <span className="text-xs text-surface-500">
                — {t.matchList.hurryUp}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotMatches.map((match) => (
                <HotMatchCard
                  key={match.id}
                  match={match}
                  chatCount={chatCounts[match.id]}
                  distance={distances[match.id] ?? null}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

        {/* Match Grid */}
        {typedMatches.length > 0 ? (
          <div className="mt-6">
            <MatchListSorted
              matches={typedMatches}
              registeredMatchIds={registeredMatchIdsList}
              chatCounts={chatCounts}
              distances={distances}
            />
          </div>
        ) : (
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-8 text-center mt-6">
            <svg
              className="w-10 h-10 mx-auto text-surface-700 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6l1.5 3.5L17 11l-3.5 1.5L12 16l-1.5-3.5L7 11l3.5-1.5z" />
            </svg>
            <p className="text-sm text-surface-400">{t.matchList.noMatchesFound}</p>
            {hasFilters && (
              <p className="text-xs text-surface-500 mt-1">
                {t.matchList.tryAdjusting}{" "}
                <Link href="/matches" className="text-pitch-400 underline">
                  {t.matchList.resetFilters}
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hot match card (server component, inline) ───────────

function HotMatchCard({
  match,
  chatCount,
  distance,
  t,
}: {
  match: MatchWithOperator;
  chatCount?: number;
  distance?: number | null;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const spotsLeft = match.capacity - match.registered_count;
  const fillPercent =
    match.capacity > 0
      ? Math.min((match.registered_count / match.capacity) * 100, 100)
      : 0;
  const operatorName =
    match.operator?.profile?.first_name ?? "Organisateur";

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-surface-900 p-4 hover:border-amber-500/50 transition-colors"
    >
      {/* Top: badges + countdown */}
      <div className="flex items-center flex-wrap gap-1.5 mb-2">
        <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-500 rounded-full px-2 py-0.5">
          {spotsLeft} {spotsLeft === 1 ? t.common.spot : t.common.spots}
        </span>
        {chatCount != null && chatCount > 0 && (
          <span className="text-[10px] font-medium bg-surface-800 text-surface-300 rounded-full px-2 py-0.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {chatCount}
          </span>
        )}
        <span className="ml-auto">
          <MatchCountdown matchDate={match.date} matchTime={match.start_time} />
        </span>
      </div>

      <h3 className="text-sm font-semibold text-foreground line-clamp-1">
        {match.title}
      </h3>

      <div className="flex items-center gap-1.5 mt-1.5">
        <svg className="w-3.5 h-3.5 text-surface-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs text-surface-400">
          {formatDate(match.date)} &middot; {formatTime(match.start_time)}
        </span>
      </div>

      {/* Location block */}
      <div className="mt-1.5 rounded-lg bg-surface-800/40 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-pitch-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          <span className="text-xs font-medium text-foreground truncate">
            {match.city}
          </span>
          {distance != null && (
            <span className="text-[10px] font-bold text-pitch-400 ml-auto shrink-0">
              {formatDistance(distance)}
            </span>
          )}
        </div>
        <p className="text-[10px] text-surface-500 mt-0.5 ml-5 line-clamp-1">
          {match.venue_name}
          {match.venue_address && (
            <span> &middot; {match.venue_address}</span>
          )}
        </p>
      </div>

      {/* Badges + operator */}
      <div className="flex items-center gap-2 mt-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5">
          {formatTerrainType(match.terrain_type)}
        </span>
        <span className="text-[10px] text-surface-500 ml-auto truncate">
          {t.matchList.by} {operatorName}
        </span>
      </div>

      {/* Fill bar */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-surface-500">{formatSpots(match.registered_count, match.capacity)}</span>
        </div>
        <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

// ─── Featured match card (recommended for you) ───────────

function FeaturedMatchCard({
  match,
  distance,
  chatCount,
  playerCity,
  t,
}: {
  match: MatchWithOperator;
  distance?: number | null;
  chatCount?: number;
  playerCity?: string | null;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const spotsLeft = match.capacity - match.registered_count;
  const fillPercent =
    match.capacity > 0
      ? Math.min((match.registered_count / match.capacity) * 100, 100)
      : 0;
  const operatorName =
    match.operator?.profile?.first_name ?? "Organisateur";
  const operatorAvatar = match.operator?.profile?.avatar_url;
  const operatorRating = match.operator?.rating ?? 0;
  const operatorMatches = match.operator?.total_matches ?? 0;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-pitch-500/30 bg-gradient-to-br from-pitch-950/20 to-surface-900 p-5 hover:border-pitch-500/50 transition-colors"
    >
      {/* Top: badges + countdown */}
      <div className="flex items-center flex-wrap gap-1.5 mb-3">
        <span className="text-[10px] font-semibold bg-pitch-500/15 text-pitch-400 rounded-full px-2 py-0.5">
          {spotsLeft} {spotsLeft === 1 ? t.common.spot : t.common.spots} {spotsLeft === 1 ? t.common.remaining : t.common.remainingPlural}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5">
          {formatTerrainType(match.terrain_type)}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-800 text-surface-300 rounded-full px-2.5 py-0.5">
          {match.capacity}v{match.capacity}
        </span>
        {chatCount != null && chatCount > 0 && (
          <span className="text-[10px] font-medium bg-surface-800 text-surface-300 rounded-full px-2 py-0.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {chatCount}
          </span>
        )}
        <span className="ml-auto">
          <MatchCountdown matchDate={match.date} matchTime={match.start_time} />
        </span>
      </div>

      <h3 className="text-base font-semibold text-foreground line-clamp-1">
        {match.title}
      </h3>

      {/* Date + time + duration */}
      <div className="flex items-center gap-1.5 mt-2">
        <svg className="w-4 h-4 text-surface-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm text-surface-400">
          {formatDate(match.date)} &middot; {formatTime(match.start_time)} &middot; {formatDuration(match.duration_minutes)}
        </span>
      </div>

      {/* Location block */}
      <div className="mt-2 rounded-lg bg-surface-800/40 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-pitch-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          <span className="text-sm font-medium text-foreground">
            {match.city}
          </span>
          {distance != null && (
            <span className="text-xs font-bold text-pitch-400 ml-auto shrink-0">
              {formatDistance(distance)}
              {playerCity && (
                <span className="text-surface-500 font-normal"> {t.matchList.from} {playerCity}</span>
              )}
            </span>
          )}
        </div>
        <p className="text-xs text-surface-400 mt-0.5 ml-[22px] line-clamp-1">
          {match.venue_name}
          {match.venue_address && (
            <span className="text-surface-500"> &middot; {match.venue_address}</span>
          )}
        </p>
      </div>

      {/* Description */}
      {match.description && (
        <p className="text-xs text-surface-500 mt-2 line-clamp-2 leading-relaxed">
          {match.description}
        </p>
      )}

      {/* Operator row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-800/50">
        {operatorAvatar ? (
          <img src={operatorAvatar} alt={operatorName} className="w-5 h-5 rounded-full object-cover" />
        ) : (
          <span className="w-5 h-5 rounded-full bg-surface-700 flex items-center justify-center text-[9px] font-bold text-surface-400">
            {operatorName[0]}
          </span>
        )}
        <span className="text-xs text-surface-400">
          {t.common.organizedBy} <span className="text-foreground font-medium">{operatorName}</span>
        </span>
        {operatorRating > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-amber-400">
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {operatorRating.toFixed(1)}
          </span>
        )}
        {operatorMatches > 0 && (
          <span className="text-[10px] text-surface-500">
            {operatorMatches} {operatorMatches > 1 ? t.common.matchPlural : t.common.match} {operatorMatches > 1 ? t.common.organizedPlural : t.common.organized}
          </span>
        )}
        <span className="text-xs text-surface-500 ml-auto">
          {formatSpots(match.registered_count, match.capacity)}
        </span>
      </div>

      {/* Fill bar */}
      <div className="mt-2">
        <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-pitch-400 transition-all duration-300"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
