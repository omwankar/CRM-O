import { Inbox } from 'lucide-react';
import { InquiryCard } from '@/components/operations/InquiryCard';
import type { PipelineInquiry } from '@/lib/api/operations';

export function BoardColumn({
  label,
  dot,
  empty,
  inquiries,
  selectedId,
  onOpen,
}: {
  label: string;
  dot: string;
  empty: string;
  inquiries: PipelineInquiry[];
  selectedId: string | null;
  onOpen: (id: string) => void;
}) {
  return (
    <section
      aria-label={label}
      className="flex min-h-[220px] flex-col rounded-[12px] border"
      style={{ background: 'var(--ops-surface)', borderColor: 'var(--ops-line)', boxShadow: 'var(--ops-shadow)' }}
    >
      <header className="flex items-center gap-2 px-3 py-2.5">
        <span className="h-2 w-2 rounded-[2px]" style={{ background: dot }} aria-hidden />
        <span className="text-sm font-semibold" style={{ color: 'var(--ops-fg)' }}>{label}</span>
        <span className="ops-mono ml-auto text-xs" style={{ color: 'var(--ops-muted)' }}>{inquiries.length}</span>
      </header>
      <div className="ops-scroll space-y-2 overflow-y-auto px-2 pb-3" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        {inquiries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <Inbox className="h-5 w-5" style={{ color: 'var(--ops-faint)' }} aria-hidden />
            <p className="text-xs" style={{ color: 'var(--ops-muted)' }}>{empty}</p>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <InquiryCard key={inquiry.id} inquiry={inquiry} active={inquiry.id === selectedId} onOpen={() => onOpen(inquiry.id)} />
          ))
        )}
      </div>
    </section>
  );
}
