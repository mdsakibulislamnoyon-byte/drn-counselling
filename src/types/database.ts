/**
 * Hand-maintained mirror of the Supabase schema (supabase/migrations/*.sql).
 * Regenerate/reconcile with `supabase gen types typescript` once a live
 * project exists — see docs/ROADMAP.md phase 1.
 */

export type UserRole = 'patient' | 'provider' | 'staff' | 'student' | 'admin';

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentType =
  | 'initial_consult'
  | 'individual_session'
  | 'family_session'
  | 'telehealth'
  | 'in_person';

export type EnrollmentStatus = 'active' | 'completed' | 'refunded' | 'cancelled';

export type LessonProgressStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export type PaymentType =
  | 'course_purchase'
  | 'course_installment'
  | 'patient_copay'
  | 'patient_invoice';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';

export type DiscountType = 'percent' | 'fixed_amount';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProviderProfile {
  id: string;
  credentials: string | null;
  license_state: string | null;
  specialties: string[];
  bio: string | null;
  accepting_new_patients: boolean;
  updated_at: string;
}

export interface ConsentDocument {
  id: string;
  document_type: 'hipaa_acknowledgment' | 'privacy_consent' | 'telehealth_consent';
  version: string;
  title: string;
  body_md: string;
  is_current: boolean;
  published_at: string;
}

export interface HipaaConsent {
  id: string;
  user_id: string;
  consent_document_id: string;
  body_md_snapshot: string;
  signature_full_name: string;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
}

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  status: AppointmentStatus;
  type: AppointmentType;
  start_time: string;
  end_time: string;
  is_telehealth: boolean;
  telehealth_link: string | null;
  location: string | null;
  patient_notes: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  provider_id: string;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
  recurrence_rule: string | null;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description_md: string;
  thumbnail_url: string | null;
  price_cents: number;
  currency: string;
  drip_interval_days: number;
  mentorship_months: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  position: number;
  drip_day_offset: number | null;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  position: number;
  content_md: string | null;
  mux_asset_id: string | null;
  mux_playback_id: string | null;
  duration_seconds: number | null;
  is_preview: boolean;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  payment_id: string | null;
  enrolled_at: string;
  completed_at: string | null;
  drip_anchor_at: string;
}

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  status: LessonProgressStatus;
  unlocked_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  watch_seconds: number;
}

export interface Certificate {
  id: string;
  enrollment_id: string;
  certificate_number: string;
  issued_at: string;
  pdf_url: string | null;
  mentorship_expires_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  type: PaymentType;
  status: PaymentStatus;
  amount_cents: number;
  currency: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  course_id: string | null;
  promo_code_id: string | null;
  discount_amount_cents: number;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  course_id: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

export interface Conversation {
  id: string;
  subject: string | null;
  context: 'clinical' | 'mentorship';
  related_enrollment_id: string | null;
  created_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body_encrypted: string; // decrypted to plain string app-side before use
  attachment_url: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  channel: 'in_app' | 'email' | 'sms';
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}
