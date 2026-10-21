'use client';

import { Fragment, useMemo, useState } from 'react';
import { BoardColumn } from '@/components/operations/BoardColumn';
import { AgePill, AvatarStack, StatusPill } from '@/components/operations/bits';
import { COLUMNS, dayShort, formatRoute, inquiryDayKey, quoteShort } from '@/components/operations/opsVisual';
import type { PipelineInquiry } from '@/lib/api/operations';

type LayoutMode = 'list' | 'board';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'pick';

function ageDays(iso: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const received = new Date(`${inquiryDayKey(iso)}T00:00:00`);
  if (Number.isNaN(received.getTime())) return 0;
  return Math.max(0, Math.round((start.getTime() - received.getTime()) / 86400000));
}

function inDate(inquiry: PipelineInquiry, listDate: DateFilter, listDay: string) {
  const key = inquiryDayKey(inquiry.created_at);
  if (listDate === 'pick') return !listDay || key === listDay;
  if (listDate === 'all') return true;
  const max = { today: 0, week: 6, month: 29 }[listDate];
  return key ? ageDays(inquiry.created_at) <= max : false;
}

export function Board({
  title,
  search,
  onSearch,
  inquiries,
  selectedId,
  onOpen,
  onNew,
  isManager,
  personId,
  onClearPerson,
}: {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  inquiries: PipelineInquiry[];
  selectedId: string | null;
  onOpen: (id: string) => void;
  onNew?: () => void;
  isManager?: boolean;
  personId?: string | null;
  onClearPerson?: () => void;
}) {
  const [mode, setMode] = useState<LayoutMode>('list');
  const [sort, setSort] = useState<'new' | 'old'>('new');
  const [listDate, setListDate] = useState<DateFilter>('all');
  const [listDay, setListDay] = useState('');
  const [listStatus, setListStatus] = useState('all');
  const [showClosed, setShowClosed] = useState(false);

  const dated = useMemo(() => {
    const next = inquiries.filter((inquiry) => inDate(inquiry, listDate, listDay));
    next.sort((a, b) => {
      const cmp = inquiryDayKey(a.created_at).localeCompare(inquiryDayKey(b.created_at)) || a.created_at.localeCompare(b.created_at);
      return sort === 'new' ? -cmp : cmp;
    });
    return next;
  }, [inquiries, listDate, listDay, sort]);

  const listed = useMemo(() => {
    if (listStatus === 'all') return dated;
    if (listStatus === 'closed') return dated.filter((inquiry) => inquiry.column === 'closed');
    if (listStatus === 'open') return dated.filter((inquiry) => inquiry.column !== 'closed' && inquiry.column !== 'best_selected');
    if (listStatus === 'best') return dated.filter((inquiry) => inquiry.column === 'best_selected');
    return dated;
  }, [dated, listStatus]);

  if (!inquiries.length && isManager && !search) {
    return (
      <>
        <div className="toolbar">
          <h2>{title}</h2>
        </div>
        <div className="empty">
          <h3>No inquiries yet</h3>
          Create an inquiry with its ID and assign it to one or more people. It appears on their screen straight away.
          <div className="acts" style={{ marginTop: 12, justifyContent: 'center' }}>
            <button className="btn pri" type="button" onClick={onNew}>New inquiry</button>
          </div>
        </div>
      </>
    );
  }

  if (!inquiries.length && !search && !isManager) {
    return (
      <>
        <div className="toolbar"><h2>{title}</h2></div>
        <div className="empty">
          <h3>Nothing assigned to you yet</h3>
          When your manager assigns you an inquiry, it shows up here, oldest first.
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="toolbar">
        <h2>{title}</h2>
        <input
          className="search"
          id="q"
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search ID, customer, route, agent"
        />
        <div className="seg modeseg" role="group" aria-label="Layout">
          <button className="chip" type="button" aria-pressed={mode === 'list'} onClick={() => setMode('list')}>List</button>
          <button className="chip" type="button" aria-pressed={mode === 'board'} onClick={() => setMode('board')}>Board</button>
        </div>
        <label className="chk" htmlFor="lsSort">
          Sort{' '}
          <select className="field sel" id="lsSort" value={sort} onChange={(event) => setSort(event.target.value as 'new' | 'old')}>
            <option value="new">Newest inquiry date first</option>
            <option value="old">Oldest inquiry date first</option>
          </select>
        </label>
        <label className="chk" htmlFor="lsDate">
          Inquiry date{' '}
          <select className="field sel" id="lsDate" value={listDate} onChange={(event) => setListDate(event.target.value as DateFilter)}>
            <option value="all">Any date</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="pick">On a date…</option>
          </select>
        </label>
        {listDate === 'pick' ? (
          <input className="field sel" id="lsDay" type="date" value={listDay} onChange={(event) => setListDay(event.target.value)} aria-label="Inquiry date" />
        ) : null}
        {mode === 'list' ? (
          <label className="chk" htmlFor="lsStatus">
            Status{' '}
            <select className="field sel" id="lsStatus" value={listStatus} onChange={(event) => setListStatus(event.target.value)}>
              <option value="all">All</option>
              <option value="open">Still open</option>
              <option value="best">Best selected</option>
              <option value="closed">All closed</option>
            </select>
          </label>
        ) : (
          <label className="chk" htmlFor="cl">
            <input id="cl" type="checkbox" checked={showClosed} onChange={(event) => setShowClosed(event.target.checked)} /> Show closed
          </label>
        )}
        {isManager && personId ? (
          <button className="btn sm ghost" type="button" onClick={onClearPerson}>Show everyone</button>
        ) : null}
        <span className="spacer" />
        <span className="hint">#1 = oldest open inquiry · colour shows age: green new, amber 2–3 days, red 4+ days</span>
      </div>

      {mode === 'list' ? (
        <InquiryList rows={listed} total={inquiries.length} selectedId={selectedId} onOpen={onOpen} />
      ) : (
        <>
          <div className="board">
            {COLUMNS.map((column) => (
              <BoardColumn
                key={column.id}
                label={column.label}
                bar={column.bar}
                empty={column.empty}
                inquiries={dated.filter((inquiry) => inquiry.column === column.id)}
                selectedId={selectedId}
                onOpen={onOpen}
              />
            ))}
            {showClosed ? (
              <BoardColumn
                label="Closed"
                bar="var(--line)"
                empty="None"
                inquiries={dated.filter((inquiry) => inquiry.column === 'closed')}
                selectedId={selectedId}
                onOpen={onOpen}
                showRanks={false}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function InquiryList({
  rows,
  total,
  selectedId,
  onOpen,
}: {
  rows: PipelineInquiry[];
  total: number;
  selectedId: string | null;
  onOpen: (id: string) => void;
}) {
  if (!rows.length) {
    return <div className="empty" style={{ marginTop: 12 }}>No inquiries match these filters.{total ? ' Try Any date and All.' : ''}</div>;
  }

  const counts: Record<string, number> = {};
  rows.forEach((inquiry) => {
    const key = inquiryDayKey(inquiry.created_at);
    counts[key] = (counts[key] || 0) + 1;
  });

  let lastDay: string | null = null;

  return (
    <>
      <div className="hint" style={{ marginTop: 10 }}>
        {rows.length === total ? `Showing all ${total}` : `Showing ${rows.length} of ${total}`} inquiries
      </div>
      <div className="panel tbl-wrap" style={{ marginTop: 6 }}>
        <table className="ltable">
          <thead>
            <tr>
              {['Priority', 'Inquiry ID', 'Inquiry date', 'Customer', 'Route', 'Assigned', 'Stage', 'Quotes', 'Best agent'].map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((inquiry) => {
              const day = inquiryDayKey(inquiry.created_at);
              const heading = day !== lastDay;
              lastDay = day;
              const best = inquiry.sends.find((send) => send.is_best);
              const route = formatRoute(inquiry);
              return (
                <Fragment key={inquiry.id}>
                  {heading ? (
                    <tr className="dgrp">
                      <td colSpan={9}>
                        <b>Inquiry date: {dayShort(inquiry.created_at)}</b>
                        {' '}
                        <span className="hint">· {counts[day]} inquir{counts[day] === 1 ? 'y' : 'ies'}</span>
                      </td>
                    </tr>
                  ) : null}
                  <tr
                    key={inquiry.id}
                    className={`lrow${selectedId === inquiry.id ? ' cur' : ''}`}
                    tabIndex={0}
                    onClick={() => onOpen(inquiry.id)}
                    onKeyDown={(event) => { if (event.key === 'Enter') onOpen(inquiry.id); }}
                  >
                    <td className="num">
                      {inquiry.priority_rank ? <span className={`rank${inquiry.priority_rank === 1 ? ' first' : ''}`}>#{inquiry.priority_rank}</span> : null}
                    </td>
                    <td><span className="mono lid">{inquiry.enquiry_number}</span></td>
                    <td><AgePill createdAt={inquiry.created_at} closed={inquiry.column === 'closed'} /></td>
                    <td>{inquiry.prospect_name || inquiry.title || '—'}</td>
                    <td>{route || '—'}</td>
                    <td><AvatarStack names={inquiry.operators.map((operator) => operator.full_name)} /></td>
                    <td><StatusPill column={inquiry.column} /></td>
                    <td className="num">{inquiry.rates_sent ? `${inquiry.rates_received}/${inquiry.rates_sent}` : '—'}</td>
                    <td>
                      {best ? (
                        <>
                          {best.agent_name}
                          {quoteShort(best.notes, best.quoted_price, best.currency) ? ` · ${quoteShort(best.notes, best.quoted_price, best.currency)}` : ''}
                        </>
                      ) : <span className="hint">—</span>}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
