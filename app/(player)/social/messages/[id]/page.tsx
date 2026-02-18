import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConversationChat from "@/components/messages/ConversationChat";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return { title: "Chat - FootMatch" };
}

export default async function ChatRoute({
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

  // Verify user is a participant in this conversation
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("*")
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) notFound();

  // Fetch conversation with participants and their profiles
  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      "*, conversation_participants(*, profile:profiles(id, first_name, last_name, avatar_url))"
    )
    .eq("id", id)
    .single();

  if (!conversation) notFound();

  // Count total messages for pagination
  const { count: totalCount } = await supabase
    .from("direct_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", id)
    .is("deleted_at", null);

  // Fetch initial messages (last 50, ascending order)
  const { data: messages } = await supabase
    .from("direct_messages")
    .select(
      "*, sender:profiles!direct_messages_sender_id_fkey(id, first_name, last_name, avatar_url)"
    )
    .eq("conversation_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(50);

  // Update last_read_at for the current user
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .eq("user_id", user.id);

  return (
    <ConversationChat
      conversationId={id}
      userId={user.id}
      conversation={conversation}
      initialMessages={messages ?? []}
      totalCount={totalCount ?? undefined}
    />
  );
}
