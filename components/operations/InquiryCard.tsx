import { AgePill, AvatarStack } from '@/components/operations/bits';
import { formatRoute, money } from '@/components/operations/opsVisual';
import type { PipelineInquiry } from '@/lib/api/operations';

export function InquiryCard({ inquiry, active, onOpen }: { inquiry: PipelineInquiry; active?: boolean; onOpen: () => void }) {
  const best = inquiry.sends.find((send) => send.is_best && send.quoted_price != null);
  const route = formatRoute(inquiry);
  const customer = inquiry.prospect_name || inquiry.title || 'No customer';
  const sub = [customer, route].filter(Boolean).join(' · ');
  return (
    <button type="button" className="card" aria-current={active || undefined} onClick={onOpen}>
      <span className="id">
        {inquiry.priority_rank ? <span className={`rank${inquiry.priority_rank === 1 ? ' first' : ''}`}>#{inquiry.priority_rank}</span> : null}
        {inquiry.enquiry_number}
      </span>
      <AgePill createdAt={inquiry.created_at} closed={inquiry.column === 'closed'} />
      <span className="sub">{sub}</span>
      <span className="foot">
        <AvatarStack names={inquiry.operators.map((operator) => operator.full_name)} />
        {best ? (
          <span className="price">✓ {money(best.quoted_price, best.currency)}</span>
        ) : (
          <span className="hint mono">
            {inquiry.rates_sent ? `${inquiry.rates_received}/${inquiry.rates_sent} rates` : 'no agents yet'}
          </span>
        )}
      </span>
    </button>
  );
}
