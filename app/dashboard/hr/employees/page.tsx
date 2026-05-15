'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getHrEmployees } from '@/lib/api/hr/employees';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Users } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  on_leave: 'bg-amber-100 text-amber-800',
  terminated: 'bg-gray-100 text-gray-600',
};

export default function HrEmployeesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['hr-employees', search],
    queryFn: () => getHrEmployees({ search: search || undefined, limit: 100 }),
  });

  const employees = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Employees</h1>
        <p className="text-muted-foreground">
          Company directory — new employees are added by super admin on the Users page
        </p>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search name, email, employee ID, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No employees found</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Employee</th>
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-left p-3 font-medium">Department</th>
                  <th className="text-left p-3 font-medium">Designation</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Work mode</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/dashboard/hr/employees/${emp.id}`)}
                  >
                    <td className="p-3">
                      <p className="font-medium">{emp.full_name || emp.email}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </td>
                    <td className="p-3 font-mono text-xs">{emp.employee_id || '—'}</td>
                    <td className="p-3">{emp.department || '—'}</td>
                    <td className="p-3">{emp.designation || '—'}</td>
                    <td className="p-3 capitalize">{(emp.employment_type || '—').replace('_', ' ')}</td>
                    <td className="p-3 capitalize">{emp.work_mode || '—'}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[emp.employment_status || 'active'] || statusColors.active
                        }`}
                      >
                        {(emp.employment_status || 'active').replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

