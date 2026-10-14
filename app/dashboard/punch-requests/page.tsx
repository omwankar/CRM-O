'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getPunchRequests, getPunchStats, approvePunchRequest, rejectPunchRequest } from '@/lib/api/clock';
import { AccessDenied } from '@/components/AccessDenied';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { formatUkDateTime, formatUkTimeLabeled } from '@/lib/date';

function formatTime(dateStr: string | null) {
  if (!dateStr) return '-';
  return formatUkTimeLabeled(dateStr);
}

export default function PunchRequestsPage() {
  const { role, isLoading: authLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['punchRequests', statusFilter],
    queryFn: () => getPunchRequests({ status: statusFilter }),
    enabled: role === 'super_admin',
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });

  const { data: statsData } = useQuery({
    queryKey: ['punchStats'],
    queryFn: getPunchStats,
    enabled: role === 'super_admin',
    refetchInterval: 60000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => approvePunchRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['punchRequests'] });
      queryClient.invalidateQueries({ queryKey: ['punchStats'] });
      setApprovingId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectPunchRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['punchRequests'] });
      queryClient.invalidateQueries({ queryKey: ['punchStats'] });
      setRejectingId(null);
      setRejectionReason('');
    },
  });

  if (authLoading) return <div className="p-8">Loading...</div>;
  if (role !== 'super_admin') return <AccessDenied />;

  const requests = requestsData?.data || [];
  const stats = statsData || { pending: 0, approved_today: 0, rejected_today: 0 };
  const pendingCount = requestsData?.pending_count || 0;

  const tabs = [
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Punch requests</h1>
          <p className="text-sm text-muted-foreground">Approve or reject time corrections.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">{stats.pending} pending</span>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">{stats.approved_today} approved today</span>
          <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-800">{stats.rejected_today} rejected today</span>
          <span className="inline-flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            60s
          </span>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-700">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">All caught up!</h3>
          <p className="text-muted-foreground">No pending punch requests at this time.</p>
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-lg border bg-white">
          {requests.map((request: any) => {
            const clockIn = request.requested_clock_in || (request.type === 'clock_in' ? request.requested_at : null);
            const clockOut = request.requested_clock_out || (request.type === 'clock_out' ? request.requested_at : null);
            const duration = request.actual_duration_minutes
              ? `${Math.floor(request.actual_duration_minutes / 60)}h ${request.actual_duration_minutes % 60}m`
              : null;
            const note = request.reason || request.notes;
            return (
              <div key={request.id} className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                    {request.user?.full_name?.[0] || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <p className="truncate text-sm font-medium">{request.user?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        In {formatTime(clockIn)} · Out {formatTime(clockOut)}
                        {duration ? ` · ${duration}` : ''}
                      </p>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      Submitted {formatUkDateTime(request.created_at)}
                      {note ? ` · ${note}` : ''}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                      request.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : request.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {request.status}
                  </span>
                  {request.status === 'pending' && approvingId !== request.id && rejectingId !== request.id ? (
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setApprovingId(request.id)} aria-label="Approve">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setRejectingId(request.id)} aria-label="Reject">
                        <XCircle className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  ) : null}
                </div>

                {request.status === 'pending' && approvingId === request.id ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 pl-10 text-xs text-emerald-800">
                    <span>Apply this punch and unlock clock in/out.</span>
                    <Button size="sm" className="h-7" onClick={() => approveMutation.mutate({ id: request.id })} disabled={approveMutation.isPending}>
                      {approveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => setApprovingId(null)}>Cancel</Button>
                  </div>
                ) : null}

                {request.status === 'pending' && rejectingId === request.id ? (
                  <div className="mt-2 space-y-2 pl-10">
                    <textarea
                      className="w-full rounded-md border p-2 text-sm"
                      rows={2}
                      placeholder="Rejection reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7"
                        variant="destructive"
                        disabled={rejectMutation.isPending || rejectionReason.length < 5}
                        onClick={() => rejectMutation.mutate({ id: request.id, reason: rejectionReason })}
                      >
                        {rejectMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Reject'}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => { setRejectingId(null); setRejectionReason(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}

                {request.status !== 'pending' ? (
                  <p className="mt-1 pl-10 text-xs text-muted-foreground">
                    {request.status === 'approved' ? 'Approved' : 'Rejected'}
                    {request.reviewer?.full_name ? ` by ${request.reviewer.full_name}` : ''}
                    {request.reviewed_at ? ` on ${formatUkDateTime(request.reviewed_at)}` : ''}
                    {request.rejection_reason ? ` · ${request.rejection_reason}` : ''}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
