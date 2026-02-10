import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/config";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get operator record
  const { data: operator } = await supabase
    .from("operators")
    .select("id, stripe_account_id")
    .eq("profile_id", user.id)
    .single();

  if (!operator) {
    return NextResponse.json(
      { error: "Operator account not found" },
      { status: 404 }
    );
  }

  // Get profile info for Stripe account creation
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 }
    );
  }

  try {
    let accountId = operator.stripe_account_id;

    // Create Stripe Connect Express account if not already created
    if (!accountId) {
      const stripeClient = stripe();
      const account = await stripeClient.accounts.create({
        type: "express",
        email: profile.email ?? undefined,
        business_profile: {
          name: `${profile.first_name} ${profile.last_name}`,
          product_description: "Football match hosting via FootMatch",
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      // Save Stripe account ID to operators table using service role
      const { error: updateError } = await supabaseAdmin
        .from("operators")
        .update({ stripe_account_id: accountId })
        .eq("id", operator.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to save Stripe account" },
          { status: 500 }
        );
      }
    }

    // Generate onboarding link
    const stripeClient = stripe();
    const accountLink = await stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/operator/payouts`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/operator/payouts`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Stripe Connect error:", err);
    return NextResponse.json(
      { error: "Failed to create Stripe account" },
      { status: 500 }
    );
  }
}
