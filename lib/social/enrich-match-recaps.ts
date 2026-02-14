import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostWithDetails, MatchRecapData } from "@/types";

export async function enrichMatchRecaps(
  supabase: SupabaseClient,
  posts: PostWithDetails[]
): Promise<PostWithDetails[]> {
  const recapPosts = posts.filter((p) => p.match_id);
  if (recapPosts.length === 0) return posts;

  const matchIds = recapPosts.map((p) => p.match_id!);

  const [
    { data: matches },
    { data: results },
    { data: playerStats },
  ] = await Promise.all([
    supabase.from("matches").select("*").in("id", matchIds),
    supabase.from("match_results").select("*").in("match_id", matchIds),
    supabase
      .from("match_player_stats")
      .select(
        "*, profile:profiles!match_player_stats_user_id_fkey(id, first_name, last_name, avatar_url, origin_country, favorite_club)"
      )
      .in("match_id", matchIds),
  ]);

  // Fetch operators for these matches
  const operatorIds = [...new Set((matches ?? []).map((m: any) => m.operator_id))];
  const { data: operators } = operatorIds.length > 0
    ? await supabase
        .from("operators")
        .select(
          "id, profile_id, rating, total_matches, profile:profiles!operators_profile_id_fkey(id, first_name, last_name, avatar_url, origin_country, favorite_club, city)"
        )
        .in("id", operatorIds)
    : { data: [] };

  // Build lookup maps
  const matchMap = new Map((matches ?? []).map((m: any) => [m.id, m]));
  const resultMap = new Map((results ?? []).map((r: any) => [r.match_id, r]));
  const statsMap = new Map<string, any[]>();
  for (const s of playerStats ?? []) {
    const arr = statsMap.get(s.match_id) ?? [];
    arr.push(s);
    statsMap.set(s.match_id, arr);
  }
  const operatorMap = new Map((operators ?? []).map((o: any) => [o.id, o]));

  return posts.map((post) => {
    if (!post.match_id) return post;

    const match = matchMap.get(post.match_id);
    const result = resultMap.get(post.match_id);
    const stats = statsMap.get(post.match_id) ?? [];
    const op = match ? operatorMap.get(match.operator_id) : null;

    if (!match || !result) return post;

    return {
      ...post,
      match_recap: {
        match,
        match_result: result,
        player_stats: stats,
        operator: op,
      } as MatchRecapData,
    };
  });
}
