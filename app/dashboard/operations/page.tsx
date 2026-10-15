'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus, Search } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  deleteDirectoryAgent,
  getOperationsPipeline,
  saveDirectoryAgent,
  type DirectoryAgent,
  type PipelineInquiry,
} from '@/lib/api/operations';
import { InquiryIntake } from '@/components/operations/InquiryIntake';
import { InquiryPanel } from '@/components/operations/InquiryPanel';
import { COLUMNS, ageParts, initial, money, personColor, statusLabel } from '@/components/operations/opsVisual';
import { formatUkDate, formatUkDateTime } from '@/lib/date';

type Tab = 'inquiries' | 'activity' | 'register' | 'agents';

const field = 'h-9 rounded-md border border-slate-600 bg-[#0b1220] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500';

export default function OperationsPipelinePage() {
  const qc = useQueryClient();
  const { user, isSuperAdmin, inOperations, isLoading: authLoading } = useCurrentUser();
  const allowed = isSuperAdmin || inOperations;
  const [tab, setTab] = useState<Tab>('inquiries');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [activityPerson, setActivityPerson] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['operations-pipeline', showClosed],
    queryFn: () => getOperationsPipeline(showClosed),
    enabled: !authLoading && allowed,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['operations-pipeline'] });
    qc.invalidateQueries({ queryKey: ['enquiries'] });
  };

  const selected = (data?.inquiries || []).find((inquiry) => inquiry.id === selectedId) ?? null;
  const focusPerson = (data?.workload || []).find((member) => member.user_id === personId) ?? null;
  const needle = search.trim().toLowerCase();
  const visible = useMemo(() => {
    return (data?.inquiries || []).filter((inquiry) => {
      if (personId && !inquiry.operators.some((operator) => operator.user_id === personId)) return false;
      if (!needle) return true;
      const hay = [
        inquiry.enquiry_number,
        inquiry.prospect_name,
        inquiry.title,
        inquiry.route,
        ...inquiry.sends.map((send) => send.agent_name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [data?.inquiries, personId, needle]);

  if (authLoading) {
    return (
      <div className="flex justify-center py-16 text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-xl font-semibold">Operations only</h1>
        <p className="mt-2 text-sm text-muted-foreground">This pipeline is for the operations team.</p>
      </div>
    );
  }

  const panel = selected ? (
    <InquiryPanel
      inquiry={selected}
      userId={user?.id}
      agents={data?.agents || []}
      onChanged={refresh}
      onDismiss={() => setSelectedId(null)}
      onClosed={() => {
        setSelectedId(null);
        refresh();
      }}
    />
  ) : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b1220] text-slate-100">
      <header className="shrink-0 border-b border-slate-800 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Operations pipeline</h1>
            <p className="text-xs text-slate-400">Oldest open inquiries come first. Click a person to see only their work.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTab('inquiries');
              setCreating((value) => !value);
            }}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            New inquiry
          </button>
        </div>
        <nav className="mt-3 flex flex-wrap gap-1">
          {(
            [
              ['inquiries', 'Inquiries'],
              ['activity', 'Activity'],
              ['register', 'Register'],
              ['agents', 'Agents'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-w-0 flex-1 overflow-y-auto px-5 py-4">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : error ? (
        <p className="py-8 text-sm text-rose-300">{error instanceof Error ? error.message : 'Could not load the pipeline'}</p>
      ) : tab === 'inquiries' ? (
        <div className="space-y-4">
          {creating ? (
            <div className="rounded-xl border border-slate-700 bg-[#111827] p-3">
              <InquiryIntake dark onCreated={() => { setCreating(false); refresh(); }} />
            </div>
          ) : null}
          <div className="flex gap-3 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setPersonId(null)}
              className={`shrink-0 rounded-xl border px-4 py-3 text-left text-sm ${personId ? 'border-slate-700 bg-[#151c2c] text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-900'}`}
            >
              Everyone
            </button>
            {(data?.workload || []).map((member) => (
              <button
                key={member.user_id}
                type="button"
                onClick={() => setPersonId((current) => (current === member.user_id ? null : member.user_id))}
                className={`flex w-[230px] shrink-0 items-center gap-3 rounded-xl border px-3 py-3 text-left ${personId === member.user_id ? 'border-blue-400 bg-blue-500/15' : 'border-slate-700 bg-[#151c2c]'}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${personColor(member.full_name)}`}>
                  {initial(member.full_name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{member.full_name}</span>
                  <span className="block text-xs text-slate-400">
                    {member.open_count} working · {member.rates_awaited} awaiting a rate
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold">{focusPerson ? `${focusPerson.full_name}'s inquiries` : 'All inquiries'}</h2>
            <label className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <input className={`${field} w-full pl-8`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, customer, route, agent" />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={showClosed} onChange={(event) => setShowClosed(event.target.checked)} />
              Show closed
            </label>
            <span className="text-xs text-slate-500">Oldest first · #1 is top priority</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3">
            {COLUMNS.map((column) => {
              const inColumn = visible.filter((inquiry) => inquiry.column === column.id);
              return (
                <section key={column.id} className="flex w-[280px] shrink-0 flex-col rounded-xl border border-slate-800 bg-[#101828]">
                  <header className="flex items-center justify-between px-3 py-2.5 text-sm">
                    <span className="font-medium">{column.label}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{inColumn.length}</span>
                  </header>
                  <div className="space-y-2 px-2 pb-3">
                    {inColumn.map((inquiry) => (
                      <InquiryCard key={inquiry.id} inquiry={inquiry} active={inquiry.id === selectedId} onOpen={() => setSelectedId(inquiry.id)} />
                    ))}
                    {inColumn.length === 0 ? <p className="px-2 py-8 text-center text-xs text-slate-500">Nothing here</p> : null}
                  </div>
                </section>
              );
            })}
          </div>
          {showClosed ? (
            <ClosedRow inquiries={visible.filter((inquiry) => inquiry.column === 'closed')} onOpen={setSelectedId} />
          ) : null}
        </div>
      ) : tab === 'activity' ? (
        <ActivityFeed
          people={data?.workload || []}
          activity={data?.activity || []}
          personId={activityPerson}
          onPerson={setActivityPerson}
          onOpen={setSelectedId}
        />
      ) : tab === 'register' ? (
        <Register inquiries={data?.inquiries || []} onOpen={setSelectedId} />
      ) : (
        <AgentDirectory agents={data?.agents || []} onChanged={refresh} />
      )}
        </div>
        {panel ? (
          <aside className="flex h-[70vh] min-h-0 w-full shrink-0 flex-col overflow-hidden border-t border-slate-800 bg-[#0f172a] lg:h-auto lg:w-[420px] lg:border-l lg:border-t-0">
            {panel}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function InquiryCard({ inquiry, active, onOpen }: { inquiry: PipelineInquiry; active?: boolean; onOpen: () => void }) {
  const age = ageParts(inquiry.created_at);
  const best = inquiry.sends.find((send) => send.is_best);
  return (
    <button type="button" onClick={onOpen} className={`w-full rounded-lg border p-3 text-left ${active ? 'border-blue-400 bg-blue-500/10' : 'border-slate-700 bg-[#151c2c] hover:border-slate-500'}`}>
      <div className="flex items-center gap-2">
        {inquiry.priority_rank ? <span className="text-xs font-semibold text-slate-400">#{inquiry.priority_rank}</span> : null}
        <span className="font-mono text-sm text-blue-300">{inquiry.enquiry_number}</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${age.className}`}>{age.label}</span>
      </div>
      <p className="mt-1 truncate text-sm font-medium">{inquiry.prospect_name || inquiry.title || 'Inquiry'}</p>
      <p className="truncate text-xs text-slate-400">{inquiry.route}</p>
      <div className="mt-2 flex items-center gap-1">
        {inquiry.operators.map((operator) => (
          <span key={operator.user_id} title={operator.full_name} className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ${personColor(operator.full_name)}`}>
            {initial(operator.full_name)}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-slate-400">
          {inquiry.column === 'best_selected' && best ? (
            <span className="text-emerald-300">✓ {best.agent_name}</span>
          ) : inquiry.rates_sent === 0 ? (
            'no agents yet'
          ) : (
            `${inquiry.rates_received}/${inquiry.rates_sent} rates`
          )}
        </span>
      </div>
    </button>
  );
}

function ClosedRow({ inquiries, onOpen }: { inquiries: PipelineInquiry[]; onOpen: (id: string) => void }) {
  if (!inquiries.length) return null;
  return (
    <section className="rounded-xl border border-slate-800 p-3">
      <h3 className="text-sm font-medium text-slate-300">Closed</h3>
      <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {inquiries.map((inquiry) => (
          <InquiryCard key={inquiry.id} inquiry={inquiry} onOpen={() => onOpen(inquiry.id)} />
        ))}
      </div>
    </section>
  );
}

function ActivityFeed({
  people,
  activity,
  personId,
  onPerson,
  onOpen,
}: {
  people: Array<{ user_id: string; full_name: string }>;
  activity: Array<{ id: string; at: string; user_id: string | null; user_name: string; enquiry_id: string; enquiry_number: string; text: string }>;
  personId: string | null;
  onPerson: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const rows = personId ? activity.filter((item) => item.user_id === personId) : activity;
  return (
    <div className="pt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Activity</h2>
          <p className="text-sm text-slate-400">Everything the team does, newest first.</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <FilterChip active={!personId} onClick={() => onPerson(null)}>Everyone</FilterChip>
          {people.map((person) => (
            <FilterChip key={person.user_id} active={personId === person.user_id} onClick={() => onPerson(person.user_id)}>
              {person.full_name}
            </FilterChip>
          ))}
        </div>
      </div>
      <div className="mt-4 divide-y divide-slate-800 rounded-xl border border-slate-700 bg-[#151c2c]">
        {rows.length === 0 ? <p className="px-4 py-8 text-sm text-slate-500">No activity yet.</p> : null}
        {rows.map((item) => (
          <div key={item.id} className="flex items-start gap-3 px-4 py-3 text-sm">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${personColor(item.user_name)}`}>
              {initial(item.user_name)}
            </span>
            <p className="min-w-0 flex-1">
              <span className="font-medium">{item.user_name}</span> {item.text}{' '}
              <button type="button" className="font-mono text-blue-300 hover:underline" onClick={() => onOpen(item.enquiry_id)}>
                {item.enquiry_number}
              </button>
            </p>
            <span className="shrink-0 text-xs text-slate-500">{formatUkDateTime(item.at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-3 py-1 text-xs ${active ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-slate-300'}`}>
      {children}
    </button>
  );
}

function Register({ inquiries, onOpen }: { inquiries: PipelineInquiry[]; onOpen: (id: string) => void }) {
  const rows = [...inquiries].sort((a, b) => (a.priority_rank || 999) - (b.priority_rank || 999));
  return (
    <div className="pt-4">
      <h2 className="text-lg font-semibold">Inquiry register</h2>
      <p className="text-sm text-slate-400">One row per inquiry ID, with the best quote selected.</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-700">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-[#111827] text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              {['Priority', 'Inquiry ID', 'Customer', 'Route', 'Received', 'Age', 'Assigned', 'Rates', 'Best quote', 'Agent', 'Chosen by', 'Status', 'CRM'].map((heading) => (
                <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((inquiry) => {
              const best = inquiry.sends.find((send) => send.is_best);
              const age = ageParts(inquiry.created_at);
              return (
                <tr key={inquiry.id} className="border-t border-slate-800 bg-[#151c2c]">
                  <td className="px-3 py-2 text-slate-400">{inquiry.priority_rank ? `#${inquiry.priority_rank}` : '—'}</td>
                  <td className="px-3 py-2">
                    <button type="button" className="font-mono text-blue-300 hover:underline" onClick={() => onOpen(inquiry.id)}>
                      {inquiry.enquiry_number}
                    </button>
                  </td>
                  <td className="px-3 py-2">{inquiry.prospect_name || inquiry.title || '—'}</td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-slate-300">{inquiry.route}</td>
                  <td className="px-3 py-2 text-slate-300">{formatUkDate(inquiry.created_at)}</td>
                  <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] ${age.className}`}>{age.label}</span></td>
                  <td className="px-3 py-2">
                    <span className="flex gap-1">
                      {inquiry.operators.map((operator) => (
                        <span key={operator.user_id} title={operator.full_name} className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ${personColor(operator.full_name)}`}>
                          {initial(operator.full_name)}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-3 py-2">{inquiry.rates_received}/{inquiry.rates_sent}</td>
                  <td className="px-3 py-2">{best ? money(best.quoted_price, best.currency) : '—'}</td>
                  <td className="px-3 py-2">{best?.agent_name || '—'}</td>
                  <td className="px-3 py-2">{best?.user_name || '—'}</td>
                  <td className="px-3 py-2">{statusLabel(inquiry.column)}</td>
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/enquiries/${inquiry.id}`} className="text-blue-300 hover:underline">Open</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AgentDirectory({ agents, onChanged }: { agents: DirectoryAgent[]; onChanged: () => void }) {
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: () => saveDirectoryAgent({ company_name: company.trim(), contact_name: contact.trim() || null, email: email.trim() || null }, editing || undefined),
    onSuccess: () => {
      setCompany('');
      setContact('');
      setEmail('');
      setEditing(null);
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMut = useMutation({
    mutationFn: deleteDirectoryAgent,
    onSuccess: () => onChanged(),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="pt-4">
      <h2 className="text-lg font-semibold">Agents</h2>
      <p className="text-sm text-slate-400">Shared directory of agent companies. Agents added on an inquiry are saved here.</p>
      <form
        className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (company.trim().length < 2) return;
          saveMut.mutate();
        }}
      >
        <input className={field} value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Agent company" />
        <input className={field} value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Contact person" />
        <input className={field} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <button type="submit" disabled={saveMut.isPending || company.trim().length < 2} className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium disabled:opacity-50">
          {editing ? 'Update agent' : 'Save agent'}
        </button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-700">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-[#111827] text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              {['Company', 'Contact person', 'Email', 'Requests', 'Rates', 'Chosen best', ''].map((heading) => (
                <th key={heading || 'actions'} className="px-3 py-2 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">No saved agents yet.</td></tr>
            ) : null}
            {agents.map((agent) => (
              <tr key={agent.id} className="border-t border-slate-800 bg-[#151c2c]">
                <td className="px-3 py-2">{agent.company_name}</td>
                <td className="px-3 py-2 text-slate-300">{agent.contact_name || '—'}</td>
                <td className="px-3 py-2 text-slate-300">{agent.email || '—'}</td>
                <td className="px-3 py-2">{agent.requests}</td>
                <td className="px-3 py-2">{agent.rates}</td>
                <td className="px-3 py-2">{agent.chosen}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="mr-3 text-xs text-blue-300"
                    onClick={() => {
                      setEditing(agent.id);
                      setCompany(agent.company_name);
                      setContact(agent.contact_name || '');
                      setEmail(agent.email || '');
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="text-xs text-rose-300" onClick={() => deleteMut.mutate(agent.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
