export function BoardSkeleton() {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr))]" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-[420px] animate-pulse rounded-[12px]" style={{ background: 'var(--ops-sunk)' }} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-2" aria-hidden>
      <div className="h-9 max-w-sm animate-pulse rounded-[7px]" style={{ background: 'var(--ops-sunk)' }} />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-[10px]" style={{ background: 'var(--ops-sunk)' }} />
      ))}
    </div>
  );
}
