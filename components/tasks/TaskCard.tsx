import { Card } from '@/components/ui/card';
import { TaskStatusPill } from './TaskStatusPill';
import { TaskTypeBadge } from './TaskTypeBadge';
import { Task } from '@/types/tasks';
import { Button } from '@/components/ui/button';
import { ChevronRight, UserRoundCheck, UserCog, Link2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TaskCardProps {
  task: Task;
  canChangeStatus?: boolean;
  onChangeStatus?: (task: Task) => void;
}

export function TaskCard({ task, canChangeStatus = false, onChangeStatus }: TaskCardProps) {
  const router = useRouter();

  return (
    <Card className="surface-card p-5 cursor-pointer transition-all duration-150 hover:border-border/60 active:scale-[0.98]">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-[15px] font-medium text-foreground mb-1">
              {task.task_title}
            </h3>
            <code className="text-[11px] text-muted-foreground">
              {task.task_id}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <TaskTypeBadge type={task.task_type} />
            <TaskStatusPill status={task.status} />
          </div>
        </div>

        {/* Assigned/Supervisor */}
        <div className="space-y-1">
          <p className="text-[13px] text-foreground flex items-center gap-2">
            <UserRoundCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Assigned:</span>{' '}
            {task.assigned_person?.name || '-'}
          </p>
          <p className="text-[12px] text-muted-foreground flex items-center gap-2">
            <UserCog className="h-3.5 w-3.5" />
            <span>Supervisor:</span> {task.supervisor?.name || '-'}
          </p>
          {task.task_type === 'sales' && task.project && (
            <p className="text-[12px] text-muted-foreground flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5" />
              <span>Project:</span>{' '}
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/projects/${task.project!.id}`);
                }}
              >
                {task.project.project_name}
              </span>
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
          {task.assigned_date && (
            <span>Assigned: {new Date(task.assigned_date).toLocaleDateString()}</span>
          )}
          {task.due_date && (
            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {canChangeStatus && onChangeStatus && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onChangeStatus(task)}
            >
              Change Status
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-between group"
            onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
          >
            <span className="text-[13px]">View Details</span>
            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
