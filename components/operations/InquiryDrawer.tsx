'use client';

import { useEffect, useState } from 'react';
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
import { opsFontClass } from '@/components/operations/opsFonts';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

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
      <SheetContent side="right" className={`${opsFontClass} ops drawer w-full max-w-[720px] gap-0 border-0 p-0 data-[state=closed]:duration-200 data-[state=open]:duration-200 sm:max-w-[720px]`} style={{ background: 'var(--surface)', color: 'var(--fg)', position: 'fixed' }}>
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
  const [agentPhone, setAgentPhone] = useState('');
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
      : { agent_name: company.trim(), contact_name: contact.trim() || null, contact_email: agentEmail.trim() || null, contact_phone: agentPhone.trim() || null }),
    onSuccess: () => { setCompany(''); setContact(''); setAgentEmail(''); setAgentPhone(''); setPicked([]); toast.success('Agent added'); onChanged(); },
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
    <div className="relative flex h-full min-h-0 flex-col" style={{ background: 'var(--surface)' }}>
      <div className="dh" style={{ paddingRight: 48 }}>
        <div style={{ minWidth: 0 }}>
          <div className="lbl">Inquiry ID</div>
          <div className="idbig">{inquiry.enquiry_number}</div>
          <div className="cust">{customerName}</div>
          <div className="route">
            {route ? <span className="lane">{route}</span> : null}
            <StatusPill column={inquiry.column} />
            <AgePill createdAt={inquiry.created_at} />
            <span>Inquiry date {formatUkDate(inquiry.created_at)}</span>
            <Link href={`/dashboard/enquiries/${inquiry.id}`}>Open in CRM ↗</Link>
          </div>
        </div>
      </div>

      <div className="ops-scroll min-h-0 flex-1 overflow-y-auto">
        {isLoading && !enquiry ? (
          <div className="empty"><h3>Loading…</h3></div>
        ) : (
          <>
            <div className="sec">
              <div className="sec-h">
                <h3>Assigned to</h3>
                {isSuperAdmin ? (
                  <button type="button" className="btn sm pri" disabled={assignMut.isPending} onClick={() => assignMut.mutate()}>Save people</button>
                ) : (
                  <span className="hint">Who works this inquiry</span>
                )}
              </div>
              {isSuperAdmin ? (
                <div className="team">
                  {team.map((person) => {
                    const on = assignedIds.includes(person.user_id);
                    return (
                      <button
                        key={person.user_id}
                        type="button"
                        className="tchip"
                        aria-pressed={on}
                        onClick={() => setAssignedIds((current) => (on ? current.filter((id) => id !== person.user_id) : [...current, person.user_id]))}
                      >
                        <Avatar name={person.full_name} size="s" />
                        {person.full_name}
                      </button>
                    );
                  })}
                </div>
              ) : working && inquiry.operators.some((operator) => operator.user_id === userId) ? (
                <div className="team">
                  {inquiry.operators.map((operator) => (
                    <span key={operator.user_id} className="tchip">
                      <Avatar name={operator.full_name} size="s" />
                      {operator.full_name}
                    </span>
                  ))}
                </div>
              ) : (
                <button type="button" className="btn" disabled={joinMut.isPending} onClick={() => joinMut.mutate()}>Join this inquiry</button>
              )}
            </div>

            <div className="sec">
              <div className="sec-h"><h3>Best quote</h3></div>
              {bests.length ? bests.map((send) => (
                <div key={send.id} className="best">
                  <div>
                    <div className="lbl">Agent</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{send.agent_name}</div>
                    <div className="hint">chosen by {send.user_name}</div>
                  </div>
                  <div className="price">{money(send.quoted_price, send.currency)}</div>
                  {send.notes ? <div className="qtext best-q">{send.notes}</div> : null}
                </div>
              )) : <p className="hint" style={{ margin: 0 }}>When quotes come back, choose the best one here.</p>}
            </div>

            <div className="sec">
              <div className="sec-h">
                <h3>Agents &amp; quotes</h3>
                <span className="hint">{inquiry.rates_received} of {inquiry.sends.length} quotes received</span>
              </div>
              {working ? (
                <>
                  <div className="agform">
                    <input className="field" list="ops-agent-companies" value={company} onChange={(event) => { const value = event.target.value; setCompany(value); const match = agents.find((agent) => agent.company_name === value); if (match) { setContact(match.contact_name || ''); setAgentEmail(match.email || ''); setAgentPhone(match.phone || ''); } }} placeholder="Agent company" aria-label="Agent company" />
                    <datalist id="ops-agent-companies">{agents.map((agent) => <option key={agent.id} value={agent.company_name} />)}</datalist>
                    <input className="field" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Contact person" aria-label="Contact person" />
                    <input className="field" type="email" value={agentEmail} onChange={(event) => setAgentEmail(event.target.value)} placeholder="Email" aria-label="Agent email" />
                    <input className="field" type="tel" value={agentPhone} onChange={(event) => setAgentPhone(event.target.value)} placeholder="Phone" aria-label="Agent phone number" />
                    <button type="button" className="btn pri" disabled={agentMut.isPending || company.trim().length < 2} onClick={() => agentMut.mutate('typed')}>Add agent</button>
                  </div>
                  {agents.length > 0 ? (
                    <div className="pickbox">
                      <div className="pickhead">
                        <span className="lbl">Or pick saved agents</span>
                        <button type="button" className="btn sm pri" disabled={!picked.length || agentMut.isPending} onClick={() => agentMut.mutate('saved')}>Add {picked.length || ''} selected</button>
                      </div>
                      <div className="quick">
                        {agents.map((agent) => {
                          const on = picked.includes(agent.id);
                          return (
                            <button key={agent.id} type="button" className="qchip" aria-pressed={on} onClick={() => setPicked((current) => (on ? current.filter((id) => id !== agent.id) : [...current, agent.id]))}>
                              {agent.company_name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="hint">Join this inquiry to add agents and rates.</p>
              )}
              {Object.entries(grouped).map(([name, sends]) => (
                <div key={name} className="by">
                  <div className="by-h"><Avatar name={name} size="s" /> {name} <span>{sends.length} agent{sends.length === 1 ? '' : 's'}</span></div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          {['Agent · contact · email · phone', 'Rate', 'Notes', ''].map((heading) => <th key={heading || 'a'}>{heading}</th>)}
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
              {!Object.keys(grouped).length ? <p className="hint">No agents contacted yet.</p> : null}
            </div>

            <div className="sec">
              <div className="sec-h"><h3>Details</h3></div>
              {editing ? (
                <form className="agform" onSubmit={(event) => { event.preventDefault(); if (requirement.trim().length < 10) { toast.error('The shipment details need at least a short description'); return; } saveMut.mutate(); }}>
                  <label><span className="lbl">Customer</span><input className="field" value={customer} onChange={(event) => setCustomer(event.target.value)} /></label>
                  <label><span className="lbl">Title</span><input className="field" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
                  <label className="full" style={{ gridColumn: '1 / -1' }}><span className="lbl">Shipment</span><textarea className="field qpaste" value={requirement} onChange={(event) => setRequirement(event.target.value)} /></label>
                  <label><span className="lbl">Email</span><input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                  <label><span className="lbl">Deadline</span><input className="field" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label>
                  <label><span className="lbl">Priority</span>
                    <select className="field" value={priority} onChange={(event) => setPriority(event.target.value as 'low' | 'medium' | 'high')}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  <label className="full" style={{ gridColumn: '1 / -1' }}><span className="lbl">Extra notes</span><textarea className="field" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
                  <div className="acts" style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" className="btn pri" disabled={saveMut.isPending}>Save inquiry</button>
                    <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="agform">
                  <div><div className="lbl">Customer</div><div>{customerName}</div></div>
                  <div><div className="lbl">Route</div><div className="lane">{route || '—'}</div></div>
                  <div><div className="lbl">Email</div><div>{enquiry?.client_email || '—'}</div></div>
                  <div><div className="lbl">Deadline</div><div>{enquiry?.deadline ? formatUkDate(enquiry.deadline) : '—'}</div></div>
                  <div style={{ gridColumn: '1 / -1' }}><div className="lbl">Shipment</div><div className="qtext">{inquiry.requirement}</div></div>
                </div>
              )}
            </div>

            <div className="sec">
              <div className="sec-h"><h3>Updates</h3></div>
              <form className="noteform" onSubmit={(event) => { event.preventDefault(); if (update.trim()) updateMut.mutate(); }}>
                <input className="field" value={update} onChange={(event) => setUpdate(event.target.value)} placeholder={`Add a note on ${inquiry.enquiry_number}`} aria-label="Update" />
                <button type="submit" className="btn" disabled={updateMut.isPending || !update.trim()}>Add note</button>
              </form>
              <ul className="feed">
                {inquiry.updates.map((item) => (
                  <li key={item.id} className="fi">
                    <Avatar name={item.user_name} size="s" />
                    <div>
                      <div className="t"><b>{item.body}</b></div>
                      <div className="w">{item.user_name} · {formatUkDateTime(item.created_at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="sec" style={{ borderTop: '1px solid var(--line-soft)' }}>
        <div className="acts" style={{ justifyContent: 'space-between' }}>
          <span className="acts">
            <button type="button" className="btn sm" onClick={() => setEditing((value) => !value)}>Edit details</button>
            <button type="button" className="btn sm" disabled={inquiry.stage === 'lost_closed' || inquiry.stage === 'won_closed'} onClick={() => setConfirm('close')}>Close inquiry</button>
          </span>
          <button type="button" className="btn sm danger" onClick={() => setConfirm('delete')}>Delete inquiry</button>
        </div>
      </div>

      {confirm ? (
        <div className="scrim" style={{ placeItems: 'center', zIndex: 30 }}>
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 440 }}>
            <header><h2>{confirm === 'delete' ? 'Delete inquiry' : 'Mark closed'}</h2></header>
            <div className="mbody" style={{ gridTemplateColumns: '1fr' }}>
              <p className="hint" style={{ margin: 0 }}>
                {confirm === 'delete'
                  ? `Delete ${inquiry.enquiry_number}? This removes it from Enquiries too.`
                  : `Close ${inquiry.enquiry_number}? It leaves the open board.`}
              </p>
            </div>
            <div className="mfoot">
              <button type="button" className="btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button type="button" className={`btn ${confirm === 'delete' ? 'delyes' : 'pri'}`} onClick={() => (confirm === 'delete' ? deleteMut.mutate() : closeMut.mutate())}>
                {confirm === 'delete' ? 'Delete' : 'Mark closed'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
  return (
    <tr className={send.is_best ? 'isbest' : editingRate ? 'editing' : undefined}>
      <td className="agcell">
        <b>{send.agent_name}</b>
        {send.contact_name ? <div>{send.contact_name}</div> : null}
        {send.contact_email ? (
          <div className="email">
            <span className="mono">{send.contact_email}</span>
            <button type="button" className="btn sm ghost copy" aria-label={`Copy ${send.contact_email}`} onClick={() => navigator.clipboard.writeText(send.contact_email || '')}>
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
        ) : null}
        {send.contact_phone ? <div className="email"><span className="mono">{send.contact_phone}</span></div> : null}
      </td>
      <td className="num">
        {mine ? (
          <input className="field t" type="number" min="0" value={price} aria-label="Rate" onFocus={() => setEditingRate(true)} onBlur={() => setEditingRate(false)} onChange={(event) => setPrice(event.target.value)} />
        ) : (
          send.quoted_price != null ? money(send.quoted_price, send.currency) : '—'
        )}
      </td>
      <td>{send.notes || '—'}</td>
      <td>
        <div className="acts">
          {mine ? (
            <>
              <button type="button" className="btn sm" disabled={rateMut.isPending || !price} onClick={() => rateMut.mutate()}>Save</button>
              <button type="button" className="btn sm ok" disabled={bestMut.isPending || !price} onClick={() => bestMut.mutate()}>
                {bestMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />} Select best
              </button>
            </>
          ) : (
            send.is_best ? <span className="pill ok">✓ Best</span> : null
          )}
        </div>
      </td>
    </tr>
  );
}
