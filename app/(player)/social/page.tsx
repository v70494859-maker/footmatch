import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SocialHub from "@/components/social/SocialHub";
import type { FriendshipWithProfile } from "@/types";

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

  // Fetch total accepted friends count
  const { count: totalFriendsCount } = await supabase
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  // Fetch user's teams count
  const { count: teamCount } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Fetch unread messages count
  const { count: unreadCount } = await supabase
    .from("conversation_participants")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("last_read_at", "is", null)
    .filter("last_read_at", "lt", "last_message_at");

  // Fetch 5 recent accepted friends with profile data
  const { data: recentFriendships } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    .limit(5);

  const typedFriendships = (recentFriendships as FriendshipWithProfile[]) ?? [];

  // Extract friend profiles (the OTHER user in each friendship)
  const friendProfiles = typedFriendships.map((f) => {
    const profile = f.requester_id === user.id ? f.addressee : f.requester;
    return profile;
  });

  // Fetch gamification data for those friend user IDs
  const friendIds = friendProfiles.map((p) => p.id);
  const { data: friendGamification } = friendIds.length > 0
    ? await supabase
        .from("player_gamification")
        .select("user_id, level")
        .in("user_id", friendIds)
    : { data: [] };

  const gamificationMap = new Map(
    (friendGamification ?? []).map((g: { user_id: string; level: number }) => [g.user_id, g.level])
  );

  const recentFriends = friendProfiles.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    avatar_url: p.avatar_url,
    city: p.city,
    favorite_club: p.favorite_club,
    origin_country: p.origin_country,
    level: gamificationMap.get(p.id) ?? 1,
  }));

  // Fetch first team the user belongs to
  const { data: teamMembership } = await supabase
    .from("team_members")
    .select("team_id, teams:team_id(id, name, crest_url, crest_preset, city, member_count)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  let firstTeam: {
    id: string;
    name: string;
    crest_url: string | null;
    crest_preset: string | null;
    city: string | null;
    member_count: number;
    challenge_count: number;
  } | null = null;

  if (teamMembership?.teams) {
    const team = teamMembership.teams as unknown as {
      id: string;
      name: string;
      crest_url: string | null;
      crest_preset: string | null;
      city: string | null;
      member_count: number;
    };

    // Count challenges for this team
    const { count: challengeCount } = await supabase
      .from("team_challenges")
      .select("id", { count: "exact", head: true })
      .or(`challenger_team_id.eq.${team.id},challenged_team_id.eq.${team.id}`);

    firstTeam = {
      id: team.id,
      name: team.name,
      crest_url: team.crest_url,
      crest_preset: team.crest_preset,
      city: team.city,
      member_count: team.member_count,
      challenge_count: challengeCount ?? 0,
    };
  }

  // Fetch latest post from feed with author + first media
  const { data: latestPostData } = await supabase
    .from("posts")
    .select("id, caption, created_at, author:profiles!posts_author_id_fkey(first_name, last_name, avatar_url), post_media(media_url, thumbnail_url, sort_order)")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let latestPost: {
    id: string;
    caption: string | null;
    created_at: string;
    author: { first_name: string; last_name: string; avatar_url: string | null };
    thumbnail_url: string | null;
  } | null = null;

  if (latestPostData) {
    const author = latestPostData.author as unknown as { first_name: string; last_name: string; avatar_url: string | null };
    const media = (latestPostData.post_media as unknown as { media_url: string; thumbnail_url: string | null; sort_order: number }[]) ?? [];
    const firstMedia = media.sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;

    latestPost = {
      id: latestPostData.id,
      caption: latestPostData.caption,
      created_at: latestPostData.created_at,
      author,
      thumbnail_url: firstMedia?.thumbnail_url ?? firstMedia?.media_url ?? null,
    };
  }

  // Fetch user's own gamification
  const { data: userGamification } = await supabase
    .from("player_gamification")
    .select("level, total_xp, current_streak")
    .eq("user_id", user.id)
    .single();

  // Fetch total matches played
  const { count: matchesPlayed } = await supabase
    .from("match_registrations")
    .select("id", { count: "exact", head: true })
    .eq("player_id", user.id)
    .eq("status", "confirmed");

  return (
    <SocialHub
      pendingFriendRequests={pendingCount ?? 0}
      totalFriends={totalFriendsCount ?? 0}
      teamCount={teamCount ?? 0}
      unreadMessages={unreadCount ?? 0}
      recentFriends={recentFriends}
      firstTeam={firstTeam}
      latestPost={latestPost}
      userLevel={userGamification?.level ?? 1}
      userXp={userGamification?.total_xp ?? 0}
      userStreak={userGamification?.current_streak ?? 0}
      matchesPlayed={matchesPlayed ?? 0}
    />
  );
}
