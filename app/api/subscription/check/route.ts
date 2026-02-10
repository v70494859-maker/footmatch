import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("player_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const active =
    subscription?.status === "active" || subscription?.status === "trialing";

  return NextResponse.json({
    active,
    subscription: subscription ?? null,
  });
}
