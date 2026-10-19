import { Search } from 'lucide-react';
import { BoardColumn } from '@/components/operations/BoardColumn';
import { InquiryCard } from '@/components/operations/InquiryCard';
import { COLUMNS } from '@/components/operations/opsVisual';
import type { PipelineInquiry } from '@/lib/api/operations';

export function Board({
  title,
  search,
  onSearch,
  showClosed,
  onShowClosed,
  inquiries,
  selectedId,
  onOpen,
}: {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  showClosed: boolean;
  onShowClosed: (value: boolean) => void;
  inquiries: PipelineInquiry[];
  selectedId: string | null;
  onOpen: (id: string) => void;
}) {
  const closed = inquiries.filter((inquiry) => inquiry.column === 'closed');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--ops-fg)' }}>{title}</h2>
        <label className="relative w-full max-w-[360px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4" style={{ color: 'var(--ops-faint)' }} aria-hidden />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search ID, customer, route, agent"
            aria-label="Search inquiries"
            className="h-9 w-full rounded-[7px] border bg-[var(--ops-surface)] pl-8 pr-3 text-sm"
            style={{ borderColor: 'var(--ops-line)', color: 'var(--ops-fg)' }}
          />
        </label>
        <label className="flex min-h-9 items-center gap-2 text-sm" style={{ color: 'var(--ops-fg)' }}>
          <input type="checkbox" checked={showClosed} onChange={(event) => onShowClosed(event.target.checked)} />
          Show closed
        </label>
        <span className="text-xs" style={{ color: 'var(--ops-muted)' }}>Newest first</span>
      </div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr))]">
        {COLUMNS.map((column) => (
          <BoardColumn
            key={column.id}
            label={column.label}
            dot={column.dot}
            empty={column.empty}
            inquiries={inquiries.filter((inquiry) => inquiry.column === column.id)}
            selectedId={selectedId}
            onOpen={onOpen}
          />
        ))}
      </div>
      {showClosed ? (
        <section className="rounded-[12px] border p-3" style={{ background: 'var(--ops-surface)', borderColor: 'var(--ops-line)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ops-fg)' }}>Closed</h3>
          {closed.length === 0 ? (
            <p className="py-6 text-center text-xs" style={{ color: 'var(--ops-muted)' }}>No closed inquiries in this view.</p>
          ) : (
            <div className="mt-2 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr))]">
              {closed.map((inquiry) => (
                <InquiryCard key={inquiry.id} inquiry={inquiry} active={inquiry.id === selectedId} onOpen={() => onOpen(inquiry.id)} />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
