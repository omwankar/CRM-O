'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHrEmployee, updateHrEmployee, getHrEmployees } from '@/lib/api/hr/employees';
import { getHrLeaves } from '@/lib/api/hr/leaves';
import { getHrAppreciations } from '@/lib/api/hr/appreciations';
import { getHrAttendance } from '@/lib/api/hr/attendance';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CanWrite } from '@/components/auth/Can';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function HrEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    employee_id: '',
    designation: '',
    department: '',
    joining_date: '',
    employment_status: 'active',
    reporting_manager_id: '',
    phone: '',
    full_name: '',
  });

  const { data: employee, isLoading } = useQuery({
    queryKey: ['hr-employee', id],
    queryFn: () => getHrEmployee(id),
    enabled: !!id,
  });

  const { data: managersData } = useQuery({
    queryKey: ['hr-employees-managers'],
    queryFn: () => getHrEmployees({ limit: 200 }),
  });

  const { data: leavesData } = useQuery({
    queryKey: ['hr-leaves-employee', id],
    queryFn: () => getHrLeaves({ scope: 'all' }),
    enabled: !!id,
  });

  const { data: appreciationsData } = useQuery({
    queryKey: ['hr-appreciations-employee', id],
    queryFn: () => getHrAppreciations({ employee_id: id }),
    enabled: !!id,
  });

  const month = new Date().toISOString().slice(0, 7);
  const { data: attendanceData } = useQuery({
    queryKey: ['hr-attendance-employee', id, month],
    queryFn: () => getHrAttendance({ user_id: id, month }),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      updateHrEmployee(id, {
        ...form,
        reporting_manager_id: form.reporting_manager_id || null,
        joining_date: form.joining_date || null,
      }),
    onSuccess: () => {
      toast.success('Employee profile updated');
      queryClient.invalidateQueries({ queryKey: ['hr-employee', id] });
      setEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = () => {
    if (!employee) return;
    setForm({
      employee_id: employee.employee_id || '',
      designation: employee.designation || '',
      department: employee.department || '',
      joining_date: employee.joining_date || '',
      employment_status: employee.employment_status || 'active',
      reporting_manager_id: employee.reporting_manager_id || '',
      phone: employee.phone || '',
      full_name: employee.full_name || '',
    });
    setEditing(true);
  };

  const employeeLeaves = (leavesData?.data || []).filter((l) => l.requested_by === id).slice(0, 5);
  const appreciations = appreciationsData?.data || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!employee) {
    return <p className="text-muted-foreground">Employee not found</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push('/dashboard/hr/employees')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to directory
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{employee.full_name || employee.email}</h1>
          <p className="text-muted-foreground">{employee.email}</p>
        </div>
        <CanWrite>
          {!editing ? (
            <Button onClick={startEdit}>Edit profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          )}
        </CanWrite>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-lg">HR profile</h2>
        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Full name</label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Employee ID</label>
              <Input value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} placeholder="EMP-0001" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Department</label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Designation</label>
              <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Joining date</label>
              <Input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Employment status</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={form.employment_status}
                onChange={(e) => setForm({ ...form, employment_status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Reporting manager</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={form.reporting_manager_id}
                onChange={(e) => setForm({ ...form, reporting_manager_id: e.target.value })}
              >
                <option value="">None</option>
                {(managersData?.data || [])
                  .filter((m) => m.id !== id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Employee ID</dt><dd className="font-medium">{employee.employee_id || '—'}</dd></div>
            <div><dt className="text-muted-foreground">Department</dt><dd className="font-medium">{employee.department || '—'}</dd></div>
            <div><dt className="text-muted-foreground">Designation</dt><dd className="font-medium">{employee.designation || '—'}</dd></div>
            <div><dt className="text-muted-foreground">Joining date</dt><dd className="font-medium">{employee.joining_date || '—'}</dd></div>
            <div><dt className="text-muted-foreground">Status</dt><dd className="font-medium capitalize">{(employee.employment_status || 'active').replace('_', ' ')}</dd></div>
            <div><dt className="text-muted-foreground">Reporting manager</dt><dd className="font-medium">{employee.reporting_manager?.full_name || employee.reporting_manager?.email || '—'}</dd></div>
            <div><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{employee.phone || '—'}</dd></div>
            <div><dt className="text-muted-foreground">CRM role</dt><dd className="font-medium capitalize">{employee.role?.replace('_', ' ')}</dd></div>
          </dl>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-2">Attendance this month</h2>
        <p className="text-2xl font-bold tabular-nums">{attendanceData?.totalHours ?? 0} hrs</p>
        <p className="text-sm text-muted-foreground">{attendanceData?.sessions?.length ?? 0} clock sessions</p>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-3">Recent leave requests</h2>
        {employeeLeaves.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leave requests</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {employeeLeaves.map((l) => (
              <li key={l.id} className="flex justify-between border-b pb-2">
                <span>{l.start_date} → {l.end_date}</span>
                <span className="capitalize">{l.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-3">Appreciations received</h2>
        {appreciations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No appreciations yet</p>
        ) : (
          <ul className="space-y-3">
            {appreciations.map((a) => (
              <li key={a.id} className="border-l-2 border-primary pl-3">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.given_by_name} · {a.appreciation_date}</p>
                {a.message && <p className="text-sm mt-1">{a.message}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
