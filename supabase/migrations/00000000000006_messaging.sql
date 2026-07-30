-- ============================================================================
-- 00000000000006_messaging.sql
-- Encrypted direct messaging between patients/students and the practice.
-- Message bodies are encrypted application-side before insert (PHI).
-- ============================================================================

create table conversations (
  id uuid primary key default gen_random_uuid(),
  subject text,
  -- 'clinical' = patient <-> provider/staff; 'mentorship' = student <-> Dominick
  -- during the 1-year post-course support window.
  context text not null default 'clinical' check (context in ('clinical', 'mentorship')),
  related_enrollment_id uuid, -- fk added in migration 008 after enrollments exists
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table conversation_participants (
  conversation_id uuid not null references conversations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create index conversation_participants_user_idx on conversation_participants (user_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id),
  body_encrypted bytea not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, created_at);

create or replace function touch_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on messages
  for each row execute function touch_conversation_last_message();
