'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppointmentStatus } from '@/types/database';

export function AppointmentActions({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: AppointmentStatus) {
    setLoading(true);
    await fetch(`/api/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  if (status === 'cancelled' || status === 'completed' || status === 'no_show') {
    return null;
  }

  return (
    <div className="flex gap-2">
      {status === 'requested' && (
        <button disabled={loading} onClick={() => updateStatus('confirmed')} className="btn-primary">
          Confirm
        </button>
      )}
      {status === 'confirmed' && (
        <button disabled={loading} onClick={() => updateStatus('completed')} className="btn-secondary">
          Mark completed
        </button>
      )}
      <button disabled={loading} onClick={() => updateStatus('cancelled')} className="btn-ghost">
        Cancel
      </button>
    </div>
  );
}
