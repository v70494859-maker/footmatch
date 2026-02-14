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

  const enriched = (posts ?? []).map(p => ({
    ...p,
    user_has_liked: likedPostIds.includes(p.id),
  }));

  return NextResponse.json({ posts: enriched });
}
