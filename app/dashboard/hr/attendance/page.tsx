'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getHrAttendance, getHrAttendanceSummary } from '@/lib/api/hr/attendance';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Clock3, ClipboardList } from 'lucide-react';

export default function HrAttendancePage() {
  const { canWrite } = useCurrentUser();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [view, setView] = useState<'mine' | 'team'>(canWrite ? 'mine' : 'mine');

  const { data: mine, isLoading: mineLoading } = useQuery({
    queryKey: ['hr-attendance-mine', month],
    queryFn: () => getHrAttendance({ month }),
    enabled: view === 'mine',
  });

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['hr-attendance-team', month],
    queryFn: () => getHrAttendanceSummary(month),
    enabled: view === 'team' && canWrite,
  });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-8 h-8" />
            Attendance
          </h1>
          <p className="text-muted-foreground">View clock sessions and team hours</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clock">
            <Clock3 className="w-4 h-4 mr-2" />
            Clock In / Out
          </Link>
        </Button>
      </div>

      <Card className="p-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-sm font-medium block mb-1">Month</label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
        </div>
        {canWrite && (
          <div className="flex gap-2 items-end">
            <Button variant={view === 'mine' ? 'default' : 'outline'} size="sm" onClick={() => setView('mine')}>
              My attendance
            </Button>
            <Button variant={view === 'team' ? 'default' : 'outline'} size="sm" onClick={() => setView('team')}>
              Team summary
            </Button>
          </div>
        )}
      </Card>

      {view === 'mine' && (
        <Card className="p-6">
          {mineLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <>
              <p className="text-2xl font-bold tabular-nums mb-4">{mine?.totalHours ?? 0} hours</p>
              {(mine?.sessions || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions this month. Use Clock In/Out to record time.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2">Clock in</th>
                      <th className="text-left py-2">Clock out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(mine?.sessions || []).map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2">{formatTime(s.clock_in)}</td>
                        <td className="py-2">{s.clock_out ? formatTime(s.clock_out) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </Card>
      )}

      {view === 'team' && canWrite && (
        <Card className="p-6 overflow-x-auto">
          {teamLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3">Employee</th>
                  <th className="text-left p-3">Department</th>
                  <th className="text-right p-3">Days present</th>
                  <th className="text-right p-3">Total hours</th>
                </tr>
              </thead>
              <tbody>
                {(team?.data || []).map((row) => (
                  <tr key={row.user_id} className="border-b">
                    <td className="p-3">{row.full_name || row.email}</td>
                    <td className="p-3">{row.department || '—'}</td>
                    <td className="p-3 text-right tabular-nums">{row.days_present}</td>
                    <td className="p-3 text-right tabular-nums">{row.total_hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
