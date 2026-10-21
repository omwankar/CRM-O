'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, Loader2 } from 'lucide-react';
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
import { formatRoute, quoteText } from '@/components/operations/opsVisual';
import { formatUkDate, formatUkDateTime } from '@/lib/date';
import { opsFontClass } from '@/components/operations/opsFonts';

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
  if (!inquiry || typeof document === 'undefined') return null;
  return createPortal(
    <div className={`${opsFontClass} ops`}>
      <div className="dscrim" onMouseDown={onDismiss} />
      <aside className="drawer" role="dialog" aria-label={`Inquiry ${inquiry.enquiry_number}`}>
        <DrawerBody
          inquiry={inquiry}
          userId={userId}
          isSuperAdmin={isSuperAdmin}
          team={team}
          agents={agents}
          onChanged={onChanged}
          onDismiss={onDismiss}
        />
      </aside>
    </div>,
    document.body,
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
  const [confirm, setConfirm] = useState<'delete' | null>(null);
  const [closeOutcome, setCloseOutcome] = useState('Closed');
  const [closeRemark, setCloseRemark] = useState('');
  const [profit, setProfit] = useState('');
  const [finalQuote, setFinalQuote] = useState('');

  useEffect(() => {
    if (!enquiry) return;
    setCustomer(enquiry.prospect_name || '');
    setTitle(enquiry.title || '');
    setRequirement(enquiry.requirement || '');
    setEmail(enquiry.client_email || '');
    setDeadline(enquiry.deadline ? enquiry.deadline.slice(0, 10) : '');
    setPriority(enquiry.priority || 'medium');
    setNotes(enquiry.notes || '');
    try {
      const pricing = JSON.parse(enquiry.client_price_notes || inquiry.client_price_notes || '');
      setProfit(pricing.profit || '');
      setFinalQuote(pricing.final || '');
    } catch {
      setProfit('');
      setFinalQuote(enquiry.client_price_notes || inquiry.client_price_notes || '');
    }
  }, [enquiry, inquiry.client_price_notes]);

  useEffect(() => {
    setAssignedIds(inquiry.operators.map((operator) => operator.user_id));
  }, [inquiry.id, inquiry.operators]);

  const working = inquiry.operators.some((operator) => operator.user_id === userId) || Boolean(isSuperAdmin);
  const bests = inquiry.sends.filter((send) => send.is_best);
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
    mutationFn: () => closeOperationsEnquiry(inquiry.id, { outcome: closeOutcome, remark: closeRemark.trim() || null }),
    onSuccess: () => { toast.success('Inquiry closed'); setConfirm(null); onDismiss(); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const pricingMut = useMutation({
    mutationFn: () => updateEnquiry(inquiry.id, { client_price_notes: JSON.stringify({ profit: profit.trim(), final: finalQuote.trim() }) }),
    onSuccess: () => { toast.success('Profit and final quote saved'); refreshEnquiry(); },
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
    <>
      <div className="dh">
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
        <div className="acts">
          {isSuperAdmin ? <button type="button" className="btn sm danger" onClick={() => setConfirm('delete')}>Delete</button> : null}
          <button type="button" className="btn ghost" aria-label="Close" onClick={onDismiss}>✕</button>
        </div>
      </div>
      {confirm === 'delete' ? (
        <div className="delbar">
          <span>Delete <b className="mono">{inquiry.enquiry_number}</b>? This removes it from Enquiries too.</span>
          <span className="acts">
            <button type="button" className="btn sm" onClick={() => setConfirm(null)}>Keep it</button>
            <button type="button" className="btn sm delyes" onClick={() => deleteMut.mutate()}>Delete inquiry</button>
          </span>
        </div>
      ) : null}

      <div>
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
                <div key={send.id}>
                  <div className="best">
                    <div>
                      <div className="lbl">Agent</div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{send.agent_name}</div>
                      {send.contact_name ? <div>{send.contact_name}</div> : null}
                      <div className="hint">chosen by {send.user_name}</div>
                    </div>
                    <div className="qtext best-q">{quoteText(send.notes, send.quoted_price, send.currency) || '—'}</div>
                  </div>
                  {working ? (
                    <div className="pricing">
                      <div className="pgrid">
                        <label>
                          <span className="lbl">Profit</span>
                          <input className="field" value={profit} onChange={(event) => setProfit(event.target.value)} placeholder="e.g. USD 150 or 0.25/kg" />
                        </label>
                        <label>
                          <span className="lbl">Final quote with profit</span>
                          <textarea className="field qpaste" rows={5} value={finalQuote} onChange={(event) => setFinalQuote(event.target.value)} placeholder="The quote you send to the customer, profit included" />
                        </label>
                      </div>
                      <div className="pacts">
                        <button className="btn sm ghost" type="button" onClick={() => setFinalQuote(quoteText(send.notes, send.quoted_price, send.currency))}>Start from selected quote</button>
                        {finalQuote ? <button className="btn sm ghost" type="button" onClick={() => navigator.clipboard.writeText(finalQuote)}>Copy final quote</button> : null}
                        <span className="spacer" />
                        <button className="btn sm pri" type="button" disabled={pricingMut.isPending} onClick={() => pricingMut.mutate()}>Save profit &amp; final quote</button>
                      </div>
                    </div>
                  ) : null}
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
                          {['Agent · contact · email · phone', 'Quote', ''].map((heading) => <th key={heading || 'a'}>{heading}</th>)}
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
              <div className="sec-h">
                <h3>Details</h3>
                {isSuperAdmin ? <button type="button" className="btn sm" onClick={() => setEditing((value) => !value)}>{editing ? 'Cancel' : 'Edit details'}</button> : null}
              </div>
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

      {isSuperAdmin && inquiry.column !== 'closed' ? (
        <div className="sec">
          <div className="sec-h"><h3>Close this inquiry</h3></div>
          <div className="closeform">
            <label htmlFor="clStatus">
              <span className="lbl">Outcome</span>
              <select className="field" id="clStatus" value={closeOutcome} onChange={(event) => setCloseOutcome(event.target.value)}>
                {['Closed', 'Lost', 'No response', 'Follow-up closed'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label htmlFor="clRemark" className="grow">
              <span className="lbl">Remark</span>
              <textarea className="field" id="clRemark" rows={2} value={closeRemark} onChange={(event) => setCloseRemark(event.target.value)} placeholder="e.g. Customer went with another forwarder at a lower rate / No reply after 3 follow-ups" />
            </label>
            <button className="btn" type="button" onClick={() => closeMut.mutate()}>Close inquiry</button>
          </div>
        </div>
      ) : null}

    </>
  );
}

function SendRow({ send, mine, onChanged }: { send: AgentSend; mine: boolean; onChanged: () => void }) {
  const [quote, setQuote] = useState(send.notes || '');
  const [editing, setEditing] = useState(!send.notes && send.quoted_price == null);
  const rateMut = useMutation({
    mutationFn: () => saveOperationsRate(send.id, { notes: quote, currency: send.currency }),
    onSuccess: () => { toast.success('Quote saved'); setEditing(false); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const bestMut = useMutation({
    mutationFn: async () => {
      if (!quote.trim() && send.quoted_price == null) throw new Error('Paste the quote first');
      if (quote !== (send.notes || '')) await saveOperationsRate(send.id, { notes: quote, currency: send.currency });
      return chooseOperationsBest(send.id);
    },
    onSuccess: () => { toast.success('Best quote is now on the enquiry'); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <tr className={send.is_best ? 'isbest' : editing ? 'editing' : undefined}>
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
      <td className="qcell">
        {mine && editing ? (
          <>
            <textarea className="field qpaste" rows={5} value={quote} onChange={(event) => setQuote(event.target.value)} placeholder={`Paste the quote from ${send.agent_name}'s email here`} />
            <div className="hint">Paste the whole quote, not only a number</div>
          </>
        ) : send.notes ? (
          <div className="qtext">{send.notes}</div>
        ) : send.quoted_price != null ? (
          quoteText(send.notes, send.quoted_price, send.currency)
        ) : (
          <span className="hint">—</span>
        )}
      </td>
      <td>
        <div className="acts">
          {mine ? (
            <>
              {editing ? (
                <button type="button" className="btn sm pri" disabled={rateMut.isPending || !quote.trim()} onClick={() => rateMut.mutate()}>Save</button>
              ) : (
                <button type="button" className="btn sm ghost" onClick={() => setEditing(true)}>Edit</button>
              )}
              {(quote.trim() || send.notes || send.quoted_price != null) ? (
                <button type="button" className="btn sm ok" disabled={bestMut.isPending} onClick={() => bestMut.mutate()}>
                  {bestMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Select best
                </button>
              ) : null}
            </>
          ) : (
            send.is_best ? <span className="pill ok">✓ Best</span> : null
          )}
        </div>
      </td>
    </tr>
  );
}
