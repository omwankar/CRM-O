'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, Users } from 'lucide-react';
import { deleteDirectoryAgent, saveDirectoryAgent, type DirectoryAgent } from '@/lib/api/operations';

export function AgentsTable({ agents, onChanged }: { agents: DirectoryAgent[]; onChanged: () => void }) {
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const saveMut = useMutation({
    mutationFn: () => saveDirectoryAgent({ company_name: company.trim(), contact_name: contact.trim() || null, email: email.trim() || null, phone: phone.trim() || null }, editing || undefined),
    onSuccess: () => { setCompany(''); setContact(''); setPhone(''); setEmail(''); setEditing(null); onChanged(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMut = useMutation({
    mutationFn: deleteDirectoryAgent,
    onSuccess: () => onChanged(),
    onError: (error: Error) => toast.error(error.message),
  });
  const visible = agents.filter((agent) => agent.company_name.toLowerCase().includes(search.trim().toLowerCase()));
  const input = 'h-9 w-full rounded-[7px] border bg-[var(--ops-surface)] px-3 text-sm';

  return (
    <div>
      <h2 className="text-lg font-semibold">Agents</h2>
      <p className="text-sm" style={{ color: 'var(--ops-muted)' }}>Shared directory. Agents you add on an inquiry are saved here.</p>
      <form className="mt-4 grid gap-2 lg:[grid-template-columns:1.4fr_1fr_1fr_1.3fr_auto]" onSubmit={(event) => { event.preventDefault(); if (company.trim().length >= 2) saveMut.mutate(); }}>
        <input className={input} style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }} value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Agent company" aria-label="Agent company" />
        <input className={input} style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }} value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Contact person" aria-label="Contact person" />
        <input className={input} style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number" aria-label="Agent phone number" />
        <input className={input} style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" aria-label="Email" />
        <button type="submit" disabled={saveMut.isPending || company.trim().length < 2} className="h-9 rounded-[7px] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40" style={{ background: 'var(--ops-accent)' }}>
          {editing ? 'Update agent' : 'Save agent'}
        </button>
      </form>
      <input aria-label="Search agents" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search companies" className={`${input} mt-3 max-w-sm`} style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }} />
      <div className="ops-scroll mt-3 overflow-x-auto rounded-[12px] border" style={{ background: 'var(--ops-surface)', borderColor: 'var(--ops-line)' }}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide" style={{ background: 'var(--ops-sunk)', color: 'var(--ops-muted)' }}>
            <tr>{['Company', 'Contact', 'Phone', 'Email', 'Requests', 'Rates', 'Chosen best', ''].map((heading) => <th key={heading || 'actions'} className="px-3 py-2 font-medium">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center" style={{ color: 'var(--ops-muted)' }}>
                  <Users className="mx-auto mb-2 h-5 w-5" aria-hidden />
                  No saved agents yet. Agents you add on an inquiry appear here.
                </td>
              </tr>
            ) : null}
            {visible.map((agent) => {
              const rate = agent.requests ? Math.round((agent.rates / agent.requests) * 100) : 0;
              return (
                <tr key={agent.id} className="border-t" style={{ borderColor: 'var(--ops-line-soft)', color: 'var(--ops-fg)' }}>
                  <td className="px-3 py-2 font-medium">{agent.company_name}</td>
                  <td className="px-3 py-2">{agent.contact_name || '—'}</td>
                  <td className="px-3 py-2">{agent.phone || '—'}</td>
                  <td className="px-3 py-2">
                    {agent.email ? (
                      <button type="button" className="inline-flex items-center gap-1" aria-label={`Copy ${agent.email}`} onClick={() => navigator.clipboard.writeText(agent.email || '')}>
                        {agent.email} <Copy className="h-3.5 w-3.5" />
                      </button>
                    ) : '—'}
                  </td>
                  <td className="ops-mono px-3 py-2">{agent.requests}</td>
                  <td className="px-3 py-2">
                    <span className="ops-mono">{agent.rates} · {rate}%</span>
                    <span className="mt-1 block h-1 w-16 overflow-hidden rounded-full" style={{ background: 'var(--ops-sunk)' }}>
                      <span className="block h-full" style={{ width: `${rate}%`, background: 'var(--ops-ok)' }} />
                    </span>
                  </td>
                  <td className="ops-mono px-3 py-2">{agent.chosen}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" className="mr-3 text-xs font-medium" style={{ color: 'var(--ops-accent)' }} onClick={() => { setEditing(agent.id); setCompany(agent.company_name); setContact(agent.contact_name || ''); setPhone(agent.phone || ''); setEmail(agent.email || ''); }}>Edit</button>
                    <button type="button" className="text-xs font-medium" style={{ color: 'var(--ops-crit)' }} onClick={() => deleteMut.mutate(agent.id)}>Remove</button>
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
