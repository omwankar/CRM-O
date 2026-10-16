'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { AgePill, AvatarStack, StatusPill } from '@/components/operations/bits';
import { formatRoute, money } from '@/components/operations/opsVisual';
import { formatUkDate } from '@/lib/date';
import type { PipelineInquiry } from '@/lib/api/operations';

export function RegisterTable({ inquiries, onOpen }: { inquiries: PipelineInquiry[]; onOpen: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return [...inquiries]
      .filter((inquiry) => (status === 'all' ? true : inquiry.column === status))
      .filter((inquiry) => {
        if (!needle) return true;
        return [inquiry.enquiry_number, inquiry.prospect_name, inquiry.title, formatRoute(inquiry)].join(' ').toLowerCase().includes(needle);
      })
      .sort((a, b) => (a.priority_rank || 999) - (b.priority_rank || 999));
  }, [inquiries, search, status]);

  return (
    <div>
      <h2 className="text-lg font-semibold">Inquiry register</h2>
      <p className="text-sm" style={{ color: 'var(--ops-muted)' }}>One row per inquiry, with the best quote selected.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4" style={{ color: 'var(--ops-faint)' }} aria-hidden />
          <input aria-label="Search register" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID or customer" className="h-9 w-full rounded-[7px] border bg-[var(--ops-surface)] pl-8 pr-3 text-sm" style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }} />
        </label>
        <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-[7px] border bg-[var(--ops-surface)] px-2 text-sm" style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }}>
          <option value="all">All statuses</option>
          <option value="to_send">To send</option>
          <option value="waiting">Waiting for rates</option>
          <option value="choose_best">Choose best</option>
          <option value="best_selected">Best selected</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="ops-scroll mt-3 max-h-[calc(100vh-260px)] overflow-auto rounded-[12px] border" style={{ background: 'var(--ops-surface)', borderColor: 'var(--ops-line)' }}>
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="sticky top-0 text-[11px] uppercase tracking-wide" style={{ background: 'var(--ops-sunk)', color: 'var(--ops-muted)' }}>
            <tr>
              {['Priority', 'Inquiry ID', 'Customer', 'Route', 'Received', 'Age', 'Assigned', 'Rates', 'Best quote', 'Chosen by', 'Status', 'Open'].map((heading) => (
                <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((inquiry) => {
              const best = inquiry.sends.find((send) => send.is_best);
              const route = formatRoute(inquiry);
              const progress = inquiry.rates_sent ? Math.round((inquiry.rates_received / inquiry.rates_sent) * 100) : 0;
              return (
                <tr key={inquiry.id} className="ops-row cursor-pointer border-t" style={{ borderColor: 'var(--ops-line-soft)', color: 'var(--ops-fg)' }} onClick={() => onOpen(inquiry.id)}>
                  <td className="ops-mono px-3 py-2">{inquiry.priority_rank ? `#${inquiry.priority_rank}` : '—'}</td>
                  <td className="px-3 py-2">
                    <button type="button" className="ops-mono whitespace-nowrap font-semibold" style={{ color: 'var(--ops-accent)' }} onClick={(event) => { event.stopPropagation(); onOpen(inquiry.id); }}>
                      {inquiry.enquiry_number}
                    </button>
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2">{inquiry.prospect_name || inquiry.title || '—'}</td>
                  <td className="max-w-[220px] truncate px-3 py-2" title={route}>{route}</td>
                  <td className="ops-mono whitespace-nowrap px-3 py-2">{formatUkDate(inquiry.created_at)}</td>
                  <td className="px-3 py-2"><AgePill createdAt={inquiry.created_at} /></td>
                  <td className="px-3 py-2"><AvatarStack names={inquiry.operators.map((operator) => operator.full_name)} /></td>
                  <td className="px-3 py-2">
                    <span className="ops-mono">{inquiry.rates_received}/{inquiry.rates_sent}</span>
                    <span className="mt-1 block h-1 w-14 overflow-hidden rounded-full" style={{ background: 'var(--ops-sunk)' }}>
                      <span className="block h-full" style={{ width: `${progress}%`, background: 'var(--ops-accent)' }} />
                    </span>
                  </td>
                  <td className="ops-mono whitespace-nowrap px-3 py-2" style={{ color: 'var(--ops-ok)' }}>{best ? money(best.quoted_price, best.currency) : '—'}</td>
                  <td className="px-3 py-2">{best?.user_name || '—'}</td>
                  <td className="px-3 py-2"><StatusPill column={inquiry.column} /></td>
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/enquiries/${inquiry.id}`} className="text-sm font-medium" style={{ color: 'var(--ops-accent)' }} onClick={(event) => event.stopPropagation()}>Open</Link>
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
