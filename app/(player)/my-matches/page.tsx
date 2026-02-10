import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/lib/i18n/server";
import type {
  MatchRegistrationWithMatchOperator,
  MatchResult,
  MatchPlayerStats,
  PlayerCareerStats,
  ChatMessageWithSender,
} from "@/types";
import MyMatchesClient from "@/components/match/MyMatchesClient";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: `FootMatch - ${t.myMatches.title}`,
    description: t.myMatches.metaDesc,
  };
}

export default async function MyMatchesPage() {
  const supabase = await createClient();
  const t = await getTranslations();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch confirmed registrations with match data
  const { data: registrations } = await supabase
    .from("match_registrations")
    .select("*, match:matches(*, operator:operators(*, profile:profiles(*)))")
    .eq("player_id", user.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  const typedRegistrations = (registrations ?? []).filter(
    (r) => r.match !== null
  ) as MatchRegistrationWithMatchOperator[];

  const today = new Date().toISOString().split("T")[0];
  const pastMatchIds = typedRegistrations
    .filter((r) => r.match.date < today)
    .map((r) => r.match.id);
  const upcomingMatchIds = typedRegistrations
    .filter((r) => r.match.date >= today)
    .map((r) => r.match.id);

  // Parallel fetches
  const [resultsRes, playerStatsRes, careerStatsRes, chatMessagesRes] = await Promise.all([
    // Match results for past matches
    pastMatchIds.length > 0
      ? supabase
          .from("match_results")
          .select("*")
          .in("match_id", pastMatchIds)
      : Promise.resolve({ data: [] }),

    // Player's stats for past matches
    pastMatchIds.length > 0
      ? supabase
          .from("match_player_stats")
          .select("*")
          .eq("user_id", user.id)
          .in("match_id", pastMatchIds)
      : Promise.resolve({ data: [] }),

    // Career stats
    supabase
      .from("player_career_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),

    // Recent chat messages for upcoming matches (last 30 across all)
    upcomingMatchIds.length > 0
      ? supabase
          .from("match_messages")
          .select("*, sender:profiles(*)")
          .in("match_id", upcomingMatchIds)
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] }),
  ]);

  // Build lookup maps keyed by match_id
  const matchResults: Record<string, MatchResult> = {};
  for (const r of (resultsRes.data ?? []) as MatchResult[]) {
    matchResults[r.match_id] = r;
  }

  const playerMatchStats: Record<string, MatchPlayerStats> = {};
  for (const s of (playerStatsRes.data ?? []) as MatchPlayerStats[]) {
    playerMatchStats[s.match_id] = s;
  }

  // Group chat messages by match_id, keep last 3 per match (reversed to chronological)
  const chatPreviews: Record<string, ChatMessageWithSender[]> = {};
  const chatCounts: Record<string, number> = {};
  for (const msg of (chatMessagesRes.data ?? []) as ChatMessageWithSender[]) {
    if (!chatCounts[msg.match_id]) chatCounts[msg.match_id] = 0;
    chatCounts[msg.match_id]++;
    if (!chatPreviews[msg.match_id]) chatPreviews[msg.match_id] = [];
    if (chatPreviews[msg.match_id].length < 3) {
      chatPreviews[msg.match_id].push(msg);
    }
  }
  // Reverse each preview array to show chronological order
  for (const matchId of Object.keys(chatPreviews)) {
    chatPreviews[matchId].reverse();
  }

  return (
    <div className="pb-24 lg:pb-8">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold text-foreground">{t.myMatches.title}</h1>
        <p className="text-sm text-surface-400 mt-1">
          {t.myMatches.subtitle}
        </p>

        <MyMatchesClient
          registrations={typedRegistrations}
          matchResults={matchResults}
          playerMatchStats={playerMatchStats}
          careerStats={careerStatsRes.data as PlayerCareerStats | null}
          chatPreviews={chatPreviews}
          chatCounts={chatCounts}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
