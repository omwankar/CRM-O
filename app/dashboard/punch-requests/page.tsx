'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPunchRequests, getPunchStats, approvePunchRequest, rejectPunchRequest } from '@/lib/api/clock';
import { AccessDenied } from '@/components/AccessDenied';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Punch Requests</h1>
          <p className="text-muted-foreground">Review employee time correction requests</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
          Auto-refresh every 60s
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </div>
            {stats.pending > 0 && (
              <div className="relative">
                <Clock className="w-8 h-8 text-amber-500" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{stats.approved_today}</p>
              <p className="text-sm text-muted-foreground">Approved Today</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{stats.rejected_today}</p>
              <p className="text-sm text-muted-foreground">Rejected Today</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
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
        <div className="space-y-4">
          {requests.map((request: any) => (
            <Card
              key={request.id}
              className={`p-6 transition-all ${
                request.status === 'pending'
                  ? 'border-l-4 border-l-amber-500'
                  : request.status === 'approved'
                  ? 'border-l-4 border-l-green-500 opacity-75'
                  : 'border-l-4 border-l-red-500 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {request.user?.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{request.user?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{request.user?.email}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    request.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : request.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {request.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p>{formatRelativeTime(request.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="capitalize">{request.type?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Requested In</p>
                  <p>{formatTime(request.requested_clock_in)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Requested Out</p>
                  <p>{formatTime(request.requested_clock_out)}</p>
                </div>
                {request.actual_duration_minutes && (
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p>{Math.floor(request.actual_duration_minutes / 60)}h {request.actual_duration_minutes % 60}m</p>
                  </div>
                )}
              </div>

              {request.notes && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Notes from employee:</p>
                  <p className="text-sm">{request.notes}</p>
                </div>
              )}

              {request.status === 'pending' ? (
                <div className="space-y-3">
                  {approvingId === request.id ? (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 mb-2">
                        This will create a clock session from {formatTime(request.requested_clock_in)} to {formatTime(request.requested_clock_out)}.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate({ id: request.id })}
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Confirm Approval
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setApprovingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : rejectingId === request.id ? (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700 mb-2">Rejection reason (required):</p>
                      <textarea
                        className="w-full p-2 border rounded-md text-sm mb-2"
                        rows={2}
                        placeholder="e.g. Insufficient justification..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={rejectMutation.isPending || rejectionReason.length < 5}
                          onClick={() => rejectMutation.mutate({ id: request.id, reason: rejectionReason })}
                        >
                          {rejectMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Confirm Rejection
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectionReason(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={() => setApprovingId(request.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button variant="outline" onClick={() => setRejectingId(request.id)}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  {request.status === 'approved' ? (
                    <p className="text-green-600">
                      Approved by {request.reviewer?.full_name || 'Unknown'} at {formatRelativeTime(request.reviewed_at)}
                    </p>
                  ) : (
                    <div>
                      <p className="text-red-600">
                        Rejected by {request.reviewer?.full_name || 'Unknown'}
                      </p>
                      {request.rejection_reason && (
                        <p className="text-muted-foreground mt-1">Reason: {request.rejection_reason}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
