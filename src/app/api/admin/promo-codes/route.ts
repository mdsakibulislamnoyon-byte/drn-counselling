import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  code: z.string().trim().min(3).max(40),
  description: z.string().trim().optional(),
  discountType: z.enum(['percent', 'fixed_amount']),
  discountValue: z.number().int().min(1),
  courseId: z.string().uuid().optional(),
  maxRedemptions: z.number().int().min(1).optional(),
  validUntil: z.string().datetime().optional(),
});

/** Requires billing.manage_promo_codes (granted to admin by default). */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  const { code, description, discountType, discountValue, courseId, maxRedemptions, validUntil } = parsed.data;

  const { error } = await supabase.from('promo_codes').insert({
    code: code.toUpperCase(),
    description: description ?? null,
    discount_type: discountType,
    discount_value: discountValue,
    course_id: courseId ?? null,
    max_redemptions: maxRedemptions ?? null,
    valid_until: validUntil ?? null,
    created_by: user.id,
  });

  if (error) return NextResponse.json({ error: 'Unable to create promo code (it may already exist).' }, { status: 400 });
  return NextResponse.json({ success: true }, { status: 201 });
}
