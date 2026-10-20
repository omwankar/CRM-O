import { AgePill, AvatarStack } from '@/components/operations/bits';
import { formatRoute, money } from '@/components/operations/opsVisual';
import type { PipelineInquiry } from '@/lib/api/operations';

export function InquiryCard({ inquiry, active, onOpen, rank }: { inquiry: PipelineInquiry; active?: boolean; onOpen: () => void; rank?: number | null }) {
  const best = inquiry.sends.find((send) => send.is_best);
  const route = formatRoute(inquiry);
  const customer = inquiry.prospect_name || inquiry.title || 'No customer';
  const sub = [customer, route].filter(Boolean).join(' · ');
  const shownRank = rank ?? inquiry.priority_rank;
  return (
    <button type="button" className="card" aria-current={active || undefined} onClick={onOpen}>
      <span className="id">
        {shownRank ? <span className={`rank${shownRank === 1 ? ' first' : ''}`}>#{shownRank}</span> : null}
        {inquiry.enquiry_number}
      </span>
      <AgePill createdAt={inquiry.created_at} closed={inquiry.column === 'closed'} />
      <span className="sub">{sub}</span>
      <span className="foot">
        <AvatarStack names={inquiry.operators.map((operator) => operator.full_name)} />
        {inquiry.column === 'closed' ? (
          <span className="pill">Closed</span>
        ) : best ? (
          <span className="price">✓ {best.agent_name}{best.quoted_price != null ? ` ${money(best.quoted_price, best.currency)}` : ''}</span>
        ) : (
          <span className="hint mono">
            {inquiry.rates_sent ? `${inquiry.rates_received}/${inquiry.rates_sent} rates` : 'no agents yet'}
          </span>
        )}
      </span>
    </button>
  );
}
