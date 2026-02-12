import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SocialFeed from "@/components/social/SocialFeed";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Feed - FootMatch" };
}

export default async function FeedRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch initial feed posts (public + friends' posts)
  const { data: posts } = await supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url, city), post_media(*)")
    .order("created_at", { ascending: false })
    .limit(20);

  // Check which posts user has liked
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

  const enrichedPosts = (posts ?? []).map(p => ({
    ...p,
    user_has_liked: likedPostIds.includes(p.id),
  }));

  return <SocialFeed userId={user.id} initialPosts={enrichedPosts} />;
}
