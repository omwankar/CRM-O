import { ageParts, initial, personHue } from '@/components/operations/opsVisual';

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: personHue(name), fontSize: size < 24 ? 10 : 12 }}
    >
      {initial(name)}
    </span>
  );
}

export function AvatarStack({ names }: { names: string[] }) {
  if (!names.length) return <span className="text-xs" style={{ color: 'var(--ops-faint)' }}>Unassigned</span>;
  return (
    <span className="flex">
      {names.slice(0, 4).map((name, index) => (
        <span key={`${name}-${index}`} title={name} className={index ? '-ml-1.5 ring-2 ring-[var(--ops-surface)] rounded-full' : ''}>
          <Avatar name={name} size={22} />
        </span>
      ))}
    </span>
  );
}

export function AgePill({ createdAt }: { createdAt: string }) {
  const age = ageParts(createdAt);
  const style =
    age.tone === 'warn'
      ? { background: 'var(--ops-warn-soft)', color: 'var(--ops-warn)' }
      : age.tone === 'crit'
        ? { background: 'var(--ops-crit-soft)', color: 'var(--ops-crit)' }
        : { background: 'var(--ops-sunk)', color: 'var(--ops-fg)' };
  return (
    <span className="ops-mono inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium" style={style}>
      {age.label}
    </span>
  );
}

export function StatusPill({ column }: { column: string }) {
  const label = column === 'to_send' ? 'To send' : column === 'waiting' ? 'Waiting for rates' : column === 'choose_best' ? 'Choose best' : column === 'best_selected' ? 'Best selected' : 'Closed';
  const style =
    column === 'best_selected'
      ? { background: 'var(--ops-ok-soft)', color: 'var(--ops-ok)' }
      : column === 'choose_best'
        ? { background: 'var(--ops-accent-soft)', color: 'var(--ops-accent)' }
        : column === 'waiting'
          ? { background: 'var(--ops-warn-soft)', color: 'var(--ops-warn)' }
          : column === 'closed'
            ? { background: 'var(--ops-crit-soft)', color: 'var(--ops-crit)' }
            : { background: 'var(--ops-sunk)', color: 'var(--ops-fg)' };
  return (
    <span className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium" style={style}>
      {label}
    </span>
  );
}
