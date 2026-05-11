'use client';

import { cn } from '@/lib/utils';
import type { ClosureKind } from '@/types/quotations';
import { CLOSURE_KIND_BADGE_CLASSES, CLOSURE_KIND_LABELS } from '@/types/quotations';

export function ClosureOutcomePicker({
  value,
  onChange,
  disabled,
}: {
  value: ClosureKind | null;
  onChange: (k: ClosureKind) => void;
  disabled?: boolean;
}) {
  const kinds: ClosureKind[] = ['won', 'lost', 'closed'];
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {kinds.map((k) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          onClick={() => onChange(k)}
          className={cn(
            'rounded-lg border px-3 py-3 text-left text-sm font-semibold transition-all',
            CLOSURE_KIND_BADGE_CLASSES[k],
            value === k && 'ring-2 ring-offset-2 ring-offset-background ring-primary',
            disabled && 'pointer-events-none opacity-50',
            !disabled && 'hover:opacity-95 active:scale-[0.99]',
          )}
        >
          {CLOSURE_KIND_LABELS[k]}
        </button>
      ))}
    </div>
  );
}
