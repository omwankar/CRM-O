'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getHrEmployeeAttendance } from '@/lib/api/hr/attendance';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CalendarDays, Loader2 } from 'lucide-react';

const markerConfig: Record<
  string,
  { label: string; className: string }
> = {
  present: { label: 'Present', className: 'bg-emerald-100 text-emerald-800' },
  absent: { label: 'Absent', className: 'bg-gray-100 text-gray-600' },
  paid_leave: { label: 'Paid leave', className: 'bg-blue-100 text-blue-800' },
  unpaid_leave: { label: 'Unpaid leave', className: 'bg-slate-100 text-slate-700' },
  lop: { label: 'LOP', className: 'bg-red-100 text-red-800' },
  paid_holiday: { label: 'Paid holiday', className: 'bg-purple-100 text-purple-800' },
  unpaid_holiday: { label: 'Unpaid holiday', className: 'bg-violet-100 text-violet-700' },
  pending_paid: { label: 'Pending paid', className: 'bg-amber-100 text-amber-800' },
  pending_unpaid: { label: 'Pending unpaid', className: 'bg-amber-100 text-amber-800' },
  pending_lop: { label: 'Pending LOP', className: 'bg-amber-100 text-amber-800' },
  leave_rejected: { label: 'Leave rejected', className: 'bg-gray-100 text-gray-500' },
};

function formatSalary(amount: number | null | undefined) {
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    amount,
  );
}

function formatTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HrIndividualAttendancePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(initialMonth);

  const { data, isLoading } = useQuery({
    queryKey: ['hr-employee-attendance', userId, month],
    queryFn: () => getHrEmployeeAttendance(userId, month),
    enabled: !!userId,
  });

  const emp = data?.employee;
  const monthLabel = new Date(`${month}-01`).toLocaleDateString([], { year: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push(`/dashboard/hr/attendance?month=${month}`)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to team attendance
      </Button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="w-8 h-8" />
            Individual attendance
          </h1>
          {emp && (
            <div className="mt-2">
              <p className="font-medium text-lg">{emp.full_name || emp.email}</p>
              <p className="text-sm text-muted-foreground font-mono">{emp.employee_id || '—'}</p>
              <p className="text-sm text-muted-foreground">
                {emp.department || '—'} · {emp.designation || '—'}
              </p>
              <p className="text-sm mt-1">
                Monthly salary: <span className="font-semibold">{formatSalary(emp.monthly_salary)}</span>
              </p>
            </div>
          )}
        </div>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Hours</p>
            <p className="text-xl font-bold tabular-nums">{data.summary.total_hours}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Days present</p>
            <p className="text-xl font-bold tabular-nums">{data.summary.days_present}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Paid leave</p>
            <p className="text-xl font-bold tabular-nums">{data.summary.leave_paid_days}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Unpaid / LOP</p>
            <p className="text-xl font-bold tabular-nums">
              {data.summary.leave_unpaid_days} / {data.summary.leave_lop_days}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Holidays</p>
            <p className="text-xl font-bold tabular-nums">{data.summary.holiday_count}</p>
          </Card>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex flex-col items-start gap-3">
          <p className="text-sm font-medium">{monthLabel}</p>
          <div className="flex flex-col items-start gap-1.5 text-xs">
            {Object.entries(markerConfig).map(([key, cfg]) => (
              <span key={key} className={`px-2 py-0.5 rounded-full ${cfg.className}`}>
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.days?.length ? (
          <p className="p-8 text-center text-muted-foreground">No data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Day</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Hours</th>
                  <th className="text-left p-3">Clock sessions</th>
                  <th className="text-left p-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.days.map((day) => (
                  <tr key={day.date} className="border-b hover:bg-muted/20 align-top">
                    <td className="p-3 font-medium whitespace-nowrap">{day.date}</td>
                    <td className="p-3 text-muted-foreground">{day.weekday}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {day.markers.map((m) => {
                          const cfg = markerConfig[m] || { label: m, className: 'bg-muted text-muted-foreground' };
                          return (
                            <span key={m} className={`text-xs px-2 py-0.5 rounded-full ${cfg.className}`}>
                              {cfg.label}
                            </span>
                          );
                        })}
                      </div>
                      {day.holiday && (
                        <p className="text-xs text-muted-foreground mt-1">{day.holiday.title}</p>
                      )}
                      {day.leave && day.leave.status !== 'rejected' && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Leave {day.leave.start_date} → {day.leave.end_date}
                          {day.leave.reason ? ` · ${day.leave.reason}` : ''}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-right tabular-nums">{day.hours > 0 ? day.hours.toFixed(2) : '—'}</td>
                    <td className="p-3 text-xs">
                      {day.sessions.length === 0 ? (
                        '—'
                      ) : (
                        <ul className="space-y-1">
                          {day.sessions.map((s) => (
                            <li key={s.id}>
                              {formatTime(s.clock_in)} – {formatTime(s.clock_out)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-xs">
                      {day.sessions.map((s) => s.notes).filter(Boolean).join('; ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
