import { createAdminClient } from '@/lib/supabase/admin';

interface AuditEntry {
  actorId: string | null;
  action: 'view' | 'create' | 'update' | 'delete' | 'export';
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Writes an append-only compliance record. Called from API routes any time
 * PHI-adjacent data (consents, insurance, clinical appointment notes,
 * messages) is created, read in bulk, updated, or exported.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('audit_log').insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
    ip_address: entry.ipAddress ?? null,
    user_agent: entry.userAgent ?? null,
  });

  if (error) {
    // Never let an audit-log failure block the underlying request, but do
    // surface it loudly — a silent gap here is a compliance risk.
    console.error('audit_log insert failed', error, entry);
  }
}
