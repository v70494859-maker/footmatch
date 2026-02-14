import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PostWithDetails } from "@/types";
import PostCard from "@/components/social/PostCard";
import MatchRecapCard from "@/components/social/MatchRecapCard";
import { enrichMatchRecaps } from "@/lib/social/enrich-match-recaps";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("caption, author:profiles!posts_author_id_fkey(first_name, last_name)")
    .eq("id", id)
    .single();

  if (!post) return { title: "Post - FootMatch" };
  const author = post.author as any;
  return {
    title: `${author?.first_name} ${author?.last_name} - FootMatch`,
    description: post.caption?.slice(0, 160) ?? "",
  };
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: post } = await supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url, city, origin_country, favorite_club), post_media(*)")
    .eq("id", id)
    .single();

  if (!post) notFound();

  // Enrich with user data
  const { data: likes } = await supabase
    .from("post_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", id);

  const { data: bookmarks } = await supabase
    .from("post_bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", id);

  // Poll
  let postPoll = null;
  const { data: poll } = await supabase
    .from("post_polls")
    .select("*, poll_options(*)")
    .eq("post_id", id)
    .maybeSingle();

  if (poll) {
    const options = (poll as any).poll_options ?? [];
    const { data: userVote } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", poll.id)
      .eq("user_id", user.id)
      .maybeSingle();

    const totalVotes = options.reduce((sum: number, o: any) => sum + o.vote_count, 0);
    postPoll = {
      ...poll,
      poll_options: options.sort((a: any, b: any) => a.sort_order - b.sort_order),
      user_voted_option_id: userVote?.option_id ?? null,
      total_votes: totalVotes,
    };
  }

  let enriched: PostWithDetails = {
    ...post as any,
    user_has_liked: (likes ?? []).length > 0,
    user_has_bookmarked: (bookmarks ?? []).length > 0,
    post_poll: postPoll,
  };

  // Enrich match recap if applicable
  const [enrichedPost] = await enrichMatchRecaps(supabase, [enriched]);
  enriched = enrichedPost;

  const isMatchRecap = enriched.match_id && enriched.match_recap;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <a
        href="/social"
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-300 transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Social
      </a>
      {isMatchRecap ? (
        <MatchRecapCard
          post={enriched}
          currentUserId={user.id}
          currentUserRole={profile?.role}
          onCommentAdded={() => {}}
        />
      ) : (
        <PostCard
          post={enriched}
          currentUserId={user.id}
          onCommentAdded={() => {}}
        />
      )}
    </div>
  );
}
