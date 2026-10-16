import { Plus } from 'lucide-react';

const TABS = [
  ['inquiries', 'Inquiries'],
  ['activity', 'Activity'],
  ['register', 'Register'],
  ['agents', 'Agents'],
] as const;

export type OpsTab = (typeof TABS)[number][0];

export function PipelineHeader({ tab, onTab, onNew }: { tab: OpsTab; onTab: (tab: OpsTab) => void; onNew: () => void }) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b px-4 py-3 sm:px-5" style={{ background: 'var(--ops-surface)', borderColor: 'var(--ops-line-soft)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--ops-fg)' }}>Operations pipeline</h1>
          <p className="text-sm" style={{ color: 'var(--ops-muted)' }}>Oldest open inquiries come first. A super admin chooses who works each one.</p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex h-9 items-center gap-1 rounded-[7px] px-3 text-sm font-medium text-white"
          style={{ background: 'var(--ops-accent)' }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New inquiry
        </button>
      </div>
      <div className="mt-3 inline-flex flex-wrap gap-1 rounded-[10px] p-1" style={{ background: 'var(--ops-sunk)' }} role="tablist" aria-label="Pipeline sections">
        {TABS.map(([id, label]) => {
          const selected = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTab(id)}
              className="h-9 rounded-[7px] px-3 text-sm font-medium"
              style={selected ? { background: 'var(--ops-surface)', color: 'var(--ops-fg)', boxShadow: 'var(--ops-shadow)' } : { color: 'var(--ops-muted)' }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
