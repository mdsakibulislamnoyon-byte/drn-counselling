import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

interface Params {
  params: Promise<{ id: string }>;
}

const schema = z.object({ isPublished: z.boolean() });

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const { error } = await supabase
    .from('courses')
    .update({ is_published: parsed.data.isPublished })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Unable to update course.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
