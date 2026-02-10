import { stripe } from "./config";
import { headers } from "next/headers";

async function getAppUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host") || "www.footmatch.ch";
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

/**
 * Creates a Stripe Checkout session in subscription mode.
 */
export async function createSubscriptionCheckoutSession({
  customerId,
  priceId,
  profileId,
}: {
  customerId: string;
  priceId: string;
  profileId: string;
}) {
  const appUrl = await getAppUrl();

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 7,
    },
    metadata: {
      type: "subscription",
      profileId,
    },
    success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
    cancel_url: `${appUrl}/payment/cancel?type=subscription`,
  });

  return session;
}
