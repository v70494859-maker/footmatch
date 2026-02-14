import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamsPage from "@/components/social/TeamsPage";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: "Teams - FootMatch" }; }

export default async function TeamsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if user has signed charter
  const { data: charter } = await supabase
    .from("team_charters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch user's teams
  const { data: memberships } = await supabase
    .from("team_members")
    .select("*, team:teams(*, captain:profiles!teams_captain_id_fkey(id, first_name, last_name, avatar_url))")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  // Fetch pending invitations
  const { data: invitations } = await supabase
    .from("team_invitations")
    .select("*, team:teams(*), inviter:profiles!team_invitations_inviter_id_fkey(id, first_name, last_name, avatar_url)")
    .eq("invitee_id", user.id)
    .eq("status", "pending");

  // Build team list with roles
  const teams = (memberships ?? []).map((m: any) => ({ ...m.team, myRole: m.role }));

  // Fetch member avatars for each team (up to 4 per team)
  const teamIds = teams.map((t: any) => t.id);
  let teamMemberAvatars: Record<string, { first_name: string; last_name: string; avatar_url: string | null }[]> = {};

  if (teamIds.length > 0) {
    const { data: allMembers } = await supabase
      .from("team_members")
      .select("team_id, profile:profiles(first_name, last_name, avatar_url)")
      .in("team_id", teamIds)
      .order("joined_at", { ascending: true });

    if (allMembers) {
      for (const member of allMembers) {
        const tid = member.team_id;
        if (!teamMemberAvatars[tid]) teamMemberAvatars[tid] = [];
        if (teamMemberAvatars[tid].length < 4 && member.profile) {
          teamMemberAvatars[tid].push(member.profile as any);
        }
      }
    }
  }

  // Fetch challenge counts per team using count queries
  const teamChallengeCounts: Record<string, number> = {};

  if (teamIds.length > 0) {
    const countPromises = teamIds.map(async (id: string) => {
      const { count } = await supabase
        .from("team_challenges")
        .select("id", { count: "exact", head: true })
        .or(`challenger_team_id.eq.${id},challenged_team_id.eq.${id}`);
      return { id, count: count ?? 0 };
    });

    const counts = await Promise.all(countPromises);
    for (const { id, count } of counts) {
      teamChallengeCounts[id] = count;
    }
  }

  return (
    <TeamsPage
      userId={user.id}
      hasSignedCharter={!!charter}
      teams={teams}
      invitations={invitations ?? []}
      teamMemberAvatars={teamMemberAvatars}
      teamChallengeCounts={teamChallengeCounts}
    />
  );
}
