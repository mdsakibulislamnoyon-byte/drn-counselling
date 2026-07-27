import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface Params {
  params: Promise<{ number: string }>;
}

/**
 * Public certificate verification lookup (e.g. for an employer checking a
 * credential). Uses the service-role client because certificates has no
 * anonymous select policy — only the minimal fields needed to confirm
 * authenticity are returned, never the student's contact info.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { number } = await params;
  const supabase = createAdminClient();

  const { data: certificate } = await supabase
    .from('certificates')
    .select('certificate_number, issued_at, enrollments(courses(title), profiles!enrollments_student_id_fkey(full_name))')
    .eq('certificate_number', number)
    .maybeSingle();

  if (!certificate) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  const enrollment = (certificate as unknown as {
    enrollments: { courses: { title: string }; profiles: { full_name: string } };
  }).enrollments;

  return NextResponse.json({
    valid: true,
    certificateNumber: certificate.certificate_number,
    issuedAt: certificate.issued_at,
    courseTitle: enrollment?.courses?.title,
    studentName: enrollment?.profiles?.full_name,
  });
}
