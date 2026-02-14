import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SavedFeed from "@/components/social/SavedFeed";
import type { PostWithDetails } from "@/types";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: "Saved Posts - FootMatch" }; }

export default async function SavedPostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch bookmarked post IDs
  const { data: bookmarks } = await supabase
    .from("post_bookmarks")
    .select("post_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const postIds = (bookmarks ?? []).map((b: any) => b.post_id);

  let posts: PostWithDetails[] = [];

  if (postIds.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url, city, origin_country, favorite_club), post_media(*)")
      .in("id", postIds);

    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);

    const likedPostIds = (likes ?? []).map((l: any) => l.post_id);

    const postMap = new Map((data ?? []).map((p: any) => [p.id, p]));
    posts = postIds
      .map((id: string) => postMap.get(id))
      .filter(Boolean)
      .map((p: any) => ({
        ...p,
        user_has_liked: likedPostIds.includes(p.id),
        user_has_bookmarked: true,
      }));
  }

  return <SavedFeed userId={user.id} initialPosts={posts} />;
}
