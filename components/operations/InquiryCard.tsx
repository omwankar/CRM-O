import { AgePill, AvatarStack } from '@/components/operations/bits';
import { formatRoute, money } from '@/components/operations/opsVisual';
import type { PipelineInquiry } from '@/lib/api/operations';

export function InquiryCard({ inquiry, active, onOpen }: { inquiry: PipelineInquiry; active?: boolean; onOpen: () => void }) {
  const best = inquiry.sends.find((send) => send.is_best && send.quoted_price != null);
  const route = formatRoute(inquiry);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[10px] border p-3 text-left"
      style={{
        background: 'var(--ops-surface)',
        borderColor: active ? 'var(--ops-accent)' : 'var(--ops-line)',
        boxShadow: active ? 'inset 0 0 0 1px var(--ops-accent)' : 'var(--ops-shadow)',
      }}
    >
      <span className="flex items-center gap-2">
        {inquiry.priority_rank ? (
          <span className="ops-mono text-xs font-semibold" style={{ color: inquiry.priority_rank === 1 ? 'var(--ops-crit)' : 'var(--ops-muted)' }}>
            #{inquiry.priority_rank}
          </span>
        ) : null}
        <span className="ops-mono min-w-0 truncate text-sm font-semibold" style={{ color: 'var(--ops-fg)' }}>{inquiry.enquiry_number}</span>
        <span className="ml-auto shrink-0">
          <AgePill createdAt={inquiry.created_at} />
        </span>
      </span>
      <span className="mt-1.5 block truncate text-sm font-semibold" style={{ color: 'var(--ops-fg)' }}>
        {inquiry.prospect_name || inquiry.title || 'Inquiry'}
      </span>
      {route ? <span className="mt-0.5 block truncate text-xs" style={{ color: 'var(--ops-muted)' }}>{route}</span> : null}
      <span className="mt-2 flex items-center gap-2">
        <AvatarStack names={inquiry.operators.map((operator) => operator.full_name)} />
        <span className="ml-auto text-right text-[11px]" style={{ color: best ? 'var(--ops-ok)' : 'var(--ops-muted)' }}>
          {best ? <span className="ops-mono font-medium">{money(best.quoted_price, best.currency)}</span> : inquiry.rates_sent === 0 ? 'no agents yet' : `${inquiry.rates_sent} contacted · ${inquiry.rates_received} rate${inquiry.rates_received === 1 ? '' : 's'}`}
        </span>
      </span>
    </button>
  );
}
