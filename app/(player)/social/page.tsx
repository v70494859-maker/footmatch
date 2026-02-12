import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SocialHub from "@/components/social/SocialHub";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Social - FootMatch" };
}

export default async function SocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch pending friend requests count
  const { count: pendingCount } = await supabase
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  // Fetch user's teams count
  const { count: teamCount } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Fetch unread messages count — count conversations where last_message_at > last_read_at
  const { count: unreadCount } = await supabase
    .from("conversation_participants")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("last_read_at", "is", null)
    .filter("last_read_at", "lt", "last_message_at");

  return (
    <SocialHub
      pendingFriendRequests={pendingCount ?? 0}
      teamCount={teamCount ?? 0}
      unreadMessages={unreadCount ?? 0}
    />
  );
}
