import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SocialLayout from "@/components/social/SocialLayout";

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
    .select("id, first_name, last_name, avatar_url, city, origin_country, favorite_club, role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // ── Gamification ──
  const { data: gamification } = await supabase
    .from("player_gamification")
    .select("level, total_xp, current_streak")
    .eq("user_id", user.id)
    .single();

  // ── Social counts ──
  const { count: friendCount } = await supabase
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const { count: teamCount } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

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

  // ── Feed: initial 20 posts ──
  const { data: posts } = await supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url, city, origin_country, favorite_club), post_media(*)")
    .order("created_at", { ascending: false })
    .limit(20);

  const postIds = (posts ?? []).map((p: any) => p.id);
  let likedPostIds: string[] = [];
  if (postIds.length > 0) {
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    likedPostIds = (likes ?? []).map((l: any) => l.post_id);
  }

  let bookmarkedPostIds: string[] = [];
  if (postIds.length > 0) {
    const { data: bookmarks } = await supabase
      .from("post_bookmarks")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    bookmarkedPostIds = (bookmarks ?? []).map((b: any) => b.post_id);
  }

  // ── Polls ──
  let pollsByPostId: Record<string, any> = {};
  if (postIds.length > 0) {
    const { data: polls } = await supabase
      .from("post_polls")
      .select("*, poll_options(*)")
      .in("post_id", postIds);

    if (polls && polls.length > 0) {
      const pollIds = polls.map((p: any) => p.id);
      const { data: userVotes } = await supabase
        .from("poll_votes")
        .select("poll_id, option_id")
        .eq("user_id", user.id)
        .in("poll_id", pollIds);

      const voteMap = new Map((userVotes ?? []).map((v: any) => [v.poll_id, v.option_id]));

      for (const poll of polls) {
        const options = (poll as any).poll_options ?? [];
        const totalVotes = options.reduce((sum: number, o: any) => sum + o.vote_count, 0);
        pollsByPostId[poll.post_id] = {
          ...poll,
          poll_options: options.sort((a: any, b: any) => a.sort_order - b.sort_order),
          user_voted_option_id: voteMap.get(poll.id) ?? null,
          total_votes: totalVotes,
        };
      }
    }
  }

  const enrichedPosts = (posts ?? []).map((p: any) => ({
    ...p,
    user_has_liked: likedPostIds.includes(p.id),
    user_has_bookmarked: bookmarkedPostIds.includes(p.id),
    post_poll: pollsByPostId[p.id] ?? null,
  }));

  // ── Right sidebar: pending friend requests (3) ──
  const { data: pendingFriendRequests } = await supabase
    .from("friendships")
    .select("id, requester:profiles!friendships_requester_id_fkey(id, first_name, last_name, avatar_url)")
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(3);

  // ── Right sidebar: recent challenges (3) ──
  // Get user's team IDs first
  const { data: myTeamMemberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const myTeamIds = (myTeamMemberships ?? []).map((m: any) => m.team_id);

  let recentChallenges: any[] = [];
  if (myTeamIds.length > 0) {
    const { data: challenges } = await supabase
      .from("team_challenges")
      .select("id, status, created_at, challenger_team:teams!team_challenges_challenger_team_id_fkey(id, name, crest_url, crest_preset), challenged_team:teams!team_challenges_challenged_team_id_fkey(id, name, crest_url, crest_preset)")
      .or(myTeamIds.map((id: string) => `challenger_team_id.eq.${id},challenged_team_id.eq.${id}`).join(","))
      .order("created_at", { ascending: false })
      .limit(3);
    recentChallenges = challenges ?? [];
  }

  // ── Right sidebar: trending posts (5 most liked) ──
  const { data: trendingPosts } = await supabase
    .from("posts")
    .select("id, caption, like_count, created_at")
    .gt("like_count", 0)
    .order("like_count", { ascending: false })
    .limit(5);

  return (
    <SocialLayout
      userId={user.id}
      isAdmin={isAdmin}
      profile={profile!}
      level={gamification?.level ?? 1}
      totalXp={gamification?.total_xp ?? 0}
      currentStreak={gamification?.current_streak ?? 0}
      friendCount={friendCount ?? 0}
      teamCount={teamCount ?? 0}
      matchesPlayed={matchesPlayed ?? 0}
      pendingRequests={pendingRequests ?? 0}
      unreadMessages={unreadMessages ?? 0}
      initialPosts={enrichedPosts}
      pendingFriendRequests={(pendingFriendRequests ?? []) as any}
      recentChallenges={recentChallenges}
      trendingPosts={(trendingPosts ?? []) as any}
    />
  );
}
