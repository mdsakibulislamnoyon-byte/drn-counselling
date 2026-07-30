import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'FAQ' };

const FAQS = [
  {
    q: 'Do I need to sign anything before I can use the patient portal?',
    a: 'Yes. Every new account must digitally sign our HIPAA Acknowledgment and Privacy Consent form during registration. Your signature, name, and timestamp are stored securely for compliance and shown to you again any time from your profile.',
  },
  {
    q: 'How are my messages with Dominick protected?',
    a: 'Messages are encrypted before they are stored and can only be read by participants in the conversation — you, and the provider or staff member you are messaging.',
  },
  {
    q: 'How does course content unlock in the academy?',
    a: 'Courses use a drip schedule: modules unlock automatically on a weekly cadence starting from your enrollment date, so you can pace your learning without being overwhelmed on day one.',
  },
  {
    q: 'What happens after I finish a course?',
    a: 'Once every module is complete, a Certificate of Completion is generated automatically, and you get one year of included messaging support with Dominick.',
  },
  {
    q: 'Can I pay for a course in installments?',
    a: 'Yes, select courses support installment checkout in addition to one-time payment, and promo codes can be applied at checkout.',
  },
  {
    q: 'Is telehealth available?',
    a: 'Yes. Telehealth sessions are booked the same way as in-person sessions and include a secure video link sent ahead of your appointment.',
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl text-ink-900">Frequently asked questions</h1>
      <div className="mt-10 divide-y divide-ink-100">
        {FAQS.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="cursor-pointer list-none font-medium text-ink-900 marker:content-none">
              {item.q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
