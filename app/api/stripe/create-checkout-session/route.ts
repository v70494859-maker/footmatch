import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/config";
import { createSubscriptionCheckoutSession } from "@/lib/stripe/checkout";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch user profile
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("id, email, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Check for existing active subscription
  const { data: existingSub } = await serviceSupabase
    .from("subscriptions")
    .select("id, status")
    .eq("player_id", user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (existingSub) {
    return NextResponse.json(
      { error: "You already have an active subscription" },
      { status: 400 }
    );
  }

  // Get or create Stripe customer
  let customerId = profile.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe().customers.create({
      email: user.email || profile.email || undefined,
      metadata: { profileId: profile.id },
    });

    customerId = customer.id;

    await serviceSupabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", profile.id);
  }

  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID!;

  if (!priceId) {
    return NextResponse.json(
      { error: "Price not configured" },
      { status: 500 }
    );
  }

  try {
    const session = await createSubscriptionCheckoutSession({
      customerId,
      priceId,
      profileId: profile.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Failed to create checkout session:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create checkout session: ${message}` },
      { status: 500 }
    );
  }
}
