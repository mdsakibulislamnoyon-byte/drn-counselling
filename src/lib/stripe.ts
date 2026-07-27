import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/** Lazily-constructed Stripe client (server-only). */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add your Stripe API keys to the environment before using checkout.'
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripeClient;
}
