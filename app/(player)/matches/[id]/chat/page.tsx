import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessageWithSender } from "@/types";
import MatchChat from "@/components/chat/MatchChat";

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
    .select("title")
    .eq("id", id)
    .single();

  return {
    title: match ? `Chat - ${match.title}` : "Chat - FootMatch",
  };
}

export default async function MatchChatPage({
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

  // Fetch match
  const { data: match } = await supabase
    .from("matches")
    .select("id, title, registered_count, status")
    .eq("id", id)
    .single();

  if (!match) notFound();

  // Verify user is registered
  const { data: registration } = await supabase
    .from("match_registrations")
    .select("id")
    .eq("match_id", id)
    .eq("player_id", user.id)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!registration) redirect(`/matches/${id}`);

  // Fetch initial messages with sender profiles
  const { data: messages } = await supabase
    .from("match_messages")
    .select("*, sender:profiles(*)")
    .eq("match_id", id)
    .order("created_at", { ascending: true })
    .limit(100);

  const typedMessages = (messages as ChatMessageWithSender[] | null) ?? [];

  return (
    <MatchChat
      matchId={match.id}
      matchTitle={match.title}
      participantCount={match.registered_count}
      initialMessages={typedMessages}
      currentUserId={user.id}
    />
  );
}
