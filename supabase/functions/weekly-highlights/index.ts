import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString();

    // Get an admin user to post as
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (!adminProfile) {
      return new Response(JSON.stringify({ error: "No admin user found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Top scorer this week
    const { data: topScorer } = await supabase
      .from("match_player_stats")
      .select("user_id, goals, profile:profiles!match_player_stats_user_id_fkey(first_name, last_name)")
      .gte("match_id", weekAgoStr)
      .order("goals", { ascending: false })
      .limit(1)
      .single();

    // Most active player (most matches)
    const { data: mostActive } = await supabase
      .rpc("get_most_active_player_week", { since: weekAgoStr });

    // MVP count this week
    const { data: topMvp } = await supabase
      .from("match_player_stats")
      .select("user_id, profile:profiles!match_player_stats_user_id_fkey(first_name, last_name)")
      .eq("mvp", true)
      .gte("match_id", weekAgoStr)
      .limit(1)
      .single();

    // Build caption
    const lines: string[] = [];
    lines.push("🏆 Weekly Highlights");
    lines.push("");

    if (topScorer) {
      const p = topScorer.profile as any;
      lines.push(`⚽ Top Scorer: ${p?.first_name} ${p?.last_name} (${topScorer.goals} goals)`);
    }

    if (mostActive && Array.isArray(mostActive) && mostActive.length > 0) {
      const ma = mostActive[0];
      lines.push(`🔥 Most Active: ${ma.first_name} ${ma.last_name} (${ma.match_count} matches)`);
    }

    if (topMvp) {
      const p = topMvp.profile as any;
      lines.push(`🌟 MVP: ${p?.first_name} ${p?.last_name}`);
    }

    if (lines.length <= 2) {
      return new Response(JSON.stringify({ message: "Not enough data for highlights" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    lines.push("");
    lines.push("Keep playing and climbing the ranks! 💪");

    const caption = lines.join("\n");

    // Create the post
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_id: adminProfile.id,
        caption,
        visibility: "public",
        like_count: 0,
        comment_count: 0,
      })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, post_id: post.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
