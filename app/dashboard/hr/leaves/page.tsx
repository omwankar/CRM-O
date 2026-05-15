'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHrLeaves, submitLeave, decideLeave } from '@/lib/api/hr/leaves';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Palmtree, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function HrLeavesPage() {
  const queryClient = useQueryClient();
  const { canWrite } = useCurrentUser();
  const [tab, setTab] = useState<'mine' | 'team'>('mine');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const scope = tab === 'team' && canWrite ? 'all' : 'mine';

  const { data, isLoading } = useQuery({
    queryKey: ['hr-leaves', scope],
    queryFn: () => getHrLeaves({ scope }),
  });

  const submitMutation = useMutation({
    mutationFn: () => submitLeave({ start_date: startDate, end_date: endDate, reason }),
    onSuccess: () => {
      toast.success('Leave request submitted');
      setStartDate('');
      setEndDate('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      decideLeave(id, status),
    onSuccess: () => {
      toast.success('Leave updated');
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaves = data?.data || [];
  const pending = leaves.filter((l) => l.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaves</h1>
        <p className="text-muted-foreground">Apply for leave and track requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Palmtree className="w-5 h-5" />
            Request leave
          </h2>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!startDate || !endDate) {
                toast.error('Select start and end dates');
                return;
              }
              submitMutation.mutate();
            }}
          >
            <div>
              <label className="text-sm font-medium block mb-1">From</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">To</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Reason</label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
            </div>
            <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit request'}
            </Button>
          </form>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex gap-2 mb-4">
            <Button variant={tab === 'mine' ? 'default' : 'outline'} size="sm" onClick={() => setTab('mine')}>
              My requests
            </Button>
            {canWrite && (
              <Button variant={tab === 'team' ? 'default' : 'outline'} size="sm" onClick={() => setTab('team')}>
                Team ({pending.length} pending)
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : leaves.length === 0 ? (
            <p className="text-muted-foreground text-sm">No leave requests</p>
          ) : (
            <ul className="space-y-3">
              {leaves.map((l) => (
                <li key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-lg p-4">
                  <div>
                    <p className="font-medium">{l.requester_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {l.start_date} → {l.end_date}
                      {l.reason ? ` · ${l.reason}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[l.status]}`}>
                      {l.status}
                    </span>
                    {canWrite && tab === 'team' && l.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => decideMutation.mutate({ id: l.id, status: 'approved' })}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => decideMutation.mutate({ id: l.id, status: 'rejected' })}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
