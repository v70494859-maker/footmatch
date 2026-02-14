import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  MatchWithOperator,
  MatchRegistrationWithProfile,
  MatchResult,
  MatchPlayerStatsWithProfile,
  ChatMessageWithSender,
} from "@/types";
import MatchDetailView from "@/components/match/MatchDetailView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("title, city")
    .eq("id", id)
    .single();

  if (!match) {
    return { title: "Match introuvable - FootMatch" };
  }

  return {
    title: `${match.title} - FootMatch`,
    description: `Match de foot à ${match.city}`,
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Batch 1: independent queries
  const [matchRes, subscriptionRes] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "*, operator:operators(*, profile:profiles(*)), match_registrations(*, profile:profiles(*))"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("subscriptions")
      .select("id")
      .eq("player_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (!matchRes.data) notFound();

  const typedMatch = matchRes.data as MatchWithOperator & {
    match_registrations: MatchRegistrationWithProfile[];
  };
  const registrations = typedMatch.match_registrations ?? [];
  const isRegistered = registrations.some(
    (r) => r.player_id === user.id && r.status === "confirmed"
  );
  const userStandbyReg = registrations.find(
    (r) => r.player_id === user.id && r.status === "standby"
  );
  const isStandby = !!userStandbyReg;
  const standbyCount = registrations.filter((r) => r.status === "standby").length;
  const canStandby = standbyCount < 2 && !isRegistered && !isStandby;
  const hasSubscription = !!subscriptionRes.data;

  // Reset cancel tokens if needed and get current count
  const { data: tokenData } = await supabase.rpc("reset_cancel_tokens_if_needed", { p_user_id: user.id });
  const cancelTokens = tokenData ?? 1;

  // Batch 2: queries dependent on batch 1
  const [resultRes, messagesRes, chatCountRes] = await Promise.all([
    typedMatch.status === "completed"
      ? supabase
          .from("match_results")
          .select("*, match_player_stats(*, profile:profiles(*))")
          .eq("match_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    isRegistered
      ? supabase
          .from("match_messages")
          .select("*, sender:profiles(*)")
          .eq("match_id", id)
          .order("created_at", { ascending: true })
          .limit(100)
      : Promise.resolve({ data: [] }),
    supabase
      .from("match_messages")
      .select("id", { count: "exact", head: true })
      .eq("match_id", id),
  ]);

  let matchResult: MatchResult | null = null;
  let playerStats: MatchPlayerStatsWithProfile[] = [];

  if (resultRes.data) {
    const { match_player_stats, ...result } = resultRes.data as MatchResult & {
      match_player_stats: MatchPlayerStatsWithProfile[];
    };
    matchResult = result;
    playerStats = match_player_stats;
  }

  const chatMessages = (messagesRes.data ?? []) as ChatMessageWithSender[];
  const chatMessageCount =
    (chatCountRes as unknown as { count: number | null }).count ?? 0;

  return (
    <MatchDetailView
      match={typedMatch}
      registrations={registrations}
      isRegistered={isRegistered}
      isStandby={isStandby}
      standbyPosition={userStandbyReg?.standby_position ?? undefined}
      canStandby={canStandby}
      cancelTokens={cancelTokens}
      hasSubscription={hasSubscription}
      currentUserId={user.id}
      matchResult={matchResult}
      playerStats={playerStats}
      initialMessages={chatMessages}
      chatMessageCount={chatMessageCount}
    />
  );
}
