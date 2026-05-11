import { cn } from '@/lib/utils';
import { PRIORITY_BADGE_CLASSES } from '@/types/quotations';

export function PriorityBadge({
  priority,
  className,
}: {
  priority?: 'low' | 'medium' | 'high' | null;
  className?: string;
}) {
  const p = priority === 'low' || priority === 'high' ? priority : 'medium';
  const label = p.charAt(0).toUpperCase() + p.slice(1);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        PRIORITY_BADGE_CLASSES[p],
        className,
      )}
    >
      {label}
    </span>
  );
}
