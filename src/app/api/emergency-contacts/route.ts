import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('patient_id', user.id)
    .order('created_at');

  if (error) return NextResponse.json({ error: 'Unable to load contacts.' }, { status: 500 });
  return NextResponse.json({ contacts: data });
}

const schema = z.object({
  fullName: z.string().trim().min(1),
  relationship: z.string().trim().min(1),
  phone: z.string().trim().min(7),
  email: z.string().trim().email().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { fullName, relationship, phone, email } = parsed.data;

  const { error } = await supabase.from('emergency_contacts').insert({
    patient_id: user.id,
    full_name: fullName,
    relationship,
    phone,
    email: email || null,
  });

  if (error) return NextResponse.json({ error: 'Unable to add contact.' }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
