import { Avatar } from '@/components/operations/bits';

export function PeopleFilter({
  people,
  personId,
  onPerson,
}: {
  people: Array<{ user_id: string; full_name: string; open_count: number; rates_awaited: number }>;
  personId: string | null;
  onPerson: (id: string | null) => void;
}) {
  return (
    <div className="strip">
      {people.map((person) => (
        <button
          key={person.user_id}
          type="button"
          className="wk"
          aria-pressed={personId === person.user_id}
          onClick={() => onPerson(personId === person.user_id ? null : person.user_id)}
        >
          <Avatar name={person.full_name} />
          <div className="nm">{person.full_name}</div>
          <div className="ct">
            <span className="big">{person.open_count}</span>
            working on · {person.rates_awaited} rate{person.rates_awaited === 1 ? '' : 's'} awaited
          </div>
        </button>
      ))}
    </div>
  );
}
