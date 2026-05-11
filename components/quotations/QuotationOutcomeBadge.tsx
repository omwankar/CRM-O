'use client';

import { cn } from '@/lib/utils';
import {
  CLOSURE_KIND_BADGE_CLASSES,
  parseClosureKindFromOutcome,
  type ClosureKind,
} from '@/types/quotations';

export function QuotationOutcomeBadge({
  outcome,
  className,
}: {
  outcome?: string | null;
  className?: string;
}) {
  const text = outcome?.trim();
  if (!text) {
    return <span className={cn('text-sm text-muted-foreground', className)}>—</span>;
  }
  const kind = parseClosureKindFromOutcome(text);
  if (!kind) {
    return (
      <span className={cn('inline-flex max-w-full rounded-md border border-border px-2 py-0.5 text-sm', className)}>
        <span className="truncate">{text}</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        CLOSURE_KIND_BADGE_CLASSES[kind as ClosureKind],
        className,
      )}
    >
      <span className="truncate">{text}</span>
    </span>
  );
}
