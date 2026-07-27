import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { encryptFieldToPgHex } from '@/lib/encryption';
import { logAudit } from '@/lib/audit';

/** Lists the current user's conversations with the other participant(s) resolved. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { data: participantRows } = await supabase
    .from('conversation_participants')
    .select('conversation_id, conversations(id, subject, context, last_message_at)')
    .eq('user_id', user.id);

  const conversationIds = (participantRows ?? []).map((r) => r.conversation_id);
  if (conversationIds.length === 0) return NextResponse.json({ conversations: [] });

  const { data: otherParticipants } = await supabase
    .from('conversation_participants')
    .select('conversation_id, profiles(id, full_name, role)')
    .in('conversation_id', conversationIds)
    .neq('user_id', user.id);

  const conversations = (participantRows ?? [])
    .map((r) => {
      const conv = Array.isArray(r.conversations) ? r.conversations[0] : r.conversations;
      const other = otherParticipants?.find((o) => o.conversation_id === r.conversation_id);
      const otherProfile = other && (Array.isArray(other.profiles) ? other.profiles[0] : other.profiles);
      return conv ? { ...conv, otherParticipant: otherProfile ?? null } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a && b ? +new Date(b.last_message_at) - +new Date(a.last_message_at) : 0));

  return NextResponse.json({ conversations });
}

const createSchema = z.object({
  recipientId: z.string().uuid(),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1),
  context: z.enum(['clinical', 'mentorship']).default('clinical'),
});

/** Starts a new conversation with a recipient and sends the first message. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { recipientId, subject, body, context } = parsed.data;

  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({ subject, context })
    .select('id')
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Unable to start conversation.' }, { status: 500 });
  }

  const { error: participantsError } = await supabase.from('conversation_participants').insert([
    { conversation_id: conversation.id, user_id: user.id },
    { conversation_id: conversation.id, user_id: recipientId },
  ]);

  if (participantsError) {
    return NextResponse.json({ error: 'Unable to add participants.' }, { status: 500 });
  }

  const { error: messageError } = await supabase.from('messages').insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    body_encrypted: encryptFieldToPgHex(body),
  });

  if (messageError) {
    return NextResponse.json({ error: 'Unable to send message.' }, { status: 500 });
  }

  await logAudit({ actorId: user.id, action: 'create', entityType: 'conversation', entityId: conversation.id });

  return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
}
