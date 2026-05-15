'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHrAppreciations, createAppreciation } from '@/lib/api/hr/appreciations';
import { getHrEmployees } from '@/lib/api/hr/employees';
import { CanWrite } from '@/components/auth/Can';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { value: 'teamwork', label: 'Teamwork' },
  { value: 'performance', label: 'Performance' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'other', label: 'Other' },
];

export default function HrAppreciationsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('other');
  const [appreciationDate, setAppreciationDate] = useState(new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ['hr-appreciations'],
    queryFn: () => getHrAppreciations({ limit: 50 }),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['hr-employees-list'],
    queryFn: () => getHrEmployees({ limit: 200 }),
    enabled: showForm,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAppreciation({
        employee_id: employeeId,
        title,
        message: message || undefined,
        category,
        appreciation_date: appreciationDate,
      }),
    onSuccess: () => {
      toast.success('Appreciation shared');
      setShowForm(false);
      setEmployeeId('');
      setTitle('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['hr-appreciations'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="w-8 h-8 text-rose-500" />
            Appreciation
          </h1>
          <p className="text-muted-foreground">Recognize team members</p>
        </div>
        <CanWrite>
          <Button onClick={() => setShowForm(!showForm)}>Give appreciation</Button>
        </CanWrite>
      </div>

      {showForm && (
        <Card className="p-6">
          <form
            className="space-y-4 max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              if (!employeeId || !title) {
                toast.error('Select employee and enter a title');
                return;
              }
              createMutation.mutate();
            }}
          >
            <div>
              <label className="text-sm font-medium block mb-1">Employee</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              >
                <option value="">Select employee</option>
                {(employeesData?.data || []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name || e.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Message</label>
              <Input value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Category</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Date</label>
                <Input type="date" value={appreciationDate} onChange={(e) => setAppreciationDate(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
            </Button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No appreciations yet</Card>
      ) : (
        <div className="grid gap-4">
          {items.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{a.category}</p>
                  <h3 className="font-semibold text-lg">{a.title}</h3>
                  <p className="text-sm mt-1">
                    <span className="font-medium">{a.employee_name}</span>
                    <span className="text-muted-foreground"> · from {a.given_by_name}</span>
                  </p>
                  {a.message && <p className="text-sm mt-2 text-muted-foreground">{a.message}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{a.appreciation_date}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
