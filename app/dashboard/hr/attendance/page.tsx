'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHrTeamAttendance, decideLeave } from '@/lib/api/hr/attendance';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ClipboardList, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const leaveTypeLabel: Record<string, string> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  lop: 'LOP',
};

export default function HrAttendancePage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data, isLoading } = useQuery({
    queryKey: ['hr-team-attendance', month],
    queryFn: () => getHrTeamAttendance(month),
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      decideLeave(id, status),
    onSuccess: () => {
      toast.success('Leave updated');
      queryClient.invalidateQueries({ queryKey: ['hr-team-attendance'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const employees = data?.employees || [];
  const pending = data?.pending_leaves || [];
  const monthLabel = new Date(`${month}-01`).toLocaleDateString([], { year: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-8 h-8" />
            Team attendance
          </h1>
          <p className="text-muted-foreground">
            Current month overview — clock hours, leave (paid / unpaid / LOP), and pending approvals
          </p>
        </div>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
      </div>

      {pending.length > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50/50">
          <h2 className="font-semibold mb-3">Pending leave requests ({pending.length})</h2>
          <ul className="space-y-2">
            {pending.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b pb-2">
                <span>
                  <strong>{l.requester_employee_id || '—'}</strong> {l.requester_name} · {l.start_date} → {l.end_date}{' '}
                  <span className="text-muted-foreground">({leaveTypeLabel[l.leave_type] || l.leave_type})</span>
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => decideMutation.mutate({ id: l.id, status: 'approved' })}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decideMutation.mutate({ id: l.id, status: 'rejected' })}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <p className="text-sm font-medium">{monthLabel}</p>
        </div>
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : employees.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No employees</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3">Employee ID</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Work mode</th>
                  <th className="text-left p-3">Department</th>
                  <th className="text-left p-3">Reporting to</th>
                  <th className="text-right p-3">Days present</th>
                  <th className="text-right p-3">Hours</th>
                  <th className="text-right p-3">Paid leave</th>
                  <th className="text-right p-3">Unpaid</th>
                  <th className="text-right p-3">LOP</th>
                  <th className="text-right p-3">Pending</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((row) => (
                  <tr key={row.user_id} className="border-b hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs">{row.employee_id || '—'}</td>
                    <td className="p-3 font-medium">{row.full_name || row.email}</td>
                    <td className="p-3 capitalize">{(row.employment_type || '—').replace('_', ' ')}</td>
                    <td className="p-3 capitalize">{row.work_mode || '—'}</td>
                    <td className="p-3">{row.department || '—'}</td>
                    <td className="p-3 text-muted-foreground">{row.reporting_manager_name || '—'}</td>
                    <td className="p-3 text-right tabular-nums">{row.days_present}</td>
                    <td className="p-3 text-right tabular-nums">{row.total_hours}</td>
                    <td className="p-3 text-right tabular-nums">{row.leave_paid_days}</td>
                    <td className="p-3 text-right tabular-nums">{row.leave_unpaid_days}</td>
                    <td className="p-3 text-right tabular-nums">{row.leave_lop_days}</td>
                    <td className="p-3 text-right">
                      {row.pending_leave_count > 0 ? (
                        <span className="text-amber-700 font-medium">{row.pending_leave_count}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(data?.holidays?.length ?? 0) > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Company holidays this month</h2>
          <ul className="text-sm space-y-1">
            {data!.holidays.map((h) => (
              <li key={h.id}>
                {h.date} — {h.title}{' '}
                <span className="text-muted-foreground">({h.holiday_pay_type === 'paid' ? 'Paid holiday' : 'Unpaid holiday'})</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
