import { InquiryCard } from '@/components/operations/InquiryCard';
import type { PipelineInquiry } from '@/lib/api/operations';

export function BoardColumn({
  label,
  bar,
  empty,
  inquiries,
  selectedId,
  onOpen,
}: {
  label: string;
  bar: string;
  empty: string;
  inquiries: PipelineInquiry[];
  selectedId: string | null;
  onOpen: (id: string) => void;
}) {
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
          inquiries.map((inquiry) => (
            <InquiryCard key={inquiry.id} inquiry={inquiry} active={inquiry.id === selectedId} onOpen={() => onOpen(inquiry.id)} />
          ))
        )}
      </div>
    </section>
  );
}
