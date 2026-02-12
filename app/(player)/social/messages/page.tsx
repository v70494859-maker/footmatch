import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConversationListPage from "@/components/messages/ConversationListPage";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Messages - FootMatch" };
}

export default async function MessagesRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get conversation IDs where user participates
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const convIds = (participations ?? []).map((p) => p.conversation_id);

  let conversations: any[] = [];
  if (convIds.length > 0) {
    const { data } = await supabase
      .from("conversations")
      .select(
        "*, conversation_participants(*, profile:profiles(id, first_name, last_name, avatar_url))"
      )
      .in("id", convIds)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    conversations = data ?? [];
  }

  // Fetch friends for new conversation modal
  const { data: friendships } = await supabase
    .from("friendships")
    .select(
      "*, requester:profiles!friendships_requester_id_fkey(id, first_name, last_name, avatar_url), addressee:profiles!friendships_addressee_id_fkey(id, first_name, last_name, avatar_url)"
    )
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const friends = (friendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee : f.requester
  );

  return (
    <ConversationListPage
      userId={user.id}
      conversations={conversations}
      friends={friends}
    />
  );
}
