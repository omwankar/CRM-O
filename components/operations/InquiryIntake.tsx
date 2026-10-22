'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createOperationsEnquiry } from '@/lib/api/operations';
import { parseInquiry, INCOTERMS } from '@/lib/inquiryParser';
import { makeInqId } from '@/components/operations/inqId';
import { Avatar } from '@/components/operations/bits';

const MODES = ['Air', 'Ocean FCL', 'Ocean LCL', 'Land', 'Courier', 'Multimodal'];
const RECEIVED_BY = ['Shyam', 'Freeda', 'Outreach', 'General Email'];

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function htmlMode(mode?: string, loadType?: string) {
  const value = `${mode || ''} ${loadType || ''}`.toLowerCase();
  if (value.includes('air')) return 'Air';
  if (value.includes('fcl')) return 'Ocean FCL';
  if (value.includes('lcl')) return 'Ocean LCL';
  if (value.includes('courier') || value.includes('express')) return 'Courier';
  if (value.includes('land') || value.includes('road')) return 'Land';
  if (value.includes('sea') || value.includes('ocean')) return 'Ocean FCL';
  return '';
}

export function InquiryIntake({
  team,
  existingIds,
  onCreated,
  onCancel,
}: {
  team: Array<{ user_id: string; full_name: string }>;
  existingIds: string[];
  onCreated?: () => void;
  onCancel?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [found, setFound] = useState('');
  const [refId, setRefId] = useState('');
  const [manualId, setManualId] = useState(false);
  const [autofill, setAutofill] = useState<Record<string, boolean>>({});
  const [customer, setCustomer] = useState('');
  const [contact, setContact] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState('');
  const [incoterm, setIncoterm] = useState('');
  const [receivedOn, setReceivedOn] = useState(today());
  const [receivedBy, setReceivedBy] = useState('');
  const [cargo, setCargo] = useState('');
  const [notes, setNotes] = useState('');
  const [assigned, setAssigned] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mark = (key: string, on: boolean) => setAutofill((current) => ({ ...current, [key]: on }));

  const refreshId = (nextOrigin = origin, nextDest = destination, nextContact = contact, nextCompany = customer) => {
    if (manualId) return;
    if (!nextOrigin.trim() && !nextDest.trim()) {
      setRefId('');
      mark('ref', false);
      return;
    }
    setRefId(makeInqId(nextOrigin, nextDest, nextContact, nextCompany, existingIds));
    mark('ref', true);
  };

  const readEmail = (text: string) => {
    if (!text.trim()) {
      setFound('');
      return;
    }
    const parsed = parseInquiry(text);
    const nextMode = htmlMode(parsed.mode, parsed.loadType);
    const nextOrigin = parsed.origin;
    const nextDest = parsed.destination;
    const nextContact = parsed.senderName;
    const nextCompany = parsed.senderCompany;
    setContact(nextContact); mark('contact', Boolean(nextContact));
    setCEmail(parsed.senderEmail); mark('email', Boolean(parsed.senderEmail));
    setCPhone(parsed.senderPhone); mark('phone', Boolean(parsed.senderPhone));
    setCustomer(nextCompany); mark('customer', Boolean(nextCompany));
    setOrigin(nextOrigin); mark('origin', Boolean(nextOrigin));
    setDestination(nextDest); mark('destination', Boolean(nextDest));
    setMode(nextMode); mark('mode', Boolean(nextMode));
    setIncoterm(parsed.incoterm); mark('incoterm', Boolean(parsed.incoterm));
    setCargo([parsed.commodity, parsed.pieces, parsed.weight, parsed.dimensions].filter(Boolean).join(' · '));
    setNotes(text.trim()); mark('notes', true);
    if (parsed.readyDate) setReceivedOn(parsed.readyDate);
    if (!manualId) {
      if (nextOrigin || nextDest) {
        setRefId(makeInqId(nextOrigin, nextDest, nextContact, nextCompany, existingIds));
        mark('ref', true);
      }
    }
    const got = [
      nextContact && 'contact person',
      parsed.senderEmail && 'email',
      parsed.senderPhone && 'phone',
      nextCompany && 'company',
      nextOrigin && 'from',
      nextDest && 'to',
      nextMode && 'service',
      parsed.incoterm && 'incoterm',
    ].filter(Boolean);
    setFound(`Filled from the email: ${got.length ? got.join(', ') : 'nothing recognised'}. Yellow fields came from the email. Check them before saving.`);
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!email.trim()) {
      setFound('');
      return;
    }
    timer.current = setTimeout(() => readEmail(email), 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [email]);

  const saveMut = useMutation({
    mutationFn: () => {
      const id = refId.trim();
      if (!id) throw new Error('Enter the inquiry ID.');
      const lane = [origin, destination].filter(Boolean).join(' → ');
      const requirement = [lane && `${lane}${mode ? ` · ${mode}` : ''}${incoterm ? ` · ${incoterm}` : ''}`, cargo, notes].filter(Boolean).join('\n').trim();
      const padded = requirement.length >= 10 ? requirement : `${requirement || 'Freight enquiry'} `.padEnd(10, '.');
      return createOperationsEnquiry({
        enquiry_number: id,
        title: lane || customer || contact || id,
        requirement: padded,
        prospect_name: [contact, customer].filter(Boolean).join(' — ') || null,
        standalone_project_name: customer || null,
        client_email: cEmail || null,
        deadline: receivedOn || null,
        notes: [
          cPhone ? `Customer phone: ${cPhone}` : '',
          receivedBy ? `Received by: ${receivedBy}` : '',
          notes,
          email.trim() ? `--- Original email ---\n${email.trim().slice(0, 8000)}` : '',
        ].filter(Boolean).join('\n'),
        customer_contact: contact || null,
        customer_phone: cPhone || null,
        user_ids: assigned,
      });
    },
    onSuccess: (enquiry) => {
      toast.success(`${enquiry.enquiry_number} created`);
      onCreated?.();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const fieldClass = (key: string) => `field${autofill[key] ? ' autofill' : ''}`;

  return (
    <form
      className="modal wide"
      onSubmit={(event) => {
        event.preventDefault();
        saveMut.mutate();
      }}
    >
      <header>
        <h2>New inquiry</h2>
        <button className="btn ghost sm" type="button" onClick={onCancel}>Close</button>
      </header>
      <div className="mbody">
        <div className="full pastebox">
          <label htmlFor="f-email">
            <span className="lbl">1. Paste the customer&apos;s email</span>
            <textarea
              className="field"
              id="f-email"
              rows={6}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus
              placeholder="Copy the whole email (including the From line and signature) and paste it here. The details below fill in by themselves."
            />
          </label>
          <div className="acts" style={{ justifyContent: 'space-between' }}>
            <span className="hint">Fields fill in from the email. Check them before saving.</span>
            <button className="btn sm" type="button" onClick={() => readEmail(email)}>Read email again</button>
          </div>
          {found ? <div className="found"><b>{found}</b></div> : null}
        </div>
        <div className="full lbl" style={{ marginTop: 4 }}>2. Check the details, then pick who works on it</div>
        <label className="full" htmlFor="f-ref">
          Inquiry ID
          <input
            className={`${fieldClass('ref')} mono`}
            id="f-ref"
            value={refId}
            placeholder="Fills in by itself, e.g. CHE-LON-17/10"
            required
            onChange={(event) => {
              setManualId(Boolean(event.target.value));
              setRefId(event.target.value);
              mark('ref', false);
            }}
          />
        </label>
        <p className="hint full" style={{ margin: '-6px 0 0' }}>
          First 3 letters of origin · first 3 letters of destination · day/month added. If that route already has an inquiry today, the customer&apos;s first name is added.
        </p>
        <div className="full">
          <div className="lbl" style={{ marginBottom: 6 }}>Assign to</div>
          <div className="team">
            {team.map((person) => {
              const on = assigned.includes(person.user_id);
              return (
                <button
                  key={person.user_id}
                  className="tchip"
                  type="button"
                  aria-pressed={on}
                  onClick={() => setAssigned((current) => (on ? current.filter((id) => id !== person.user_id) : [...current, person.user_id]))}
                >
                  <Avatar name={person.full_name} size="s" />
                  {person.full_name}
                </button>
              );
            })}
          </div>
        </div>
        <label htmlFor="f-cust">Customer company<input className={fieldClass('customer')} id="f-cust" value={customer} onChange={(event) => { setCustomer(event.target.value); mark('customer', false); refreshId(origin, destination, contact, event.target.value); }} placeholder="Company name" /></label>
        <label htmlFor="f-cname">Contact person<input className={fieldClass('contact')} id="f-cname" value={contact} onChange={(event) => { setContact(event.target.value); mark('contact', false); refreshId(origin, destination, event.target.value, customer); }} placeholder="Name" /></label>
        <label htmlFor="f-cemail">Customer email<input className={fieldClass('email')} id="f-cemail" type="email" value={cEmail} onChange={(event) => { setCEmail(event.target.value); mark('email', false); }} placeholder="name@company.com" /></label>
        <label htmlFor="f-cphone">Customer phone<input className={fieldClass('phone')} id="f-cphone" type="tel" value={cPhone} onChange={(event) => { setCPhone(event.target.value); mark('phone', false); }} placeholder="+44 …" /></label>
        <label htmlFor="f-org">From (origin)<input className={fieldClass('origin')} id="f-org" value={origin} onChange={(event) => { setOrigin(event.target.value); mark('origin', false); refreshId(event.target.value, destination, contact, customer); }} placeholder="City, port or airport" /></label>
        <label htmlFor="f-dst">To (destination)<input className={fieldClass('destination')} id="f-dst" value={destination} onChange={(event) => { setDestination(event.target.value); mark('destination', false); refreshId(origin, event.target.value, contact, customer); }} placeholder="City, port or airport" /></label>
        <label htmlFor="f-mode">Service
          <select className={fieldClass('mode')} id="f-mode" value={mode} onChange={(event) => { setMode(event.target.value); mark('mode', false); refreshId(); }}>
            <option value="">—</option>
            {MODES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label htmlFor="f-inco">Incoterm
          <select className={fieldClass('incoterm')} id="f-inco" value={incoterm} onChange={(event) => { setIncoterm(event.target.value); mark('incoterm', false); }}>
            <option value="">—</option>
            {INCOTERMS.map((term) => <option key={term}>{term}</option>)}
          </select>
        </label>
        <label htmlFor="f-rec">Inquiry date<input className="field" id="f-rec" type="date" value={receivedOn} onChange={(event) => setReceivedOn(event.target.value)} /></label>
        <label htmlFor="f-rby">Received by
          <select className="field" id="f-rby" value={receivedBy} onChange={(event) => setReceivedBy(event.target.value)}>
            <option value="">—</option>
            {RECEIVED_BY.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="full" htmlFor="f-cargo">Cargo<input className="field" id="f-cargo" value={cargo} onChange={(event) => setCargo(event.target.value)} placeholder="e.g. 12 cartons · 620 kg · 3.2 cbm · general cargo" /></label>
        <label className="full" htmlFor="f-notes">Notes for the team<textarea className={fieldClass('notes')} id="f-notes" rows={4} value={notes} onChange={(event) => { setNotes(event.target.value); mark('notes', false); }} /></label>
      </div>
      <div className="mfoot">
        <span className="msg">{saveMut.error?.message || ''}</span>
        <button className="btn" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn pri" type="submit" disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving…' : 'Create and assign'}</button>
      </div>
    </form>
  );
}
