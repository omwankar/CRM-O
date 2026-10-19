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
      <div className="vh">
        <div>
          <h2>Activity</h2>
          <p>Everything the team does, newest first: agents contacted, rates received, best quotes chosen and notes.</p>
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
      <div className="panel" style={{ padding: '4px 18px' }}>
        {groups.length === 0 ? <div className="empty" style={{ border: 0, margin: 0 }}>No activity yet.</div> : null}
        <ul className="feed">
          {groups.flatMap((group) => [
            <li key={`d-${group.label}`} className="hint" style={{ paddingTop: 12, listStyle: 'none' }}><b>{group.label}</b></li>,
            ...group.items.map((item) => (
              <li key={item.id} className="fi">
                <Avatar name={item.user_name} size="s" />
                <div>
                  <div className="t">
                    <b>{item.user_name}</b> <ActivityText text={item.text} /> ·{' '}
                    <button type="button" className="idlink" onClick={() => onOpen(item.enquiry_id)}>
                      {item.enquiry_number}
                    </button>
                  </div>
                  <div className="w">{formatUkDateTime(item.at)}</div>
                </div>
              </li>
            )),
          ])}
        </ul>
      </div>
    </div>
  );
}

function ActivityText({ text }: { text: string }) {
  const match = text.match(/^(contacted |got a quote from |chose )(.+?)( as best quote)?$/);
  if (!match) return <>{text}</>;
  return <>{match[1]}<em>{match[2]}</em>{match[3] || ''}</>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}
