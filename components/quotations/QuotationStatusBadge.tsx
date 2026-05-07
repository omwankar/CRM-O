import { QUOTATION_STATUS_COLORS, QUOTATION_STATUS_LABELS, type QuotationStatus } from '@/types/quotations';
import { cn } from '@/lib/utils';

export function QuotationStatusBadge({ status, className }: { status: QuotationStatus; className?: string }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        QUOTATION_STATUS_COLORS[status],
        className
      )}
    >
      {QUOTATION_STATUS_LABELS[status]}
    </span>
  );
}

