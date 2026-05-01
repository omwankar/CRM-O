import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, PauseCircle, XCircle } from 'lucide-react';

interface ProjectStatusPillProps {
  status: 'Active' | 'Planned' | 'On Hold' | 'Closed';
  className?: string;
}

const statusConfig = {
  Active: {
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle2,
    description: 'Project is actively being worked on',
  },
  Planned: {
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    dotColor: 'bg-blue-500',
    icon: Clock,
    description: 'Project is planned but not yet started',
  },
  'On Hold': {
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    icon: PauseCircle,
    description: 'Project is temporarily paused',
  },
  Closed: {
    color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400',
    dotColor: 'bg-slate-500',
    icon: XCircle,
    description: 'Project has been completed or cancelled',
  },
};

export function ProjectStatusPill({ status, className }: ProjectStatusPillProps) {
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
