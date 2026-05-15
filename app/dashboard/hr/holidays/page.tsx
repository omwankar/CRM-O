'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHrHolidays, createHoliday, deleteHoliday } from '@/lib/api/hr/holidays';
import { CanWrite } from '@/components/auth/Can';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PartyPopper, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function HrHolidaysPage() {
  const queryClient = useQueryClient();
  const year = new Date().getFullYear().toString();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [holidayPayType, setHolidayPayType] = useState<'paid' | 'unpaid'>('paid');

  const { data, isLoading } = useQuery({
    queryKey: ['hr-holidays', year],
    queryFn: () => getHrHolidays({ year }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createHoliday({ date, title, description: description || undefined, holiday_pay_type: holidayPayType }),
    onSuccess: () => {
      toast.success('Holiday added');
      setShowForm(false);
      setDate('');
      setTitle('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['hr-holidays'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: () => {
      toast.success('Holiday removed');
      queryClient.invalidateQueries({ queryKey: ['hr-holidays'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const holidays = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PartyPopper className="w-8 h-8" />
            Holidays
          </h1>
          <p className="text-muted-foreground">Company holidays ({year}) — synced with Calendar</p>
        </div>
        <CanWrite>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add holiday
          </Button>
        </CanWrite>
      </div>

      {showForm && (
        <Card className="p-6">
          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <div>
              <label className="text-sm font-medium block mb-1">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Holiday type</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3"
                value={holidayPayType}
                onChange={(e) => setHolidayPayType(e.target.value as 'paid' | 'unpaid')}
              >
                <option value="paid">Paid holiday</option>
                <option value="unpaid">Unpaid holiday</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save holiday'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-muted-foreground">Loading...</p>
        ) : holidays.length === 0 ? (
          <p className="p-12 text-center text-muted-foreground">No holidays for {year}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Description</th>
                <th className="p-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {holidays.map((h) => (
                <tr key={h.id} className="border-b">
                  <td className="p-3">{h.date}</td>
                  <td className="p-3 font-medium">{h.title}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        h.holiday_pay_type === 'unpaid'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {h.holiday_pay_type === 'unpaid' ? 'Unpaid' : 'Paid'}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{h.description || '—'}</td>
                  <td className="p-3">
                    <CanWrite>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Remove this holiday?')) deleteMutation.mutate(h.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CanWrite>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
