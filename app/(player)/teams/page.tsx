import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamsHub from "@/components/teams/TeamsHub";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: "Teams - FootMatch" }; }

export default async function TeamsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 1. User's teams ──
  const { data: memberships } = await supabase
    .from("team_members")
    .select("*, team:teams(*, captain:profiles!teams_captain_id_fkey(id, first_name, last_name, avatar_url))")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const teams = (memberships ?? []).map((m: any) => ({ ...m.team, myRole: m.role }));
  const myTeamIds: string[] = teams.map((t: any) => t.id);

  // ── 2. Pending invitations ──
  const { data: invitations } = await supabase
    .from("team_invitations")
    .select("*, team:teams(id, name, crest_url, crest_preset, member_count), inviter:profiles!team_invitations_inviter_id_fkey(id, first_name, last_name, avatar_url)")
    .eq("invitee_id", user.id)
    .eq("status", "pending");

  // ── 3. Member avatars (up to 4 per team) ──
  let teamMemberAvatars: Record<string, { first_name: string; last_name: string; avatar_url: string | null }[]> = {};
  if (myTeamIds.length > 0) {
    const { data: allMembers } = await supabase
      .from("team_members")
      .select("team_id, profile:profiles(first_name, last_name, avatar_url)")
      .in("team_id", myTeamIds)
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

  // ── 4. Challenge counts per team ──
  const teamChallengeCounts: Record<string, number> = {};
  if (myTeamIds.length > 0) {
    const countPromises = myTeamIds.map(async (id: string) => {
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

  // ── 5. Stats: challenges won / played ──
  let totalChallengesPlayed = 0;
  let totalChallengesWon = 0;

  if (myTeamIds.length > 0) {
    // All completed challenges involving my teams
    const { data: completedChallenges } = await supabase
      .from("team_challenges")
      .select("id, challenger_team_id, challenged_team_id, status")
      .eq("status", "completed")
      .or(myTeamIds.map((id: string) => `challenger_team_id.eq.${id},challenged_team_id.eq.${id}`).join(","));

    totalChallengesPlayed = completedChallenges?.length ?? 0;
    // For now, count completed as "won" if we're the challenger (simplified — can be refined with match results)
    totalChallengesWon = (completedChallenges ?? []).filter(
      (c: any) => myTeamIds.includes(c.challenger_team_id)
    ).length;
  }

  // ── 6. Upcoming challenges (accepted/scheduled) ──
  let upcomingChallenges: any[] = [];
  if (myTeamIds.length > 0) {
    const { data: upcoming } = await supabase
      .from("team_challenges")
      .select("id, status, proposed_date, challenger_team:teams!team_challenges_challenger_team_id_fkey(id, name, crest_url, crest_preset), challenged_team:teams!team_challenges_challenged_team_id_fkey(id, name, crest_url, crest_preset)")
      .in("status", ["proposed", "accepted", "scheduled"])
      .or(myTeamIds.map((id: string) => `challenger_team_id.eq.${id},challenged_team_id.eq.${id}`).join(","))
      .order("created_at", { ascending: false })
      .limit(3);
    upcomingChallenges = upcoming ?? [];
  }

  // ── 7. Team leaderboard (top 5 teams by completed challenges as challenger) ──
  const { data: allTeamsForLeaderboard } = await supabase
    .from("teams")
    .select("id, name, crest_url, crest_preset")
    .order("member_count", { ascending: false })
    .limit(20);

  let teamLeaderboard: { team_id: string; name: string; crest_url: string | null; crest_preset: string | null; wins: number }[] = [];
  if (allTeamsForLeaderboard && allTeamsForLeaderboard.length > 0) {
    const leaderboardIds = allTeamsForLeaderboard.map((t: any) => t.id);
    const { data: completedAll } = await supabase
      .from("team_challenges")
      .select("challenger_team_id")
      .eq("status", "completed")
      .in("challenger_team_id", leaderboardIds);

    const winMap = new Map<string, number>();
    for (const c of completedAll ?? []) {
      winMap.set(c.challenger_team_id, (winMap.get(c.challenger_team_id) ?? 0) + 1);
    }

    teamLeaderboard = allTeamsForLeaderboard
      .map((t: any) => ({ team_id: t.id, name: t.name, crest_url: t.crest_url, crest_preset: t.crest_preset, wins: winMap.get(t.id) ?? 0 }))
      .sort((a: any, b: any) => b.wins - a.wins)
      .slice(0, 5);
  }

  // ── 8. Discover: all teams (excluding user's) ──
  const { data: discoverTeams } = await supabase
    .from("teams")
    .select("id, name, description, crest_url, crest_preset, city, member_count")
    .order("member_count", { ascending: false })
    .limit(50);

  const myTeamIdSet = new Set(myTeamIds);
  const allPublicTeams = (discoverTeams ?? []).filter((t: any) => !myTeamIdSet.has(t.id));

  // ── 9. All my challenges across all teams ──
  let allMyChallenges: any[] = [];
  if (myTeamIds.length > 0) {
    const { data: myChallenges } = await supabase
      .from("team_challenges")
      .select("*, challenger_team:teams!team_challenges_challenger_team_id_fkey(id, name, crest_url, crest_preset, member_count), challenged_team:teams!team_challenges_challenged_team_id_fkey(id, name, crest_url, crest_preset, member_count)")
      .or(myTeamIds.map((id: string) => `challenger_team_id.eq.${id},challenged_team_id.eq.${id}`).join(","))
      .order("created_at", { ascending: false })
      .limit(50);

    // Determine which team is "mine" for each challenge and if I'm captain
    const captainTeamIds = new Set(teams.filter((t: any) => t.myRole === "captain").map((t: any) => t.id));

    allMyChallenges = (myChallenges ?? []).map((c: any) => {
      const myTeamId = myTeamIdSet.has(c.challenger_team_id) ? c.challenger_team_id : c.challenged_team_id;
      return {
        ...c,
        myTeamId,
        isCaptainOfTeam: captainTeamIds.has(myTeamId),
      };
    });
  }

  return (
    <TeamsHub
      userId={user.id}
      teams={teams}
      pendingInvitations={(invitations ?? []) as any}
      totalChallengesWon={totalChallengesWon}
      totalChallengesPlayed={totalChallengesPlayed}
      upcomingChallenges={upcomingChallenges}
      teamLeaderboard={teamLeaderboard}
      allPublicTeams={allPublicTeams}
      allMyChallenges={allMyChallenges}
      teamMemberAvatars={teamMemberAvatars}
      teamChallengeCounts={teamChallengeCounts}
    />
  );
}
