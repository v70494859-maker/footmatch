import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  let query = supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url, city, origin_country, favorite_club), post_media(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

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
