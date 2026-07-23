import { Badge } from '@/components/ui/badge';
import { JOB_STATUS_BADGE, JOB_STATUS_LABELS, type JobStatus } from '@/types/jobs';

export function JobStatusPill({ status }: { status: JobStatus }) {
  return (
    <Badge variant="outline" className={JOB_STATUS_BADGE[status]}>
      {JOB_STATUS_LABELS[status]}
    </Badge>
  );
}
