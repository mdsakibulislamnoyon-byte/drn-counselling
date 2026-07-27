import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

/**
 * Stripe webhook handler. Uses the service-role Supabase client (see
 * src/lib/supabase/admin.ts) because there is no end-user session on an
 * incoming webhook request — every write here is on behalf of the platform,
 * not a specific RLS-scoped user.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? '', process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed.` }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { paymentId, courseId, userId, promoCodeId, installmentCount } = session.metadata ?? {};
      if (!paymentId || !courseId || !userId) break;

      await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        })
        .eq('id', paymentId);

      const { data: enrollment } = await supabase
        .from('enrollments')
        .insert({ student_id: userId, course_id: courseId, payment_id: paymentId })
        .select('id')
        .single();

      if (promoCodeId) {
        await supabase.rpc('increment_promo_redemption', { promo_id: promoCodeId });
      }

      if (session.mode === 'subscription' && typeof session.subscription === 'string' && enrollment) {
        await supabase.from('installment_plans').insert({
          payment_id: paymentId,
          stripe_subscription_id: session.subscription,
          total_amount_cents: session.amount_total ?? 0,
          installment_count: parseInt(installmentCount || '3', 10),
        });
      }

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'enrollment_confirmed',
        title: 'Enrollment confirmed',
        body: 'Your course purchase was successful. Your first module is ready.',
        link_url: '/student',
      });

      await logAudit({ actorId: userId, action: 'create', entityType: 'payment', entityId: paymentId });
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
      if (!subscriptionId) break;

      const { data: plan } = await supabase
        .from('installment_plans')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();

      if (!plan) break;

      const installmentsPaid = plan.installments_paid + 1;
      const completed = installmentsPaid >= plan.installment_count;

      await supabase
        .from('installment_plans')
        .update({ installments_paid: installmentsPaid, status: completed ? 'completed' : 'active' })
        .eq('id', plan.id);

      if (completed) {
        await stripe.subscriptions.cancel(subscriptionId);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
      if (subscriptionId) {
        await supabase
          .from('installment_plans')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
