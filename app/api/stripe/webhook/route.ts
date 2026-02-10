import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // ─── Subscription lifecycle ─────────────────────────────
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      // Look up the profile by stripe_customer_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!profile) {
        console.error(
          `Webhook: no profile found for Stripe customer ${customerId}`
        );
        break;
      }

      const status = mapStripeStatus(sub.status);

      // In Stripe v2024+, period dates are on subscription items
      const item = sub.items?.data?.[0];
      const periodStart = item?.current_period_start;
      const periodEnd = item?.current_period_end;

      await supabase.from("subscriptions").upsert(
        {
          player_id: profile.id,
          stripe_subscription_id: sub.id,
          status,
          ...(periodStart && {
            current_period_start: new Date(
              periodStart * 1000
            ).toISOString(),
          }),
          ...(periodEnd && {
            current_period_end: new Date(
              periodEnd * 1000
            ).toISOString(),
          }),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "player_id" }
      );

      // Notify on new subscription
      if (event.type === "customer.subscription.created") {
        await supabase.from("notifications").insert({
          user_id: profile.id,
          type: "subscription_activated",
          title: "Subscription activated!",
          body: "Welcome to FootMatch Premium. You can now join unlimited matches.",
          data: {},
        });
      }

      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!profile) {
        console.error(
          `Webhook: no profile found for Stripe customer ${customerId}`
        );
        break;
      }

      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq("player_id", profile.id);

      await supabase.from("notifications").insert({
        user_id: profile.id,
        type: "subscription_canceled",
        title: "Subscription canceled",
        body: "Your FootMatch Premium subscription has been canceled.",
        data: {},
      });

      break;
    }

    // ─── Payment failure ────────────────────────────────────
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (!customerId) break;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!profile) break;

      await supabase
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("player_id", profile.id);

      break;
    }

    // ─── Connect account updates ────────────────────────────
    case "account.updated": {
      const account = event.data.object as Stripe.Account;

      const chargesEnabled = account.charges_enabled ?? false;
      const payoutsEnabled = account.payouts_enabled ?? false;
      const onboarded = chargesEnabled && payoutsEnabled;

      await supabase
        .from("operators")
        .update({
          stripe_onboarded: onboarded,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_account_id", account.id);

      break;
    }
  }

  return NextResponse.json({ received: true });
}

/**
 * Maps Stripe subscription status to our internal SubscriptionStatus type.
 */
function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): string {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    case "trialing":
      return "trialing";
    case "paused":
      return "canceled";
    default:
      return "incomplete";
  }
}
