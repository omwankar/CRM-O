import { ageParts, initial, personHue } from '@/components/operations/opsVisual';

export function Avatar({ name, size = 'm' }: { name: string; size?: 's' | 'm' }) {
  return (
    <span className={`av${size === 's' ? ' s' : ''}`} style={{ background: personHue(name) }} title={name}>
      {initial(name)}
    </span>
  );
}

export function AvatarStack({ names }: { names: string[] }) {
  if (!names.length) return <span className="hint">Unassigned</span>;
  return (
    <span className="stack">
      {names.slice(0, 4).map((name, index) => (
        <Avatar key={`${name}-${index}`} name={name} size="s" />
      ))}
    </span>
  );
}

export function AgePill({ createdAt, closed }: { createdAt: string; closed?: boolean }) {
  const age = ageParts(createdAt);
  const cls = closed ? '' : age.tone === 'crit' ? 'crit' : age.tone === 'warn' ? 'warn' : 'ok';
  return <span className={`pill ${cls} age`}>{age.label}</span>;
}

export function StatusPill({ column, closedLabel }: { column: string; closedLabel?: string }) {
  if (closedLabel) {
    const cls = closedLabel === 'Lost' ? 'crit' : closedLabel === 'No response' ? 'warn' : '';
    return <span className={`pill ${cls}`}>{closedLabel}</span>;
  }
  const label =
    column === 'to_send' ? 'To send'
      : column === 'waiting' ? 'Waiting for rates'
        : column === 'choose_best' ? 'Choose best'
          : column === 'best_selected' ? 'Best selected'
            : 'Closed';
  const cls =
    column === 'best_selected' ? 'ok'
      : column === 'choose_best' ? 'acc'
        : column === 'waiting' ? 'warn'
          : column === 'closed' ? 'crit'
            : '';
  return <span className={`pill ${cls}`}>{label}</span>;
}
