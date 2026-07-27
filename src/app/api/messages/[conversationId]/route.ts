import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { encryptFieldToPgHex, decryptFieldFromPgHex } from '@/lib/encryption';
import { logAudit } from '@/lib/audit';

interface Params {
  params: Promise<{ conversationId: string }>;
}

/** Returns decrypted messages for a conversation the caller participates in (RLS-enforced). */
export async function GET(_request: NextRequest, { params }: Params) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at');

  if (error) return NextResponse.json({ error: 'Unable to load messages.' }, { status: 500 });

  const decrypted = (messages ?? []).map((m) => ({
    id: m.id,
    senderId: m.sender_id,
    createdAt: m.created_at,
    body: decryptFieldFromPgHex(m.body_encrypted as string),
  }));

  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);

  await logAudit({ actorId: user.id, action: 'view', entityType: 'conversation', entityId: conversationId });

  return NextResponse.json({ messages: decrypted });
}

const sendSchema = z.object({ body: z.string().trim().min(1) });

/** Sends a message into an existing conversation the caller participates in. */
export async function POST(request: NextRequest, { params }: Params) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = sendSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body_encrypted: encryptFieldToPgHex(parsed.data.body),
  });

  if (error) return NextResponse.json({ error: 'Unable to send message.' }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 201 });
}
