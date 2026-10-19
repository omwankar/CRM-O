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
    <div>
      <div className="toolbar">
        <h2>{title}</h2>
        <input
          className="search"
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search ID, customer, route, agent"
          aria-label="Search inquiries"
        />
        <label className="chk">
          <input type="checkbox" checked={showClosed} onChange={(event) => onShowClosed(event.target.checked)} />
          Show closed
        </label>
        <span className="spacer" />
        <span className="hint">Newest first · colour shows age: green new, amber 2–3 days, red 4+ days</span>
      </div>
      <div className="board">
        {COLUMNS.map((column) => (
          <BoardColumn
            key={column.id}
            label={column.label}
            bar={column.bar}
            empty={column.empty}
            inquiries={inquiries.filter((inquiry) => inquiry.column === column.id)}
            selectedId={selectedId}
            onOpen={onOpen}
          />
        ))}
      </div>
      {showClosed ? (
        <section className="col" aria-label="Closed" style={{ marginTop: 12 }}>
          <div className="col-h">
            <h3>
              <span className="bar" style={{ background: 'var(--line)' }} aria-hidden />
              Closed
            </h3>
            <span className="n">{closed.length}</span>
          </div>
          <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 8 }}>
            {closed.length === 0 ? (
              <div className="colempty">None</div>
            ) : (
              closed.map((inquiry) => (
                <InquiryCard key={inquiry.id} inquiry={inquiry} active={inquiry.id === selectedId} onOpen={() => onOpen(inquiry.id)} />
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
