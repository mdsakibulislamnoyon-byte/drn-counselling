'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface DecryptedMessage {
  id: string;
  senderId: string;
  createdAt: string;
  body: string;
}

export function ConversationView({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadMessages() {
    setLoading(true);
    const res = await fetch(`/api/messages/${conversationId}`);
    if (res.ok) {
      const body = await res.json();
      setMessages(body.messages);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const res = await fetch(`/api/messages/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: draft }),
    });
    if (res.ok) {
      setDraft('');
      await loadMessages();
    }
    setSending(false);
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-2xl border border-ink-100 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-ink-700">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-700">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                m.senderId === currentUserId
                  ? 'ml-auto bg-brand-600 text-white'
                  : 'bg-ink-50 text-ink-900'
              }`}
            >
              <p>{m.body}</p>
              <p className={`mt-1 text-[10px] ${m.senderId === currentUserId ? 'text-brand-100' : 'text-ink-700'}`}>
                {format(new Date(m.createdAt), 'MMM d, h:mm a')}
              </p>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-ink-100 p-3">
        <input
          className="input"
          placeholder="Write a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" disabled={sending} className="btn-primary shrink-0">
          Send
        </button>
      </form>
    </div>
  );
}
