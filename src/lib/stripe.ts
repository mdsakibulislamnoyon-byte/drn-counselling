import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/** Lazily-constructed Stripe client (server-only). */
export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripeClient;
}
