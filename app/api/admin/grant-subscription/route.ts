import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function isAdmin(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

// POST — Grant free subscription (30 days)
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { player_id } = await req.json();
  if (!player_id) {
    return NextResponse.json({ error: "player_id required" }, { status: 400 });
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { error } = await serviceClient
    .from("subscriptions")
    .upsert(
      {
        player_id,
        status: "active",
        stripe_subscription_id: null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      },
      { onConflict: "player_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send notification
  await serviceClient.from("notifications").insert({
    user_id: player_id,
    type: "subscription_activated",
    title: "Abonnement activé !",
    body: "Un administrateur vous a accordé un accès premium gratuit. Profitez-en !",
    data: {},
  });

  return NextResponse.json({ ok: true });
}

// DELETE — Revoke subscription
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { player_id } = await req.json();
  if (!player_id) {
    return NextResponse.json({ error: "player_id required" }, { status: 400 });
  }

  const { error } = await serviceClient
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("player_id", player_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
