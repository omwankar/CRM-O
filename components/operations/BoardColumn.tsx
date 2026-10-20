import { InquiryCard } from '@/components/operations/InquiryCard';
import { dayShort, inquiryDayKey } from '@/components/operations/opsVisual';
import type { PipelineInquiry } from '@/lib/api/operations';

export function BoardColumn({
  label,
  bar,
  empty,
  inquiries,
  selectedId,
  onOpen,
  showRanks = true,
}: {
  label: string;
  bar: string;
  empty: string;
  inquiries: PipelineInquiry[];
  selectedId: string | null;
  onOpen: (id: string) => void;
  showRanks?: boolean;
}) {
  const counts: Record<string, number> = {};
  inquiries.forEach((inquiry) => {
    const key = inquiryDayKey(inquiry.created_at);
    counts[key] = (counts[key] || 0) + 1;
  });

  let lastDay: string | null = null;

  return (
    <section className="col" aria-label={label}>
      <div className="col-h">
        <h3>
          <span className="bar" style={{ background: bar }} aria-hidden />
          {label}
        </h3>
        <span className="n">{inquiries.length}</span>
      </div>
      <div className="cards">
        {inquiries.length === 0 ? (
          <div className="colempty">{empty}</div>
        ) : (
          inquiries.map((inquiry) => {
            const day = inquiryDayKey(inquiry.created_at);
            const heading = day !== lastDay;
            lastDay = day;
            return (
              <div key={inquiry.id}>
                {heading ? (
                  <div className="cdate">
                    <span>{dayShort(inquiry.created_at)}</span>
                    <span className="n">{counts[day]}</span>
                  </div>
                ) : null}
                <InquiryCard
                  inquiry={inquiry}
                  active={inquiry.id === selectedId}
                  onOpen={() => onOpen(inquiry.id)}
                  rank={showRanks ? inquiry.priority_rank : null}
                />
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
