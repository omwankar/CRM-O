import { cn } from '@/lib/utils';
import { Clock, Loader2, PauseCircle, CheckCircle2, XCircle } from 'lucide-react';

interface TaskStatusPillProps {
  status: 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  className?: string;
}

const statusConfig = {
  Pending: {
    color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400',
    dotColor: 'bg-slate-500',
    icon: Clock,
  },
  'In Progress': {
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    dotColor: 'bg-blue-500',
    icon: Loader2,
  },
  'On Hold': {
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    icon: PauseCircle,
  },
  Completed: {
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  Cancelled: {
    color: 'bg-red-500/10 text-red-700 dark:text-red-400',
    dotColor: 'bg-red-500',
    icon: XCircle,
  },
};

export function TaskStatusPill({ status, className }: TaskStatusPillProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.color,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}
