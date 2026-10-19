import type { ReactNode } from 'react';
import { Avatar } from '@/components/operations/bits';
import { dayGroup } from '@/components/operations/opsVisual';
import { formatUkDateTime } from '@/lib/date';
import type { PipelineActivity } from '@/lib/api/operations';

export function ActivityFeed({
  people,
  activity,
  personId,
  onPerson,
  onOpen,
}: {
  people: Array<{ user_id: string; full_name: string }>;
  activity: PipelineActivity[];
  personId: string | null;
  onPerson: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const rows = personId ? activity.filter((item) => item.user_id === personId) : activity;
  const groups: Array<{ label: string; items: PipelineActivity[] }> = [];
  for (const item of rows) {
    const label = dayGroup(item.at);
    const last = groups[groups.length - 1];
    if (!last || last.label !== label) groups.push({ label, items: [item] });
    else last.items.push(item);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Activity</h2>
          <p className="text-sm" style={{ color: 'var(--ops-muted)' }}>Everything the team does, newest first.</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Chip active={!personId} onClick={() => onPerson(null)}>Everyone</Chip>
          {people.map((person) => (
            <Chip key={person.user_id} active={personId === person.user_id} onClick={() => onPerson(person.user_id)}>{person.full_name}</Chip>
          ))}
        </div>
      </div>
      <div className="ops-scroll mt-4 max-h-[calc(100vh-240px)] overflow-auto rounded-[12px] border" style={{ background: 'var(--ops-surface)', borderColor: 'var(--ops-line)', boxShadow: 'var(--ops-shadow)' }}>
        {groups.length === 0 ? <p className="px-4 py-8 text-sm" style={{ color: 'var(--ops-muted)' }}>No activity yet.</p> : null}
        {groups.map((group) => (
          <div key={group.label}>
            <p className="sticky top-0 px-4 py-2 text-xs font-semibold" style={{ background: 'var(--ops-sunk)', color: 'var(--ops-muted)' }}>{group.label}</p>
            {group.items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 border-t px-4 py-3 text-sm" style={{ borderColor: 'var(--ops-line-soft)' }}>
                <Avatar name={item.user_name} />
                <p className="min-w-0 flex-1" style={{ color: 'var(--ops-fg)' }}>
                  <span className="font-semibold">{item.user_name}</span> <ActivityText text={item.text} />{' '}
                  on{' '}
                  <button type="button" className="ops-mono font-medium" style={{ color: 'var(--ops-accent)' }} onClick={() => onOpen(item.enquiry_id)}>
                    {item.enquiry_number}
                  </button>
                </p>
                <time className="shrink-0 text-xs" style={{ color: 'var(--ops-faint)' }} dateTime={item.at}>{formatUkDateTime(item.at)}</time>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityText({ text }: { text: string }) {
  const match = text.match(/^(contacted |got a quote from |chose )(.+?)( as best quote)?$/);
  if (!match) return text;
  return (
    <>
      {match[1]}
      <em>{match[2]}</em>
      {match[3] || ''}
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="h-9 rounded-full px-3 text-xs font-medium" style={active ? { background: 'var(--ops-accent)', color: '#fff' } : { background: 'var(--ops-surface)', color: 'var(--ops-muted)', boxShadow: 'inset 0 0 0 1px var(--ops-line)' }}>
      {children}
    </button>
  );
}
