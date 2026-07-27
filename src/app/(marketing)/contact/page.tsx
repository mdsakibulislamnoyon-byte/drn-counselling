import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-serif text-4xl text-ink-900">Contact</h1>
      <p className="mt-4 text-ink-700">
        For clinical questions or to discuss urgent needs, existing patients should use secure
        messaging inside the patient portal. For general inquiries, reach out below.
      </p>
      <form className="card mt-8 space-y-4" action="/api/contact" method="POST">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input className="input" id="name" name="name" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="message">Message</label>
          <textarea className="input" id="message" name="message" rows={5} required />
        </div>
        <button type="submit" className="btn-primary w-full">Send message</button>
      </form>
      <p className="mt-6 text-sm text-ink-700">
        If you are experiencing a medical emergency, please call 911 or go to your nearest
        emergency room. For a mental health crisis, you can also call or text 988 (Suicide &amp;
        Crisis Lifeline).
      </p>
    </div>
  );
}
