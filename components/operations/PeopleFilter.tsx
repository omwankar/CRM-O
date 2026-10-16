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
    <div className="grid w-full min-w-0 grid-flow-col auto-cols-[minmax(200px,220px)] gap-3 overflow-x-auto pb-1 md:grid-flow-row md:[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
      <PersonCard name="Everyone" selected={!personId} onClick={() => onPerson(null)} working={people.reduce((sum, person) => sum + person.open_count, 0)} awaiting={people.reduce((sum, person) => sum + person.rates_awaited, 0)} />
      {people.map((person) => (
        <PersonCard
          key={person.user_id}
          name={person.full_name}
          selected={personId === person.user_id}
          onClick={() => onPerson(personId === person.user_id ? null : person.user_id)}
          working={person.open_count}
          awaiting={person.rates_awaited}
        />
      ))}
    </div>
  );
}

function PersonCard({
  name,
  selected,
  onClick,
  working,
  awaiting,
}: {
  name: string;
  selected: boolean;
  onClick: () => void;
  working: number;
  awaiting: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-9 items-center gap-3 rounded-[10px] border px-3 py-3 text-left"
      style={{
        background: 'var(--ops-surface)',
        borderColor: selected ? 'var(--ops-accent)' : 'var(--ops-line)',
        boxShadow: selected ? 'inset 0 0 0 1px var(--ops-accent), var(--ops-shadow)' : 'var(--ops-shadow)',
      }}
    >
      {name === 'Everyone' ? (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold" style={{ background: 'var(--ops-accent-soft)', color: 'var(--ops-accent)' }}>All</span>
      ) : (
        <Avatar name={name} size={36} />
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold" style={{ color: 'var(--ops-fg)' }}>{name}</span>
        <span className="ops-mono block text-base font-medium leading-tight" style={{ color: 'var(--ops-fg)' }}>{working}</span>
        <span className="block text-xs" style={{ color: 'var(--ops-muted)' }}>{awaiting} awaiting a rate</span>
      </span>
    </button>
  );
}
