import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/config";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subscriptionId } = await req.json();

  if (!subscriptionId) {
    return NextResponse.json(
      { error: "Missing subscriptionId" },
      { status: 400 }
    );
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subscription } = await serviceSupabase
    .from("subscriptions")
    .select("stripe_subscription_id, player_id")
    .eq("id", subscriptionId)
    .single();

  if (!subscription || subscription.player_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!subscription.stripe_subscription_id) {
    return NextResponse.json(
      { error: "No Stripe subscription linked" },
      { status: 400 }
    );
  }

  try {
    await stripe().subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    await serviceSupabase
      .from("subscriptions")
      .update({ cancel_at_period_end: false })
      .eq("id", subscriptionId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to reactivate subscription:", err);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
