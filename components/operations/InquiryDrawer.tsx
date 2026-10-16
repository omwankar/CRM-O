'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, Loader2, Star } from 'lucide-react';
import { getEnquiry, updateEnquiry } from '@/lib/api/enquiries';
import {
  addOperationsAgent,
  assignOperationsPeople,
  chooseOperationsBest,
  closeOperationsEnquiry,
  deleteOperationsEnquiry,
  joinOperationsEnquiry,
  postInquiryUpdate,
  saveOperationsRate,
  type AgentSend,
  type DirectoryAgent,
  type PipelineInquiry,
} from '@/lib/api/operations';
import { AgePill, Avatar, StatusPill } from '@/components/operations/bits';
import { formatRoute, money } from '@/components/operations/opsVisual';
import { formatUkDate, formatUkDateTime } from '@/lib/date';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { opsFontClass } from '@/components/operations/opsFonts';

const field = 'h-9 w-full rounded-[7px] border bg-[var(--ops-surface)] px-3 text-sm outline-none';
const label = 'mb-1 block text-[11px] font-medium uppercase tracking-wide';

export function InquiryDrawer({
  inquiry,
  userId,
  isSuperAdmin,
  team,
  agents,
  onChanged,
  onDismiss,
}: {
  inquiry: PipelineInquiry | null;
  userId?: string;
  isSuperAdmin?: boolean;
  team: Array<{ user_id: string; full_name: string }>;
  agents: DirectoryAgent[];
  onChanged: () => void;
  onDismiss: () => void;
}) {
  return (
    <Sheet open={Boolean(inquiry)} onOpenChange={(open) => { if (!open) onDismiss(); }}>
      <SheetContent side="right" className={`${opsFontClass} ops w-full max-w-[720px] gap-0 border-0 p-0 data-[state=closed]:duration-200 data-[state=open]:duration-200 sm:max-w-[720px]`} style={{ background: 'var(--ops-surface)', color: 'var(--ops-fg)' }}>
        <SheetTitle className="sr-only">{inquiry?.enquiry_number || 'Inquiry'}</SheetTitle>
        {inquiry ? (
          <DrawerBody
            inquiry={inquiry}
            userId={userId}
            isSuperAdmin={isSuperAdmin}
            team={team}
            agents={agents}
            onChanged={onChanged}
            onDismiss={onDismiss}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({
  inquiry,
  userId,
  isSuperAdmin,
  team,
  agents,
  onChanged,
  onDismiss,
}: {
  inquiry: PipelineInquiry;
  userId?: string;
  isSuperAdmin?: boolean;
  team: Array<{ user_id: string; full_name: string }>;
  agents: DirectoryAgent[];
  onChanged: () => void;
  onDismiss: () => void;
}) {
  const qc = useQueryClient();
  const { data: enquiry, isLoading } = useQuery({ queryKey: ['enquiry', inquiry.id], queryFn: () => getEnquiry(inquiry.id) });
  const [editing, setEditing] = useState(false);
  const [customer, setCustomer] = useState('');
  const [title, setTitle] = useState('');
  const [requirement, setRequirement] = useState('');
  const [email, setEmail] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [update, setUpdate] = useState('');
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<'close' | 'delete' | null>(null);

  useEffect(() => {
    if (!enquiry) return;
    setCustomer(enquiry.prospect_name || '');
    setTitle(enquiry.title || '');
    setRequirement(enquiry.requirement || '');
    setEmail(enquiry.client_email || '');
    setDeadline(enquiry.deadline ? enquiry.deadline.slice(0, 10) : '');
    setPriority(enquiry.priority || 'medium');
    setNotes(enquiry.notes || '');
  }, [enquiry]);

  useEffect(() => {
    setAssignedIds(inquiry.operators.map((operator) => operator.user_id));
  }, [inquiry.id, inquiry.operators]);

  const working = inquiry.operators.some((operator) => operator.user_id === userId) || Boolean(isSuperAdmin);
  const bests = inquiry.sends.filter((send) => send.is_best && send.quoted_price != null);
  const route = formatRoute(inquiry);
  const customerName = inquiry.prospect_name || inquiry.title || 'Inquiry';

  const refreshEnquiry = () => {
    qc.invalidateQueries({ queryKey: ['enquiry', inquiry.id] });
    onChanged();
  };

  const saveMut = useMutation({
    mutationFn: () => updateEnquiry(inquiry.id, {
      prospect_name: customer.trim() || null,
      title: title.trim() || null,
      requirement: requirement.trim(),
      client_email: email.trim() || null,
      deadline: deadline || null,
      priority,
      notes: notes.trim() || null,
    }),
    onSuccess: () => { toast.success('Inquiry saved'); setEditing(false); refreshEnquiry(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const assignMut = useMutation({
    mutationFn: () => assignOperationsPeople(inquiry.id, assignedIds),
    onSuccess: () => { toast.success('People on this inquiry updated'); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const joinMut = useMutation({
    mutationFn: () => joinOperationsEnquiry(inquiry.id),
    onSuccess: () => { toast.success('You are working this enquiry'); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const agentMut = useMutation({
    mutationFn: (mode: 'typed' | 'saved') => addOperationsAgent(inquiry.id, mode === 'saved'
      ? { saved_agent_ids: picked }
      : { agent_name: company.trim(), contact_name: contact.trim() || null, contact_email: agentEmail.trim() || null }),
    onSuccess: () => { setCompany(''); setContact(''); setAgentEmail(''); setPicked([]); toast.success('Agent added'); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateMut = useMutation({
    mutationFn: () => postInquiryUpdate(inquiry.id, update.trim()),
    onSuccess: () => { setUpdate(''); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const closeMut = useMutation({
    mutationFn: () => closeOperationsEnquiry(inquiry.id),
    onSuccess: () => { toast.success('Inquiry closed'); setConfirm(null); onDismiss(); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMut = useMutation({
    mutationFn: () => deleteOperationsEnquiry(inquiry.id),
    onSuccess: () => { toast.success('Inquiry deleted'); setConfirm(null); onDismiss(); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const grouped = inquiry.sends.reduce<Record<string, AgentSend[]>>((acc, send) => {
    (acc[send.user_name] ||= []).push(send);
    return acc;
  }, {});

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="sticky top-0 z-10 border-b px-5 py-4 pr-12" style={{ background: 'var(--ops-surface)', borderColor: 'var(--ops-line-soft)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ops-muted)' }}>Inquiry ID</p>
        <h2 className="ops-mono text-[21px] font-semibold leading-tight">{inquiry.enquiry_number}</h2>
        <p className="mt-1 text-[15px] font-semibold">{customerName}</p>
        <p className="ops-mono mt-0.5 text-sm" style={{ color: 'var(--ops-muted)' }}>{route}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPill column={inquiry.column} />
          <AgePill createdAt={inquiry.created_at} />
          <span className="ops-mono text-xs" style={{ color: 'var(--ops-muted)' }}>{formatUkDate(inquiry.created_at)}</span>
          <Link href={`/dashboard/enquiries/${inquiry.id}`} className="ml-auto text-sm font-medium" style={{ color: 'var(--ops-accent)' }}>Open in CRM</Link>
        </div>
      </header>

      <div className="ops-scroll min-h-0 flex-1 overflow-y-auto">
        {isLoading && !enquiry ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <>
            <section className="border-b px-5 py-4" style={{ borderColor: 'var(--ops-line-soft)' }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Who works this inquiry</h3>
                {isSuperAdmin ? (
                  <button type="button" disabled={assignMut.isPending} onClick={() => assignMut.mutate()} className="h-9 shrink-0 rounded-[7px] px-3 text-sm font-medium text-white disabled:opacity-50" style={{ background: 'var(--ops-accent)' }}>
                    Save people
                  </button>
                ) : null}
              </div>
              {isSuperAdmin ? (
                <div className="flex flex-wrap gap-2">
                  {team.map((person) => {
                    const on = assignedIds.includes(person.user_id);
                    return (
                      <button
                        key={person.user_id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setAssignedIds((current) => (on ? current.filter((id) => id !== person.user_id) : [...current, person.user_id]))}
                        className="inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1 text-sm"
                        style={on
                          ? { background: 'var(--ops-accent-soft)', borderColor: 'var(--ops-accent)', color: 'var(--ops-accent)' }
                          : { borderStyle: 'dashed', borderColor: 'var(--ops-line)', color: 'var(--ops-muted)', opacity: 0.55 }}
                      >
                        <Avatar name={person.full_name} size={22} />
                        {person.full_name}
                      </button>
                    );
                  })}
                </div>
              ) : working && inquiry.operators.some((operator) => operator.user_id === userId) ? (
                <div className="flex flex-wrap gap-2">
                  {inquiry.operators.map((operator) => (
                    <span key={operator.user_id} className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm" style={{ background: 'var(--ops-sunk)' }}>
                      <Avatar name={operator.full_name} size={22} />
                      {operator.full_name}
                    </span>
                  ))}
                </div>
              ) : (
                <button type="button" disabled={joinMut.isPending} onClick={() => joinMut.mutate()} className="h-9 rounded-[7px] border px-3 text-sm font-medium" style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }}>
                  Join this inquiry
                </button>
              )}
            </section>

            {bests.length > 0 ? (
              <section className="border-b px-5 py-4" style={{ borderColor: 'var(--ops-line-soft)' }}>
                <h3 className="mb-2 text-sm font-semibold">Best quote</h3>
                <div className="space-y-2">
                  {bests.map((send) => (
                    <div key={send.id} className="rounded-[10px] px-3 py-3" style={{ background: 'var(--ops-ok-soft)', color: 'var(--ops-ok)' }}>
                      <p className="ops-mono text-xl font-semibold">{money(send.quoted_price, send.currency)}</p>
                      <p className="text-sm">{send.agent_name}</p>
                      <p className="text-xs">chosen by {send.user_name}</p>
                      {send.notes ? (
                        <details className="mt-1 text-xs">
                          <summary>Quote</summary>
                          <p className="mt-1 whitespace-pre-wrap">{send.notes}</p>
                        </details>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="border-b px-5 py-4" style={{ borderColor: 'var(--ops-line-soft)' }}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Agents and quotes</h3>
                <span className="ops-mono text-xs" style={{ color: 'var(--ops-muted)' }}>{inquiry.sends.length} contacted</span>
              </div>
              {working ? (
                <>
                  <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                    <input className={field} style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }} list="ops-agent-companies" value={company} onChange={(event) => { const value = event.target.value; setCompany(value); const match = agents.find((agent) => agent.company_name === value); if (match) { setContact(match.contact_name || ''); setAgentEmail(match.email || ''); } }} placeholder="Agent company" aria-label="Agent company" />
                    <datalist id="ops-agent-companies">{agents.map((agent) => <option key={agent.id} value={agent.company_name} />)}</datalist>
                    <input className={field} style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }} value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Contact" aria-label="Contact person" />
                    <input className={field} style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }} value={agentEmail} onChange={(event) => setAgentEmail(event.target.value)} placeholder="Email" aria-label="Agent email" />
                    <button type="button" disabled={agentMut.isPending || company.trim().length < 2} onClick={() => agentMut.mutate('typed')} className="h-9 rounded-[7px] px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40" style={{ background: 'var(--ops-accent)' }}>
                      Add agent
                    </button>
                  </div>
                  {agents.length > 0 ? (
                    <div className="mt-3 rounded-[10px] border p-3" style={{ borderColor: 'var(--ops-line-soft)' }}>
                      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--ops-muted)' }}>Pick saved agents</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {agents.map((agent) => {
                          const on = picked.includes(agent.id);
                          return (
                            <button key={agent.id} type="button" aria-pressed={on} onClick={() => setPicked((current) => (on ? current.filter((id) => id !== agent.id) : [...current, agent.id]))} className="min-h-9 rounded-full border px-3 text-xs" style={on ? { background: 'var(--ops-accent-soft)', borderColor: 'var(--ops-accent)', color: 'var(--ops-accent)' } : { borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }}>
                              {on ? '✓ ' : ''}{agent.company_name}
                            </button>
                          );
                        })}
                      </div>
                      <button type="button" disabled={!picked.length || agentMut.isPending} onClick={() => agentMut.mutate('saved')} className="mt-2 h-9 rounded-[7px] border px-3 text-sm disabled:opacity-40" style={{ borderColor: 'var(--ops-line)' }}>
                        Add selected
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--ops-muted)' }}>Join this inquiry to add agents and rates.</p>
              )}
              {Object.keys(grouped).length === 0 ? <p className="mt-3 text-sm" style={{ color: 'var(--ops-muted)' }}>No agents contacted yet.</p> : null}
              {Object.entries(grouped).map(([name, sends]) => (
                <div key={name} className="mt-4">
                  <p className="mb-2 text-xs font-medium" style={{ color: 'var(--ops-muted)' }}>Sent by {name}</p>
                  <div className="overflow-x-auto rounded-[10px] border" style={{ borderColor: 'var(--ops-line)' }}>
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead style={{ color: 'var(--ops-muted)' }}>
                        <tr>
                          {['Agent', 'Contact', 'Rate', 'Notes', 'Actions'].map((heading) => <th key={heading} className="px-2 py-2 text-[11px] font-medium uppercase">{heading}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {sends.map((send) => (
                          <SendRow key={send.id} send={send} mine={send.user_id === userId} onChanged={onChanged} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>

            <section className="border-b px-5 py-4" style={{ borderColor: 'var(--ops-line-soft)' }}>
              <h3 className="mb-3 text-sm font-semibold">Details</h3>
              {editing ? (
                <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); if (requirement.trim().length < 10) { toast.error('The shipment details need at least a short description'); return; } saveMut.mutate(); }}>
                  <Field label="Customer"><input className={field} style={{ borderColor: 'var(--ops-line)' }} value={customer} onChange={(event) => setCustomer(event.target.value)} /></Field>
                  <Field label="Title"><input className={field} style={{ borderColor: 'var(--ops-line)' }} value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
                  <div className="sm:col-span-2"><Field label="Shipment"><textarea className={`${field} min-h-[110px] py-2`} style={{ borderColor: 'var(--ops-line)' }} value={requirement} onChange={(event) => setRequirement(event.target.value)} /></Field></div>
                  <Field label="Email"><input className={field} style={{ borderColor: 'var(--ops-line)' }} type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
                  <Field label="Deadline"><input className={field} style={{ borderColor: 'var(--ops-line)' }} type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></Field>
                  <Field label="Priority">
                    <select className={field} style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }} value={priority} onChange={(event) => setPriority(event.target.value as 'low' | 'medium' | 'high')}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </Field>
                  <div className="sm:col-span-2"><Field label="Extra notes"><textarea className={`${field} min-h-20 py-2`} style={{ borderColor: 'var(--ops-line)' }} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field></div>
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="submit" disabled={saveMut.isPending} className="h-9 rounded-[7px] px-3 text-sm font-medium text-white" style={{ background: 'var(--ops-accent)' }}>Save inquiry</button>
                    <button type="button" className="h-9 rounded-[7px] px-3 text-sm" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                  <Info label="Customer" value={customerName} />
                  <Info label="Route" value={route} />
                  <Info label="Email" value={enquiry?.client_email || '—'} />
                  <Info label="Deadline" value={enquiry?.deadline ? formatUkDate(enquiry.deadline) : '—'} />
                  <div className="sm:col-span-2"><Info label="Shipment" value={inquiry.requirement} /></div>
                </dl>
              )}
            </section>

            <section className="px-5 py-4">
              <h3 className="mb-3 text-sm font-semibold">Updates</h3>
              <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (update.trim()) updateMut.mutate(); }}>
                <input className={field} style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }} value={update} onChange={(event) => setUpdate(event.target.value)} placeholder={`Post an update on ${inquiry.enquiry_number}`} aria-label="Update" />
                <button type="submit" disabled={updateMut.isPending || !update.trim()} className="h-9 shrink-0 rounded-[7px] px-3 text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--ops-accent)' }}>Post</button>
              </form>
              <ul className="mt-3 space-y-3">
                {inquiry.updates.map((item) => (
                  <li key={item.id} className="flex gap-2 text-sm">
                    <Avatar name={item.user_name} size={28} />
                    <span>
                      <span className="font-medium">{item.body}</span>
                      <span className="mt-0.5 block text-xs" style={{ color: 'var(--ops-faint)' }}>{item.user_name} · {formatUkDateTime(item.created_at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>

      <footer className="sticky bottom-0 flex items-center justify-between gap-2 border-t px-5 py-3" style={{ background: 'var(--ops-surface)', borderColor: 'var(--ops-line-soft)' }}>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing((value) => !value)} className="h-9 rounded-[7px] border px-3 text-sm" style={{ borderColor: 'var(--ops-line)' }}>Edit details</button>
          <button type="button" disabled={inquiry.stage === 'lost_closed' || inquiry.stage === 'won_closed'} onClick={() => setConfirm('close')} className="h-9 rounded-[7px] border px-3 text-sm disabled:opacity-40" style={{ borderColor: 'var(--ops-line)' }}>Mark closed</button>
        </div>
        <button type="button" onClick={() => setConfirm('delete')} className="h-9 rounded-[7px] border px-3 text-sm" style={{ borderColor: 'var(--ops-crit)', color: 'var(--ops-crit)' }}>Delete inquiry</button>
      </footer>

      {confirm ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4" style={{ background: 'rgba(10,15,22,0.42)' }}>
          <div role="dialog" aria-modal="true" className="w-full max-w-[440px] rounded-[10px] p-5" style={{ background: 'var(--ops-surface)', boxShadow: 'var(--ops-shadow-lg)' }}>
            <h3 className="text-base font-semibold">{confirm === 'delete' ? 'Delete inquiry' : 'Mark closed'}</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--ops-muted)' }}>
              {confirm === 'delete'
                ? `Delete ${inquiry.enquiry_number}? This removes it from Enquiries too.`
                : `Close ${inquiry.enquiry_number}? It leaves the open board.`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="h-9 rounded-[7px] px-3 text-sm" onClick={() => setConfirm(null)}>Cancel</button>
              <button type="button" className="h-9 rounded-[7px] px-3 text-sm text-white" style={{ background: confirm === 'delete' ? 'var(--ops-crit)' : 'var(--ops-accent)' }} onClick={() => (confirm === 'delete' ? deleteMut.mutate() : closeMut.mutate())}>
                {confirm === 'delete' ? 'Delete' : 'Mark closed'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label: text, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={label} style={{ color: 'var(--ops-muted)' }}>{text}</span>
      {children}
    </label>
  );
}

function Info({ label: text, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className={label} style={{ color: 'var(--ops-muted)' }}>{text}</dt>
      <dd className="whitespace-pre-wrap" style={{ color: 'var(--ops-fg)' }}>{value}</dd>
    </div>
  );
}

function SendRow({ send, mine, onChanged }: { send: AgentSend; mine: boolean; onChanged: () => void }) {
  const [price, setPrice] = useState(send.quoted_price != null ? String(send.quoted_price) : '');
  const [editingRate, setEditingRate] = useState(false);
  const rateMut = useMutation({
    mutationFn: () => saveOperationsRate(send.id, Number(price), send.currency),
    onSuccess: () => { toast.success('Rate saved'); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const bestMut = useMutation({
    mutationFn: async () => {
      const amount = Number(price);
      if (!amount || Number.isNaN(amount)) throw new Error('Enter the rate');
      if (amount !== Number(send.quoted_price)) await saveOperationsRate(send.id, amount, send.currency);
      return chooseOperationsBest(send.id);
    },
    onSuccess: () => { toast.success('Best quote is now on the enquiry'); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const rowStyle = send.is_best
    ? { background: 'var(--ops-ok-soft)' }
    : editingRate
      ? { background: 'var(--ops-accent-soft)' }
      : undefined;
  return (
    <tr style={rowStyle}>
      <td className="px-2 py-2 font-medium">{send.agent_name}</td>
      <td className="px-2 py-2 text-xs" style={{ color: 'var(--ops-muted)' }}>
        {send.contact_name || '—'}
        {send.contact_email ? (
          <button type="button" className="ml-1 inline-flex items-center gap-1" aria-label={`Copy ${send.contact_email}`} onClick={() => navigator.clipboard.writeText(send.contact_email || '')}>
            {send.contact_email} <Copy className="h-3 w-3" />
          </button>
        ) : null}
      </td>
      <td className="px-2 py-2">
        {mine ? (
          <input className="ops-mono h-9 w-24 rounded-[7px] border px-2 text-sm" style={{ borderColor: 'var(--ops-line)', background: 'var(--ops-surface)' }} type="number" min="0" value={price} aria-label="Rate" onFocus={() => setEditingRate(true)} onBlur={() => setEditingRate(false)} onChange={(event) => setPrice(event.target.value)} />
        ) : (
          <span className="ops-mono text-sm">{send.quoted_price != null ? money(send.quoted_price, send.currency) : '—'}</span>
        )}
      </td>
      <td className="max-w-[140px] truncate px-2 py-2 text-xs" style={{ color: 'var(--ops-muted)' }}>{send.notes || '—'}</td>
      <td className="px-2 py-2">
        {mine ? (
          <span className="flex gap-1">
            <button type="button" className="h-9 rounded-[7px] border px-2 text-xs disabled:opacity-40" style={{ borderColor: 'var(--ops-line)' }} disabled={rateMut.isPending || !price} onClick={() => rateMut.mutate()}>Save rate</button>
            <button type="button" className="inline-flex h-9 items-center rounded-[7px] px-2 text-xs text-white disabled:opacity-40" style={{ background: 'var(--ops-accent)' }} disabled={bestMut.isPending || !price} onClick={() => bestMut.mutate()}>
              {bestMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="mr-1 h-3.5 w-3.5" />}Best
            </button>
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--ops-muted)' }}>{send.is_best ? 'Best' : ''}</span>
        )}
      </td>
    </tr>
  );
}
