'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
      });
  }, [inquiries, search, status]);

  return (
    <div>
      <div className="vh">
        <div>
          <h2>Inquiry register</h2>
          <p>One row per inquiry ID with the best quote selected. Open in CRM jumps to the same ID in your Inquiry module.</p>
        </div>
      </div>
      <div className="toolbar" style={{ marginTop: 0 }}>
        <input className="search" aria-label="Search register" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID or customer" />
        <select className="field sel" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All</option>
          <option value="to_send">To send</option>
          <option value="waiting">Waiting for rates</option>
          <option value="choose_best">Choose best</option>
          <option value="best_selected">Best selected</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="panel tbl-wrap" style={{ marginTop: 12 }}>
        <table className="reg">
          <thead>
            <tr>
              {['Priority', 'Inquiry ID', 'Customer', 'Route', 'Received', 'Age', 'Assigned', 'Rates', 'Best quote', 'Chosen by', 'Status', 'CRM'].map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={12} className="hint" style={{ textAlign: 'center', padding: 24 }}>No inquiries yet.</td></tr>
            ) : null}
            {rows.map((inquiry) => {
              const best = inquiry.sends.find((send) => send.is_best);
              const route = formatRoute(inquiry);
              return (
                <tr key={inquiry.id} className="lrow" onClick={() => onOpen(inquiry.id)}>
                  <td className="num">{inquiry.priority_rank ? `#${inquiry.priority_rank}` : '—'}</td>
                  <td>
                    <button type="button" className="idlink" onClick={(event) => { event.stopPropagation(); onOpen(inquiry.id); }}>
                      {inquiry.enquiry_number}
                    </button>
                  </td>
                  <td>{inquiry.prospect_name || inquiry.title || '—'}</td>
                  <td title={route}>{route || '—'}</td>
                  <td className="num">{formatUkDate(inquiry.created_at)}</td>
                  <td><AgePill createdAt={inquiry.created_at} closed={inquiry.column === 'closed'} /></td>
                  <td><AvatarStack names={inquiry.operators.map((operator) => operator.full_name)} /></td>
                  <td className="num">{inquiry.rates_received}/{inquiry.rates_sent}</td>
                  <td className="num" style={{ color: 'var(--ok)' }}>{best ? money(best.quoted_price, best.currency) : '—'}</td>
                  <td>{best?.user_name || '—'}</td>
                  <td><StatusPill column={inquiry.column} /></td>
                  <td>
                    <Link href={`/dashboard/enquiries/${inquiry.id}`} onClick={(event) => event.stopPropagation()}>Open ↗</Link>
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
