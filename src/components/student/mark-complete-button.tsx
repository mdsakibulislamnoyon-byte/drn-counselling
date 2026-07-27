'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function MarkCompleteButton({ lessonId, completed }: { lessonId: string; completed: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch(`/api/lms/lessons/${lessonId}/complete`, { method: 'POST' });
    if (res.ok) {
      const body = await res.json();
      setJustCompleted(true);
      if (body.courseCompleted) {
        // eslint-disable-next-line no-alert
        alert('Congratulations — you completed the course! Your certificate is ready.');
      }
      router.refresh();
    }
    setLoading(false);
  }

  if (completed || justCompleted) {
    return <span className="badge bg-brand-50 text-brand-700">Completed</span>;
  }

  return (
    <button onClick={handleClick} disabled={loading} className="btn-primary">
      {loading ? 'Saving…' : 'Mark lesson complete'}
    </button>
  );
}
