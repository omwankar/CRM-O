import { Avatar } from '@/components/operations/bits';

export function PeopleFilter({
  people,
  personId,
  onPerson,
  meId,
  allCount,
}: {
  people: Array<{ user_id: string; full_name: string; open_count: number; rates_awaited: number }>;
  personId: string | null;
  onPerson: (id: string | null) => void;
  meId?: string;
  allCount: number;
}) {
  return (
    <div className="strip">
      <button type="button" className="wk" aria-pressed={!personId} onClick={() => onPerson(null)}>
        <span className="av" style={{ background: '#1E3F8C', fontSize: 9 }}>All</span>
        <div className="nm">All inquiries</div>
        <div className="ct">
          <span className="big">{allCount}</span>
          on the pipeline
        </div>
      </button>
      {people.map((person) => (
        <button
          key={person.user_id}
          type="button"
          className="wk"
          aria-pressed={personId === person.user_id}
          onClick={() => onPerson(personId === person.user_id ? null : person.user_id)}
        >
          <Avatar name={person.full_name} />
          <div className="nm">
            {person.full_name}
            {meId && person.user_id === meId ? <span className="hint">(you)</span> : <span className="dot on" title="Login linked" />}
          </div>
          <div className="ct">
            <span className="big">{person.open_count}</span>
            working on · {person.rates_awaited} rate{person.rates_awaited === 1 ? '' : 's'} awaited
          </div>
        </button>
      ))}
    </div>
  );
}
