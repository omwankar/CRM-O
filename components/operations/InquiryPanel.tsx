'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Star } from 'lucide-react';
import { getEnquiry, updateEnquiry } from '@/lib/api/enquiries';
import {
  addOperationsAgent,
  chooseOperationsBest,
  closeOperationsEnquiry,
  deleteOperationsEnquiry,
  joinOperationsEnquiry,
  postInquiryUpdate,
  saveOperationsRate,
  type DirectoryAgent,
  type PipelineInquiry,
} from '@/lib/api/operations';
import { ageParts, money, personColor, initial } from '@/components/operations/opsVisual';
import { formatUkDate, formatUkDateTime } from '@/lib/date';

const field = 'h-9 w-full rounded-md border border-slate-600 bg-[#0b1220] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500';

export function InquiryPanel({
  inquiry,
  userId,
  agents,
  onChanged,
  onClosed,
  onDismiss,
}: {
  inquiry: PipelineInquiry;
  userId?: string;
  agents: DirectoryAgent[];
  onChanged: () => void;
  onClosed: () => void;
  onDismiss?: () => void;
}) {
  const qc = useQueryClient();
  const { data: enquiry, isLoading } = useQuery({
    queryKey: ['enquiry', inquiry.id],
    queryFn: () => getEnquiry(inquiry.id),
  });
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

  const working = inquiry.operators.some((operator) => operator.user_id === userId);
  const bests = inquiry.sends.filter((send) => send.is_best && send.quoted_price != null);
  const age = ageParts(inquiry.created_at);
  const customerName = inquiry.prospect_name || inquiry.title || 'Inquiry';

  const refreshEnquiry = () => {
    qc.invalidateQueries({ queryKey: ['enquiry', inquiry.id] });
    onChanged();
  };

  const saveMut = useMutation({
    mutationFn: () =>
      updateEnquiry(inquiry.id, {
        prospect_name: customer.trim() || null,
        title: title.trim() || null,
        requirement: requirement.trim(),
        client_email: email.trim() || null,
        deadline: deadline || null,
        priority,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success('Inquiry saved');
      setEditing(false);
      refreshEnquiry();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const joinMut = useMutation({
    mutationFn: () => joinOperationsEnquiry(inquiry.id),
    onSuccess: () => {
      toast.success('You are working this enquiry');
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const agentMut = useMutation({
    mutationFn: (mode: 'typed' | 'saved') =>
      addOperationsAgent(
        inquiry.id,
        mode === 'saved'
          ? { saved_agent_ids: picked }
          : {
              agent_name: company.trim(),
              contact_name: contact.trim() || null,
              contact_email: agentEmail.trim() || null,
            },
      ),
    onSuccess: () => {
      setCompany('');
      setContact('');
      setAgentEmail('');
      setPicked([]);
      toast.success('Agent added');
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMut = useMutation({
    mutationFn: () => postInquiryUpdate(inquiry.id, update.trim()),
    onSuccess: () => {
      setUpdate('');
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const closeMut = useMutation({
    mutationFn: () => closeOperationsEnquiry(inquiry.id),
    onSuccess: () => {
      toast.success('Inquiry closed');
      onClosed();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteOperationsEnquiry(inquiry.id),
    onSuccess: () => {
      toast.success('Inquiry deleted');
      onClosed();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading && !enquiry) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[#0f172a] text-slate-100">
      <div className="border-b border-slate-700 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Inquiry ID</p>
          {onDismiss ? (
            <button type="button" onClick={onDismiss} className="text-xs text-slate-400 hover:text-white">
              Close
            </button>
          ) : null}
        </div>
        <h2 className="mt-1 font-mono text-2xl font-semibold">{inquiry.enquiry_number}</h2>
        <p className="mt-1 text-sm text-slate-200">{customerName}</p>
        <p className="mt-1 text-sm text-slate-400">{inquiry.route}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Received {formatUkDate(inquiry.created_at)}</span>
          <span className={`rounded-full px-2 py-0.5 font-medium ${age.className}`}>{age.label}</span>
        </div>
        <Link href={`/dashboard/enquiries/${inquiry.id}`} className="mt-2 inline-block text-xs text-blue-300 hover:underline">
          Open in CRM
        </Link>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        <section>
          <h3 className="text-sm font-semibold">Best quote</h3>
          {bests.length === 0 ? (
            <p className="mt-1 text-sm text-slate-400">When quotes come back, choose the best one here.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {bests.map((send) => (
                <li key={send.id} className="text-emerald-300">
                  {send.agent_name} · {money(send.quoted_price, send.currency)} · {send.user_name}
                </li>
              ))}
            </ul>
          )}
        </section>

        {editing ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (requirement.trim().length < 10) {
                toast.error('The shipment details need at least a short description');
                return;
              }
              saveMut.mutate();
            }}
          >
            <input className={field} value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Customer" />
            <input className={field} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
            <textarea className={`${field} min-h-28 py-2`} value={requirement} onChange={(event) => setRequirement(event.target.value)} placeholder="Shipment" />
            <div className="grid grid-cols-2 gap-2">
              <input className={field} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
              <input className={field} type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </div>
            <select className={field} value={priority} onChange={(event) => setPriority(event.target.value as 'low' | 'medium' | 'high')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <textarea className={`${field} min-h-20 py-2`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Extra information" />
            <div className="flex gap-2">
              <button type="submit" disabled={saveMut.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500">
                Save inquiry
              </button>
              <button type="button" className="rounded-md px-3 py-1.5 text-sm text-slate-300" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Agents and quotes</h3>
            <span className="text-xs text-slate-400">{inquiry.sends.length} contacted</span>
          </div>
          {!working ? (
            <button
              type="button"
              disabled={joinMut.isPending}
              onClick={() => joinMut.mutate()}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
            >
              Work on this
            </button>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <input className={field} value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Agent company" />
                <input className={field} value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Contact person" />
                <input className={field} value={agentEmail} onChange={(event) => setAgentEmail(event.target.value)} placeholder="Email" />
                <button
                  type="button"
                  disabled={agentMut.isPending || company.trim().length < 2}
                  onClick={() => agentMut.mutate('typed')}
                  className="h-9 rounded-md bg-blue-600 px-3 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
                >
                  Add agent
                </button>
              </div>
              {agents.length > 0 ? (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Or pick saved agents</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {agents.map((agent) => {
                      const on = picked.includes(agent.id);
                      return (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => setPicked((current) => (on ? current.filter((id) => id !== agent.id) : [...current, agent.id]))}
                          className={`rounded-full border px-2.5 py-1 text-xs ${on ? 'border-blue-400 bg-blue-500/20 text-blue-100' : 'border-slate-600 text-slate-300'}`}
                        >
                          {agent.company_name}
                          {agent.contact_name ? ` · ${agent.contact_name}` : ''}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={!picked.length || agentMut.isPending}
                    onClick={() => agentMut.mutate('saved')}
                    className="mt-2 rounded-md border border-slate-600 px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    Add selected
                  </button>
                </div>
              ) : null}
            </>
          )}

          {inquiry.sends.length === 0 ? (
            <p className="text-sm text-slate-400">No agents contacted yet.</p>
          ) : (
            <div className="divide-y divide-slate-700 rounded-lg border border-slate-700">
              {inquiry.sends.map((send) => (
                <SendRow key={send.id} send={send} mine={send.user_id === userId} onChanged={onChanged} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Updates</h3>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!update.trim()) return;
              updateMut.mutate();
            }}
          >
            <input className={field} value={update} onChange={(event) => setUpdate(event.target.value)} placeholder={`Post an update on ${inquiry.enquiry_number}`} />
            <button type="submit" disabled={updateMut.isPending || !update.trim()} className="h-9 rounded-md bg-blue-600 px-3 text-sm font-medium disabled:opacity-50">
              Post
            </button>
          </form>
          <ul className="space-y-2">
            {inquiry.updates.map((item) => (
              <li key={item.id} className="text-sm">
                <span className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white ${personColor(item.user_name)}`}>
                  {initial(item.user_name)}
                </span>
                <span className="font-medium">{item.user_name}</span>
                <span className="text-slate-300"> {item.body}</span>
                <span className="ml-2 text-xs text-slate-500">{formatUkDateTime(item.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex items-center justify-between border-t border-slate-700 px-5 py-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing((value) => !value)} className="rounded-md border border-slate-600 px-3 py-1.5 text-sm">
            Edit details
          </button>
          <button type="button" disabled={closeMut.isPending || inquiry.stage === 'lost_closed' || inquiry.stage === 'won_closed'} onClick={() => closeMut.mutate()} className="rounded-md border border-slate-600 px-3 py-1.5 text-sm">
            Mark closed
          </button>
        </div>
        <button
          type="button"
          className="text-sm text-rose-300"
          disabled={deleteMut.isPending}
          onClick={() => {
            if (window.confirm(`Delete ${inquiry.enquiry_number}? This removes it from Enquiries too.`)) deleteMut.mutate();
          }}
        >
          Delete inquiry
        </button>
      </div>
    </div>
  );
}

function SendRow({
  send,
  mine,
  onChanged,
}: {
  send: PipelineInquiry['sends'][number];
  mine: boolean;
  onChanged: () => void;
}) {
  const [price, setPrice] = useState(send.quoted_price != null ? String(send.quoted_price) : '');
  const rateMut = useMutation({
    mutationFn: () => saveOperationsRate(send.id, Number(price), send.currency),
    onSuccess: () => {
      toast.success('Rate saved');
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const bestMut = useMutation({
    mutationFn: async () => {
      const amount = Number(price);
      if (!amount || Number.isNaN(amount)) throw new Error('Enter the rate');
      if (amount !== Number(send.quoted_price)) await saveOperationsRate(send.id, amount, send.currency);
      return chooseOperationsBest(send.id);
    },
    onSuccess: () => {
      toast.success('Best quote is now on the enquiry');
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{send.agent_name}</p>
        <p className="text-[11px] text-slate-400">
          {send.user_name}
          {send.contact_name ? ` · ${send.contact_name}` : ''}
          {send.contact_email ? ` · ${send.contact_email}` : ''}
        </p>
      </div>
      {mine ? (
        <>
          <input className="h-8 w-24 rounded-md border border-slate-600 bg-[#0b1220] px-2 text-sm" type="number" min="0" value={price} placeholder="Rate" onChange={(event) => setPrice(event.target.value)} />
          <button type="button" className="h-8 rounded-md border border-slate-600 px-2 text-xs" disabled={rateMut.isPending || !price} onClick={() => rateMut.mutate()}>
            Save rate
          </button>
          <button type="button" className="inline-flex h-8 items-center rounded-md bg-blue-600 px-2 text-xs" disabled={bestMut.isPending || !price} onClick={() => bestMut.mutate()}>
            {bestMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="mr-1 h-3.5 w-3.5" />}
            Best
          </button>
        </>
      ) : (
        <span className="text-xs text-slate-300">{send.quoted_price != null ? money(send.quoted_price, send.currency) : 'Waiting on rate'}</span>
      )}
      {send.is_best ? <span className="text-[10px] font-semibold uppercase text-emerald-300">Best</span> : null}
    </div>
  );
}
