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

  // Fetch gamification data for all members
  const memberIds = team.team_members.map((m: any) => m.user_id);
  const { data: memberGamification } = await supabase
    .from("player_gamification")
    .select("user_id, level, total_xp")
    .in("user_id", memberIds);

  // Fetch 3 most recent challenges involving this team
  const { data: recentChallenges } = await supabase
    .from("team_challenges")
    .select("*, challenger_team:teams!team_challenges_challenger_team_id_fkey(id, name, crest_url, crest_preset, member_count), challenged_team:teams!team_challenges_challenged_team_id_fkey(id, name, crest_url, crest_preset, member_count)")
    .or(`challenger_team_id.eq.${id},challenged_team_id.eq.${id}`)
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch team challenge stats
  const { count: totalChallenges } = await supabase
    .from("team_challenges")
    .select("id", { count: "exact", head: true })
    .or(`challenger_team_id.eq.${id},challenged_team_id.eq.${id}`);

  const { count: wonChallenges } = await supabase
    .from("team_challenges")
    .select("id", { count: "exact", head: true })
    .or(`challenger_team_id.eq.${id},challenged_team_id.eq.${id}`)
    .eq("status", "completed");

  return (
    <TeamDetailPage
      team={team}
      userId={user.id}
      isMember={isMember}
      myRole={myRole}
      friends={friends}
      memberGamification={memberGamification ?? []}
      recentChallenges={recentChallenges ?? []}
      totalChallenges={totalChallenges ?? 0}
      wonChallenges={wonChallenges ?? 0}
    />
  );
}
