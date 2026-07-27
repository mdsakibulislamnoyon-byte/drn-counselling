import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

const schema = z.object({
  courseId: z.string().uuid(),
  promoCode: z.string().trim().optional(),
  paymentPlan: z.enum(['full', 'installments']).default('full'),
  installmentCount: z.number().int().min(2).max(12).optional(),
});

/**
 * Creates a Stripe Checkout Session for a course purchase. Promo codes are
 * validated server-side against `promo_codes` (never exposed to the client
 * directly — see the "no client select policy" note in migration 012) and
 * applied as a Stripe Coupon. `paymentPlan: 'installments'` creates a
 * subscription-mode session; the webhook handler cancels the subscription
 * automatically once `installment_count` charges have succeeded.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { courseId, promoCode, paymentPlan, installmentCount } = parsed.data;

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('is_published', true)
    .maybeSingle();

  if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

  const { data: existingEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existingEnrollment) {
    return NextResponse.json({ error: 'You are already enrolled in this course.' }, { status: 400 });
  }

  let discountAmountCents = 0;
  let promoCodeId: string | null = null;
  let stripeCouponId: string | undefined;

  if (promoCode) {
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('*')
      .ilike('code', promoCode)
      .eq('is_active', true)
      .maybeSingle();

    const isValid =
      promo &&
      (!promo.course_id || promo.course_id === courseId) &&
      (!promo.max_redemptions || promo.times_redeemed < promo.max_redemptions) &&
      (!promo.valid_until || new Date(promo.valid_until) > new Date());

    if (!isValid) {
      return NextResponse.json({ error: 'This promo code is not valid.' }, { status: 400 });
    }

    promoCodeId = promo.id;
    discountAmountCents =
      promo.discount_type === 'percent'
        ? Math.round((course.price_cents * promo.discount_value) / 100)
        : Math.min(promo.discount_value, course.price_cents);
    stripeCouponId = promo.stripe_coupon_id ?? undefined;
  }

  const netAmountCents = Math.max(course.price_cents - discountAmountCents, 0);
  const stripe = getStripe();

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      type: paymentPlan === 'installments' ? 'course_installment' : 'course_purchase',
      status: 'pending',
      amount_cents: netAmountCents,
      course_id: courseId,
      promo_code_id: promoCodeId,
      discount_amount_cents: discountAmountCents,
    })
    .select('id')
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: 'Unable to start checkout.' }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: paymentPlan === 'installments' ? 'subscription' : 'payment',
    customer_email: user.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: course.currency,
          unit_amount:
            paymentPlan === 'installments'
              ? Math.ceil(netAmountCents / (installmentCount ?? 3))
              : netAmountCents,
          product_data: { name: course.title },
          ...(paymentPlan === 'installments' ? { recurring: { interval: 'month' as const } } : {}),
        },
        quantity: 1,
      },
    ],
    ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
    success_url: `${siteUrl}/student?checkout=success`,
    cancel_url: `${siteUrl}/courses/${course.slug}?checkout=cancelled`,
    metadata: {
      paymentId: payment.id,
      courseId,
      userId: user.id,
      promoCodeId: promoCodeId ?? '',
      installmentCount: paymentPlan === 'installments' ? String(installmentCount ?? 3) : '',
    },
  });

  await supabase.from('payments').update({ stripe_checkout_session_id: session.id }).eq('id', payment.id);

  return NextResponse.json({ url: session.url });
}
