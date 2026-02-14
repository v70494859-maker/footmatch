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

  // ── User profile ──
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .eq("id", user.id)
    .single();

  // ── Gamification ──
  const { data: gamification } = await supabase
    .from("player_gamification")
    .select("level")
    .eq("user_id", user.id)
    .single();

  // ── Counts ──
  const { count: friendCount } = await supabase
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const { count: pendingRequests } = await supabase
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  const { count: unreadMessages } = await supabase
    .from("conversation_participants")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("last_read_at", "is", null)
    .filter("last_read_at", "lt", "last_message_at");

  const { count: matchesPlayed } = await supabase
    .from("match_registrations")
    .select("id", { count: "exact", head: true })
    .eq("player_id", user.id)
    .eq("status", "confirmed");

  // ── Friends ──
  const { data: friendships } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  // ── Pending requests (incoming) ──
  const { data: pendingFriendRequests } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // ── Sent requests (outgoing) ──
  const { data: sentRequests } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // ── Conversations ──
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const convIds = (participations ?? []).map((p) => p.conversation_id);

  let conversations: any[] = [];
  if (convIds.length > 0) {
    const { data } = await supabase
      .from("conversations")
      .select("*, conversation_participants(*, profile:profiles(id, first_name, last_name, avatar_url, origin_country, favorite_club))")
      .in("id", convIds)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    conversations = data ?? [];
  }

  // ── Friends for DM modal ──
  const friendsForDM = (friendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee : f.requester
  );

  // ── Friends' upcoming matches ──
  const friendIds = (friendships ?? []).map((f) =>
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
    <SocialHub
      userId={user.id}
      profile={profile!}
      level={gamification?.level ?? 1}
      friendCount={friendCount ?? 0}
      matchesPlayed={matchesPlayed ?? 0}
      pendingRequests={pendingRequests ?? 0}
      unreadMessages={unreadMessages ?? 0}
      friends={(friendships ?? []) as any}
      pendingFriendRequests={(pendingFriendRequests ?? []) as any}
      sentRequests={(sentRequests ?? []) as any}
      conversations={conversations}
      friendsForDM={friendsForDM}
      friendMatchesMap={friendMatchesMap}
      myRegisteredMatchIds={myRegisteredMatchIds}
    />
  );
}
