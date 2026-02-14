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

  // Fetch friends' upcoming matches
  const friendIds = (friendships ?? []).map((f: any) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  let friendMatchesMap: Record<string, any[]> = {};
  let myRegisteredMatchIds: string[] = [];

  if (friendIds.length > 0) {
    const today = new Date().toISOString().split("T")[0];

    const { data: friendMatchRegs } = await supabase
      .from("match_registrations")
      .select("player_id, match:matches(id, title, date, start_time, city, venue_name, capacity, registered_count)")
      .in("player_id", friendIds)
      .eq("status", "confirmed")
      .gte("matches.date", today);

    for (const reg of friendMatchRegs ?? []) {
      if (!reg.match) continue;
      const m = reg.match as any;
      if (!m.id) continue;
      if (!friendMatchesMap[reg.player_id]) friendMatchesMap[reg.player_id] = [];
      if (friendMatchesMap[reg.player_id].length < 2) {
        friendMatchesMap[reg.player_id].push(m);
      }
    }

    const { data: myRegs } = await supabase
      .from("match_registrations")
      .select("match_id")
      .eq("player_id", user.id)
      .eq("status", "confirmed");

    myRegisteredMatchIds = (myRegs ?? []).map((r) => r.match_id);
  }

  return (
    <FriendsPage
      userId={user.id}
      friends={(friendships as FriendshipWithProfile[]) ?? []}
      pendingRequests={(pendingRequests as FriendshipWithProfile[]) ?? []}
      sentRequests={(sentRequests as FriendshipWithProfile[]) ?? []}
      friendMatchesMap={friendMatchesMap}
      myRegisteredMatchIds={myRegisteredMatchIds}
    />
  );
}
