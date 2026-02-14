import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { SubmitResultsPayload } from "@/types";
import { processMatchCompletion } from "@/lib/gamification/xp-engine";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getOperator() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: operator } = await supabase
    .from("operators")
    .select("id, profile_id")
    .eq("profile_id", user.id)
    .single();

  return operator;
}

export async function POST(req: NextRequest) {
  const operator = await getOperator();
  if (!operator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as SubmitResultsPayload;

  if (!body.match_id || !body.player_stats?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify match belongs to this operator
  const { data: match } = await serviceClient
    .from("matches")
    .select("id, title, operator_id, city, date, start_time")
    .eq("id", body.match_id)
    .single();

  if (!match || match.operator_id !== operator.id) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // Check no results exist yet
  const { data: existing } = await serviceClient
    .from("match_results")
    .select("id")
    .eq("match_id", body.match_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Results already submitted" }, { status: 409 });
  }

  // 1. Insert match_results
  const { error: resultError } = await serviceClient.from("match_results").insert({
    match_id: body.match_id,
    operator_id: operator.id,
    score_team_a: body.score_team_a,
    score_team_b: body.score_team_b,
    duration_minutes: body.duration_minutes,
    match_quality: body.match_quality,
    notes: body.notes || null,
  });

  if (resultError) {
    return NextResponse.json({ error: resultError.message }, { status: 500 });
  }

  // 2. Batch insert player stats
  const statsRows = body.player_stats.map((ps) => ({
    match_id: body.match_id,
    user_id: ps.user_id,
    team: ps.attended ? ps.team : null,
    goals: ps.goals,
    assists: ps.assists,
    attended: ps.attended,
    mvp: ps.mvp,
    yellow_card: ps.yellow_card,
    red_card: ps.red_card,
  }));

  const { error: statsError } = await serviceClient
    .from("match_player_stats")
    .insert(statsRows);

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  // 3. Update match status to completed
  await serviceClient
    .from("matches")
    .update({ status: "completed" })
    .eq("id", body.match_id);

  // 4. Send notifications to all confirmed registered players
  const { data: registrations } = await serviceClient
    .from("match_registrations")
    .select("player_id")
    .eq("match_id", body.match_id)
    .eq("status", "confirmed");

  if (registrations && registrations.length > 0) {
    const notifications = registrations.map((r) => ({
      user_id: r.player_id,
      type: "match_results_available" as const,
      title: "Résultats disponibles !",
      body: `Les résultats du match "${match.title}" sont disponibles. Consultez vos stats !`,
      data: { match_id: body.match_id },
    }));

    await serviceClient.from("notifications").insert(notifications);
  }

  // 5. MVP notification
  const mvpPlayer = body.player_stats.find((ps) => ps.mvp);
  if (mvpPlayer) {
    await serviceClient.from("notifications").insert({
      user_id: mvpPlayer.user_id,
      type: "match_mvp" as const,
      title: "MVP du match !",
      body: `Tu as été élu MVP du match "${match.title}" ! Bravo !`,
      data: { match_id: body.match_id },
    });
  }

  // 6. Process gamification (XP + badges)
  try {
    await processMatchCompletion(
      serviceClient,
      body.match_id,
      { city: match.city, date: match.date, start_time: match.start_time },
      body.player_stats.map((ps) => ({
        user_id: ps.user_id,
        attended: ps.attended,
        mvp: ps.mvp,
      }))
    );
  } catch (err) {
    console.error("[gamification] Error processing match:", err);
  }

  // 7. Auto-generate match recap post
  try {
    const { data: fullMatch } = await serviceClient
      .from("matches")
      .select("*")
      .eq("id", body.match_id)
      .single();

    if (fullMatch) {
      // Find MVP name
      const mvpStat = body.player_stats.find((ps) => ps.mvp);
      let mvpName: string | null = null;
      if (mvpStat) {
        const { data: mvpProfile } = await serviceClient
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", mvpStat.user_id)
          .single();
        if (mvpProfile) mvpName = `${mvpProfile.first_name} ${mvpProfile.last_name}`;
      }

      // Build caption
      const resultLabel =
        body.score_team_a > body.score_team_b
          ? "Victoire Equipe A"
          : body.score_team_b > body.score_team_a
            ? "Victoire Equipe B"
            : "Match nul";

      const captionParts = [
        `${resultLabel} ${body.score_team_a} - ${body.score_team_b}`,
        `${fullMatch.venue_name}, ${fullMatch.city}`,
      ];
      if (mvpName) captionParts.push(`MVP: ${mvpName}`);
      if (body.notes) captionParts.push(body.notes);

      const { data: recapPost } = await serviceClient
        .from("posts")
        .insert({
          author_id: operator.profile_id,
          caption: captionParts.join(" | "),
          visibility: "public",
          match_id: body.match_id,
          like_count: 0,
          comment_count: 0,
        })
        .select("id")
        .single();

      // Attach match image as first media if available
      if (recapPost && fullMatch.image_url) {
        await serviceClient.from("post_media").insert({
          post_id: recapPost.id,
          media_type: "image",
          media_url: fullMatch.image_url,
          sort_order: 0,
        });
      }
    }
  } catch (err) {
    console.error("[social] Error creating match recap post:", err);
  }

  return NextResponse.json({ ok: true });
}
