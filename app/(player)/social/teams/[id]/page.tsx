import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamDetailPage from "@/components/social/TeamDetailPage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: team } = await supabase.from("teams").select("name").eq("id", id).single();
  return { title: team ? `${team.name} - FootMatch` : "Team - FootMatch" };
}

export default async function TeamRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: team } = await supabase
    .from("teams")
    .select("*, captain:profiles!teams_captain_id_fkey(*), team_members(*, profile:profiles(*))")
    .eq("id", id)
    .single();

  if (!team) notFound();

  const isMember = team.team_members.some((m: any) => m.user_id === user.id);
  const myRole = team.team_members.find((m: any) => m.user_id === user.id)?.role ?? null;

  // Fetch friends for invite (if captain or co-captain)
  let friends: any[] = [];
  if (myRole === "captain" || myRole === "co_captain") {
    const { data: friendships } = await supabase
      .from("friendships")
      .select("*, requester:profiles!friendships_requester_id_fkey(id, first_name, last_name, avatar_url), addressee:profiles!friendships_addressee_id_fkey(id, first_name, last_name, avatar_url)")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    friends = (friendships ?? []).map((f: any) => f.requester_id === user.id ? f.addressee : f.requester);
  }

  return (
    <TeamDetailPage
      team={team}
      userId={user.id}
      isMember={isMember}
      myRole={myRole}
      friends={friends}
    />
  );
}
