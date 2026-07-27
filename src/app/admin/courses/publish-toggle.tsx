'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PublishToggle({ courseId, isPublished }: { courseId: string; isPublished: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={toggle} disabled={loading} className={isPublished ? 'btn-secondary' : 'btn-primary'}>
      {isPublished ? 'Unpublish' : 'Publish'}
    </button>
  );
}
