import { cn } from '@/lib/utils';

interface TaskTypeBadgeProps {
  type: 'admin' | 'sales';
  className?: string;
}

const typeConfig = {
  admin: {
    color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    label: 'Admin',
  },
  sales: {
    color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
    label: 'Sales',
  },
};

export function TaskTypeBadge({ type, className }: TaskTypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.color,
        className
      )}
    >
      <div className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
