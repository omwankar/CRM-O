'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar, StatusPill } from '@/components/operations/bits';
import { formatRoute } from '@/components/operations/opsVisual';
import { formatUkDateTime } from '@/lib/date';
import { postInquiryUpdate, type PipelineActivity, type PipelineInquiry } from '@/lib/api/operations';

function newestFirst(a: PipelineActivity, b: PipelineActivity) {
  return new Date(b.at).getTime() - new Date(a.at).getTime();
}

export function ActivityFeed({
  people,
  activity,
  inquiries,
  personId,
  onPerson,
  onOpen,
  onChanged,
  userId,
  isManager,
}: {
  people: Array<{ user_id: string; full_name: string }>;
  activity: PipelineActivity[];
  inquiries: PipelineInquiry[];
  personId: string | null;
  onPerson: (id: string | null) => void;
  onOpen: (id: string) => void;
  onChanged?: () => void;
  userId?: string;
  isManager?: boolean;
}) {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const byInquiry = useMemo(() => {
    const assigned = new Set(
      inquiries.filter((inquiry) => inquiry.operators.some((operator) => operator.user_id === userId)).map((inquiry) => inquiry.id),
    );
    const list = [...activity]
      .filter((item) => (isManager || assigned.has(item.enquiry_id)))
      .filter((item) => (personId ? item.user_id === personId : true))
      .sort(newestFirst);
    const groups = new Map<string, PipelineActivity[]>();
    for (const item of list) {
      const key = item.enquiry_id || '';
      const rows = groups.get(key) || [];
      rows.push(item);
      groups.set(key, rows);
    }
    const needle = search.trim().toLowerCase();
    return [...groups.keys()]
      .map((id) => {
        const items = groups.get(id) || [];
        const inquiry = inquiries.find((row) => row.id === id);
        return { id, items, inquiry, last: items[0] };
      })
      .filter(({ inquiry, last }) => {
        if (!needle) return true;
        const hay = [
          inquiry?.enquiry_number || last?.enquiry_number,
          inquiry?.prospect_name,
          inquiry ? formatRoute(inquiry) : '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(needle);
      });
  }, [activity, inquiries, personId, search, isManager, userId]);

  const allOpen = byInquiry.length > 0 && byInquiry.every((group) => openIds.includes(group.id));

  return (
    <div>
      <div className="vh">
        <div>
          <h2>Activity</h2>
          <p>
            {isManager
              ? 'Grouped by shipment, most recently active first. Open a shipment to see everything the team did on it.'
              : 'Activity on the shipments assigned to you, grouped by shipment.'}
          </p>
        </div>
        <div className="seg">
          <Chip active={!personId} onClick={() => onPerson(null)}>Everyone</Chip>
          {people.map((person) => (
            <Chip key={person.user_id} active={personId === person.user_id} onClick={() => onPerson(person.user_id)}>
              {person.full_name}
            </Chip>
          ))}
        </div>
      </div>
      <div className="toolbar" style={{ margin: '0 0 12px' }}>
        <input
          className="search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search inquiry ID, customer, route"
        />
        <span className="hint">{byInquiry.length} shipment{byInquiry.length === 1 ? '' : 's'}</span>
        <span className="spacer" />
        {byInquiry.length ? (
          <button className="btn sm ghost" type="button" onClick={() => setOpenIds(allOpen ? [] : byInquiry.map((group) => group.id))}>
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        ) : null}
      </div>
      <div className="agroups">
        {byInquiry.length === 0 ? <div className="empty" style={{ margin: 0 }}>No activity yet.</div> : null}
        {byInquiry.map((group) => {
          const isOpen = openIds.includes(group.id);
          const inquiry = group.inquiry;
          const last = group.last;
          const assigned = Boolean(userId && inquiry?.operators.some((operator) => operator.user_id === userId));
          const canNote = Boolean(inquiry && inquiry.column !== 'closed' && (isManager || assigned));
          return (
            <section key={group.id} className={`agrp${isOpen ? ' open' : ''}`}>
              <div className="agh">
                <button
                  className="agtoggle"
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIds((current) => (isOpen ? current.filter((id) => id !== group.id) : [...current, group.id]))}
                >
                  <span className="chev" aria-hidden>{isOpen ? '▾' : '▸'}</span>
                  <span className="agid mono">{inquiry?.enquiry_number || last?.enquiry_number || 'Unknown inquiry'}</span>
                  <span className="agsub">
                    {inquiry?.prospect_name || ''}
                    {inquiry && formatRoute(inquiry) ? ` · ${formatRoute(inquiry)}` : ''}
                  </span>
                  {inquiry ? <StatusPill column={inquiry.column} closedLabel={inquiry.column === 'closed' ? (inquiry.outcome?.split(' — ')[0] || 'Closed') : undefined} /> : <span className="pill crit">Deleted</span>}
                  <span className="pill">{group.items.length} {group.items.length === 1 ? 'entry' : 'entries'}</span>
                  {!isOpen && last ? (
                    <span className="updlast">
                      <b>{last.user_name}</b> {last.text} · {formatUkDateTime(last.at)}
                    </span>
                  ) : null}
                </button>
                {inquiry ? <button className="btn sm ghost" type="button" onClick={() => onOpen(group.id)}>Open</button> : null}
              </div>
              {isOpen ? (
                <div className="agbody">
                  {canNote && inquiry ? <NoteForm enquiryId={inquiry.id} enquiryNumber={inquiry.enquiry_number} onChanged={onChanged} /> : null}
                  <ul className="feed">
                    {group.items.map((item) => (
                      <li key={item.id} className="fi">
                        <Avatar name={item.user_name} size="s" />
                        <div>
                          <div className="t"><b>{item.user_name}</b> {item.text}</div>
                          <div className="w">{formatUkDateTime(item.at)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function NoteForm({ enquiryId, enquiryNumber, onChanged }: { enquiryId: string; enquiryNumber: string; onChanged?: () => void }) {
  const [body, setBody] = useState('');
  const mut = useMutation({
    mutationFn: () => postInquiryUpdate(enquiryId, body.trim()),
    onSuccess: () => { setBody(''); onChanged?.(); },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <form
      className="noteform"
      onSubmit={(event) => {
        event.preventDefault();
        if (body.trim()) mut.mutate();
      }}
    >
      <input className="field" value={body} onChange={(event) => setBody(event.target.value)} placeholder={`Add a note on ${enquiryNumber}`} autoComplete="off" />
      <button className="btn" type="submit" disabled={mut.isPending || !body.trim()}>Add note</button>
    </form>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}
