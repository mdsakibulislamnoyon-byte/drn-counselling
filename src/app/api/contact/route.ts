import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  message: z.string().trim().min(1).max(5000),
});

/**
 * Public contact form submission. Intentionally does not touch the
 * database — this is pre-account, non-PHI correspondence. Wire up
 * RESEND_API_KEY (see .env.example) to forward these to the practice inbox.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const payload = formData
    ? Object.fromEntries(formData.entries())
    : await request.json().catch(() => ({}));

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please fill out all fields with a valid email.' }, { status: 400 });
  }

  // TODO(phase 2): send via Resend to NEXT_PUBLIC_PRACTICE_EMAIL.
  console.info('Contact form submission received', { email: parsed.data.email });

  return NextResponse.redirect(new URL('/contact?sent=1', request.url), { status: 303 });
}
