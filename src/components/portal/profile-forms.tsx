'use client';

import { useEffect, useState } from 'react';
import type { Profile } from '@/types/database';

export function ContactInfoForm({ profile }: { profile: Profile }) {
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    setSaving(false);
    setSaved(res.ok);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Full name</label>
        <input className="input bg-ink-50" value={profile.full_name} disabled />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input bg-ink-50" value={profile.email} disabled />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone</label>
        <input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <button type="submit" disabled={saving} className="btn-secondary">
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
      </button>
    </form>
  );
}

export function InsuranceForm() {
  const [providerName, setProviderName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [groupNumber, setGroupNumber] = useState('');
  const [subscriberName, setSubscriberName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/insurance')
      .then((res) => res.json())
      .then((body) => {
        if (body.insurance) {
          setProviderName(body.insurance.providerName);
          setPolicyNumber(body.insurance.policyNumber);
          setGroupNumber(body.insurance.groupNumber ?? '');
          setSubscriberName(body.insurance.subscriberName);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/insurance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerName, policyNumber, groupNumber, subscriberName }),
    });
    setSaving(false);
    setSaved(res.ok);
  }

  if (loading) return <p className="text-sm text-ink-700">Loading…</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="providerName">Insurance provider</label>
        <input id="providerName" className="input" value={providerName} onChange={(e) => setProviderName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="policyNumber">Policy number</label>
          <input id="policyNumber" className="input" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="groupNumber">Group number</label>
          <input id="groupNumber" className="input" value={groupNumber} onChange={(e) => setGroupNumber(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="subscriberName">Subscriber name</label>
        <input id="subscriberName" className="input" value={subscriberName} onChange={(e) => setSubscriberName(e.target.value)} required />
      </div>
      <button type="submit" disabled={saving} className="btn-secondary">
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save insurance info'}
      </button>
      <p className="text-xs text-ink-700">Encrypted before storage — visible only to you and authorized staff.</p>
    </form>
  );
}

interface EmergencyContact {
  id: string;
  full_name: string;
  relationship: string;
  phone: string;
}

export function EmergencyContactsForm() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  function loadContacts() {
    fetch('/api/emergency-contacts')
      .then((res) => res.json())
      .then((body) => setContacts(body.contacts ?? []));
  }

  useEffect(loadContacts, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/emergency-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, relationship, phone }),
    });
    if (res.ok) {
      setFullName('');
      setRelationship('');
      setPhone('');
      loadContacts();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {contacts.map((c) => (
          <div key={c.id} className="rounded-xl bg-ink-50 p-3 text-sm">
            <p className="font-medium text-ink-900">{c.full_name} <span className="font-normal text-ink-700">· {c.relationship}</span></p>
            <p className="text-ink-700">{c.phone}</p>
          </div>
        ))}
        {contacts.length === 0 && <p className="text-sm text-ink-700">No emergency contacts on file.</p>}
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
        <input className="input" placeholder="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input className="input" placeholder="Relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} required />
        <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <button type="submit" disabled={saving} className="btn-secondary col-span-3">
          {saving ? 'Adding…' : 'Add contact'}
        </button>
      </form>
    </div>
  );
}
