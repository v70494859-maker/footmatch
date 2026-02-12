import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FriendshipWithProfile } from "@/types";
import FriendsPage from "@/components/social/FriendsPage";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Friends - FootMatch" };
}

export default async function FriendsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch accepted friends
  const { data: friendships } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  // Fetch pending requests (incoming)
  const { data: pendingRequests } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Fetch sent requests (outgoing)
  const { data: sentRequests } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <FriendsPage
      userId={user.id}
      friends={(friendships as FriendshipWithProfile[]) ?? []}
      pendingRequests={(pendingRequests as FriendshipWithProfile[]) ?? []}
      sentRequests={(sentRequests as FriendshipWithProfile[]) ?? []}
    />
  );
}
