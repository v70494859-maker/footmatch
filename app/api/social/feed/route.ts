import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  // Get user's friend IDs for visibility filtering
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  // Get user's team IDs for team-visibility posts
  const { data: teamMemberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const teamIds = (teamMemberships ?? []).map((m) => m.team_id);

  // Build query: public posts + friends-only from friends + team-only from teammates
  let query = supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url, city, origin_country, favorite_club), post_media(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Visibility filter: user sees their own posts + public + friends-only from friends + team-only from team members
  const visibilityFilters = [`author_id.eq.${user.id}`, `visibility.eq.public`];

  if (friendIds.length > 0) {
    visibilityFilters.push(
      `and(visibility.eq.friends,author_id.in.(${friendIds.join(",")}))`
    );
  }

  if (teamIds.length > 0) {
    // Get all members from user's teams for team-visibility filtering
    const { data: allTeamMembers } = await supabase
      .from("team_members")
      .select("user_id")
      .in("team_id", teamIds);

    const teamMemberIds = [...new Set((allTeamMembers ?? []).map((m) => m.user_id))];
    if (teamMemberIds.length > 0) {
      visibilityFilters.push(
        `and(visibility.eq.team,author_id.in.(${teamMemberIds.join(",")}))`
      );
    }
  }

  query = query.or(visibilityFilters.join(","));

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check likes
  const postIds = (posts ?? []).map(p => p.id);
  let likedPostIds: string[] = [];
  if (postIds.length > 0) {
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    likedPostIds = (likes ?? []).map(l => l.post_id);
  }

  let bookmarkedPostIds: string[] = [];
  if (postIds.length > 0) {
    const { data: bookmarks } = await supabase
      .from("post_bookmarks")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    bookmarkedPostIds = (bookmarks ?? []).map(b => b.post_id);
  }

  // Polls
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

  const enriched = (posts ?? []).map(p => ({
    ...p,
    user_has_liked: likedPostIds.includes(p.id),
    user_has_bookmarked: bookmarkedPostIds.includes(p.id),
    post_poll: pollsByPostId[p.id] ?? null,
  }));

  return NextResponse.json({ posts: enriched });
}
