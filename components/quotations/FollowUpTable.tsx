'use client';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { QuotationFollowup, ReminderStatus } from '@/types/quotations';
import { Pencil, Trash2 } from 'lucide-react';

function reminderCell(
  status: ReminderStatus,
  onSetReminder?: (f: QuotationFollowup) => void,
  row?: QuotationFollowup,
) {
  if (status === 'completed') {
    return <Badge className="bg-emerald-500/15 text-emerald-800 border-emerald-500/30">Completed</Badge>;
  }
  if (status === 'pending') {
    return <Badge className="bg-orange-500/15 text-orange-800 border-orange-500/30">Pending</Badge>;
  }
  return (
    <button
      type="button"
      className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      onClick={() => row && onSetReminder?.(row)}
    >
      Set Reminder
    </button>
  );
}

type Props = {
  followups: QuotationFollowup[];
  currentUserId?: string;
  isSuperAdmin?: boolean;
  onAdd?: () => void;
  onEdit: (f: QuotationFollowup) => void;
  onDelete: (f: QuotationFollowup) => void;
  emptyMessage?: string;
  addHint?: string;
};

export function FollowUpTable({
  followups,
  currentUserId,
  isSuperAdmin,
  onAdd,
  onEdit,
  onDelete,
  emptyMessage = 'No follow-ups recorded yet.',
  addHint,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Follow-ups</h3>
        {onAdd ? (
          <Button
            size="sm"
            variant="outline"
            className="border-blue-600 bg-white font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:bg-transparent dark:text-blue-400 dark:hover:bg-blue-950/30"
            onClick={onAdd}
          >
            + Add Follow-up
          </Button>
        ) : null}
      </div>
      {addHint ? <p className="text-xs text-muted-foreground">{addHint}</p> : null}

      {followups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200/90 bg-white dark:border-border dark:bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-zinc-50/90 hover:bg-zinc-50/90 dark:bg-muted/50">
                <TableHead>Follow-up Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Customer Response</TableHead>
                <TableHead>Next Follow-up Date</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followups.map((f) => {
                const canDelete = isSuperAdmin || (f.created_by && f.created_by === currentUserId);
                return (
                  <TableRow key={f.id}>
                    <TableCell className="tabular-nums whitespace-nowrap">
                      {f.followup_date ? new Date(f.followup_date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>{f.method}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm" title={f.customer_response || ''}>
                      {f.customer_response || '—'}
                    </TableCell>
                    <TableCell className="tabular-nums whitespace-nowrap">
                      {f.next_followup_date ? new Date(f.next_followup_date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>{reminderCell(f.reminder_status, onEdit, f)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(f)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {canDelete ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(f)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
