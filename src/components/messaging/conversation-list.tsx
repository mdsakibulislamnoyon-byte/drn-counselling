'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationSummary {
  id: string;
  subject: string | null;
  context: 'clinical' | 'mentorship';
  last_message_at: string;
  otherParticipant: { id: string; full_name: string; role: string } | null;
}

export function ConversationList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/messages')
      .then((res) => res.json())
      .then((body) => setConversations(body.conversations ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink-700">Loading conversations…</p>;
  if (conversations.length === 0) return <p className="text-sm text-ink-700">No conversations yet.</p>;

  return (
    <div className="space-y-1">
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
            selectedId === c.id ? 'bg-brand-50 text-brand-800' : 'hover:bg-ink-50'
          }`}
        >
          <p className="font-medium text-ink-900">{c.otherParticipant?.full_name ?? 'Care team'}</p>
          <p className="truncate text-xs text-ink-700">{c.subject}</p>
          <p className="text-[10px] text-ink-700">
            {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
          </p>
        </button>
      ))}
    </div>
  );
}
