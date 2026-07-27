'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationList } from './conversation-list';
import { ConversationView } from './conversation-view';

interface Recipient {
  id: string;
  full_name: string;
}

export function Messenger({
  currentUserId,
  recipients,
  defaultContext = 'clinical',
}: {
  currentUserId: string;
  recipients: Recipient[];
  defaultContext?: 'clinical' | 'mentorship';
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [recipientId, setRecipientId] = useState(recipients[0]?.id ?? '');
  const [subject, setSubject] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleStartConversation(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId, subject, body: firstMessage, context: defaultContext }),
    });
    if (res.ok) {
      const body = await res.json();
      setComposing(false);
      setSubject('');
      setFirstMessage('');
      setSelectedId(body.conversationId);
      router.refresh();
    }
    setSending(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div>
        <button onClick={() => setComposing((v) => !v)} className="btn-secondary w-full">
          {composing ? 'Cancel' : 'New message'}
        </button>

        {composing && (
          <form onSubmit={handleStartConversation} className="card mt-3 space-y-3">
            <div>
              <label className="label">To</label>
              <select className="input" value={recipientId} onChange={(e) => setRecipientId(e.target.value)}>
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>{r.full_name}</option>
                ))}
              </select>
            </div>
            <input
              className="input"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <textarea
              className="input"
              placeholder="Message"
              rows={3}
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              required
            />
            <button type="submit" disabled={sending || !recipientId} className="btn-primary w-full">
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        )}

        <div className="mt-4">
          <ConversationList selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>

      <div>
        {selectedId ? (
          <ConversationView conversationId={selectedId} currentUserId={currentUserId} />
        ) : (
          <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-dashed border-ink-100 text-sm text-ink-700">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
}
