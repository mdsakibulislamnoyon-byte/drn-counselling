import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { encryptFieldToPgHex, decryptFieldFromPgHex } from '@/lib/encryption';

/** Lists the caller's own wellness check-ins, most recent first. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { data, error } = await supabase
    .from('wellness_checkins')
    .select('*')
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: 'Unable to load check-ins.' }, { status: 500 });

  const checkins = (data ?? []).map((c) => ({
    id: c.id,
    moodRating: c.mood_rating,
    reflection: c.reflection_encrypted ? decryptFieldFromPgHex(c.reflection_encrypted as string) : null,
    createdAt: c.created_at,
  }));

  return NextResponse.json({ checkins });
}

const schema = z.object({
  moodRating: z.number().int().min(1).max(5),
  reflection: z.string().trim().max(2000).optional(),
});

/** Records a new mood/reflection check-in for the caller. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { moodRating, reflection } = parsed.data;

  const { error } = await supabase.from('wellness_checkins').insert({
    patient_id: user.id,
    mood_rating: moodRating,
    reflection_encrypted: reflection ? encryptFieldToPgHex(reflection) : null,
  });

  if (error) return NextResponse.json({ error: 'Unable to save check-in.' }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
