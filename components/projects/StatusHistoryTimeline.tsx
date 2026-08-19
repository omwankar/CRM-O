import { StatusHistory } from '@/types/projects';
import { ProjectStatusPill } from './ProjectStatusPill';
import { CheckCircle2, Clock, PauseCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { formatUkDateTime } from '@/lib/date';

interface StatusHistoryTimelineProps {
  history: StatusHistory[];
}

const statusIcons = {
  Active: CheckCircle2,
  Planned: Clock,
  'On Hold': PauseCircle,
  Closed: XCircle,
  Cancelled: XCircle,
};

export function StatusHistoryTimeline({ history }: StatusHistoryTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const rows = Array.isArray(history) ? history : [];
  const displayHistory = showAll ? rows : rows.slice(0, 3);

  if (rows.length === 0) {
    return <p className="text-[13px] text-muted-foreground">No status changes yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-2 top-2 bottom-2 w-[2px] bg-border" />

        {displayHistory.map((entry) => {
          const Icon = statusIcons[entry.new_status as keyof typeof statusIcons] || XCircle;
          const statusLabel = entry.new_status || 'Unknown';

          return (
            <div key={entry.id} className="relative pl-8 pb-6 last:pb-0">
              {/* Status dot */}
              <div className="absolute left-0 top-1 h-4 w-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[13px] font-medium text-foreground inline-flex items-center gap-2">
                    Changed to <ProjectStatusPill status={statusLabel as any} />
                  </span>
                </div>
                {entry.reason && (
                  <p className="text-[12px] text-muted-foreground">
                    {entry.reason}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {entry.changed_by_name} • {formatUkDateTime(entry.changed_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {rows.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[13px] text-primary hover:underline"
        >
          {showAll ? 'Show less' : `Show all ${rows.length} entries`}
        </button>
      )}
    </div>
  );
}
