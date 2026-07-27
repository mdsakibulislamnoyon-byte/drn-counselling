-- ============================================================================
-- 00000000000009_payments_promo_codes.sql
-- Stripe-backed payments (course checkout + optional patient billing) and
-- promo/discount codes applied at checkout.
-- ============================================================================

create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique,
  description text,
  discount_type discount_type not null,
  -- percent: 1-100. fixed_amount: cents.
  discount_value integer not null check (discount_value > 0),
  -- null = applies to any course; set = restricted to one course.
  course_id uuid references courses (id) on delete cascade,
  max_redemptions integer,
  times_redeemed integer not null default 0,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  is_active boolean not null default true,
  stripe_coupon_id text, -- mirrors this code as a Stripe Coupon/PromotionCode
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index promo_codes_active_idx on promo_codes (is_active);

create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete restrict,
  type payment_type not null,
  status payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_invoice_id text, -- for patient billing / installment invoices
  course_id uuid references courses (id),
  promo_code_id uuid references promo_codes (id),
  discount_amount_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_user_idx on payments (user_id);
create index payments_status_idx on payments (status);
create unique index payments_checkout_session_idx
  on payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create trigger payments_set_updated_at
  before update on payments
  for each row execute function set_updated_at();

alter table enrollments
  add constraint enrollments_payment_fkey
  foreign key (payment_id) references payments (id) on delete set null;

-- Course purchases paid over time via a Stripe Subscription (installments).
create table installment_plans (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments (id) on delete cascade,
  stripe_subscription_id text not null unique,
  total_amount_cents integer not null,
  installment_count integer not null check (installment_count > 1),
  installments_paid integer not null default 0,
  status text not null default 'active', -- active | completed | past_due | cancelled
  created_at timestamptz not null default now()
);

create index installment_plans_payment_idx on installment_plans (payment_id);
