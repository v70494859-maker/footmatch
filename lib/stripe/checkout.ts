import { stripe } from "./config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      type: "subscription",
      profileId,
    },
    success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
    cancel_url: `${appUrl}/payment/cancel?type=subscription`,
  });

  return session;
}
