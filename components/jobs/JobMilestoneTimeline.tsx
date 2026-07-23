import type { JobStatusHistory } from '@/types/jobs';
import { JOB_STATUS_LABELS, type JobStatus } from '@/types/jobs';

export function JobMilestoneTimeline({ history }: { history: JobStatusHistory[] }) {
  if (!history.length) {
    return <p className="text-sm text-muted-foreground">No milestones yet.</p>;
  }

  return (
    <ol className="relative space-y-4 border-l border-border ml-2 pl-4">
      {history.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
          <div className="text-sm">
            <p className="font-medium">
              {h.old_status
                ? `${JOB_STATUS_LABELS[h.old_status as JobStatus] || h.old_status} → ${
                    JOB_STATUS_LABELS[h.new_status as JobStatus] || h.new_status
                  }`
                : JOB_STATUS_LABELS[h.new_status as JobStatus] || h.new_status}
            </p>
            <p className="text-muted-foreground mt-0.5">{h.reason}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {h.changed_by_name} · {new Date(h.changed_at).toLocaleString()}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
