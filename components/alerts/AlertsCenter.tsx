'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle,
  CalendarDays,
  Clock3,
  Info,
  Loader2,
  Megaphone,
} from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import { getExpiringAlerts, type ExpiryAlert } from '@/lib/api/alerts';
import { formatUkDate } from '@/lib/date';
import { cn } from '@/lib/utils';

export type AlertsTab = 'notifications' | 'expiries';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'leave':
    case 'leave_approved':
      return <CalendarDays className="w-4 h-4 text-blue-500" />;
    case 'leave_rejected':
      return <CalendarDays className="w-4 h-4 text-red-500" />;
    case 'punch_approved':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'punch_rejected':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'missed_punch':
    case 'open_session_warning':
      return <Clock3 className="w-4 h-4 text-amber-500" />;
    case 'announcement':
      return <Megaphone className="w-4 h-4 text-purple-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
}

function formatRelativeTime(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getExpiryStatusText(daysUntil: number) {
  if (daysUntil < 0) return `Expired ${Math.abs(daysUntil)} days ago`;
  if (daysUntil === 0) return 'Expires today';
  if (daysUntil === 1) return 'Expires tomorrow';
  return `Expires in ${daysUntil} days`;
}

type AlertsCenterProps = {
  tab: AlertsTab;
  onTabChange: (tab: AlertsTab) => void;
  compact?: boolean;
  onItemClick?: () => void;
};

export function AlertsCenter({ tab, onTabChange, compact = false, onItemClick }: AlertsCenterProps) {
  const qc = useQueryClient();

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(compact ? 20 : 50),
  });

  const { data: expiryData, isLoading: expiryLoading } = useQuery({
    queryKey: ['alerts-expiring'],
    queryFn: () => getExpiringAlerts(),
  });

  const markReadMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n: { is_read?: boolean }) => !n.is_read).length;
  const expiries = expiryData?.data || [];

  return (
    <div className={cn('flex flex-col', compact ? 'min-h-0' : 'space-y-4')}>
      <div className={cn('flex items-center gap-1', compact ? 'border-b border-border px-2 pt-1' : '')}>
        <button
          type="button"
          onClick={() => onTabChange('notifications')}
          className={cn(
            'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'notifications'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </button>
        <button
          type="button"
          onClick={() => onTabChange('expiries')}
          className={cn(
            'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'expiries'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Expiries{expiries.length > 0 ? ` (${expiries.length})` : ''}
        </button>
        {tab === 'notifications' && unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={() => markAllMut.mutate()}
            disabled={markAllMut.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className={cn(compact ? 'flex-1 overflow-y-auto' : '')}>
        {tab === 'notifications' ? (
          notificationsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10 px-4">
              No notifications yet.
            </p>
          ) : (
            <div className={cn(compact ? 'divide-y divide-border' : 'grid gap-3')}>
              {notifications.map((n: {
                id: string;
                type: string;
                title: string;
                message: string;
                is_read: boolean;
                created_at: string;
              }) => (
                <div
                  key={n.id}
                  className={cn(
                    compact
                      ? `p-3 hover:bg-muted/50 cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`
                      : `rounded-xl border border-border p-4 ${!n.is_read ? 'bg-primary/5' : 'bg-card'}`
                  )}
                  onClick={() => {
                    if (!n.is_read) markReadMut.mutate(n.id);
                    onItemClick?.();
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-muted shrink-0">{getNotificationIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="font-medium text-sm truncate">{n.title}</p>
                        {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : expiryLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : expiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">
              No certifications, memberships, or insurance expiring soon.
            </p>
          </div>
        ) : (
          <div className={cn(compact ? 'divide-y divide-border' : 'grid gap-3')}>
            {expiries.map((alert: ExpiryAlert) => (
              <Link
                key={`${alert.type}-${alert.id}`}
                href={alert.href}
                onClick={onItemClick}
                className={cn(
                  'block',
                  compact
                    ? 'p-3 hover:bg-muted/50'
                    : `rounded-xl border-l-4 p-4 border border-border ${
                        alert.status === 'expired'
                          ? 'border-l-red-500 bg-red-500/10'
                          : 'border-l-amber-500 bg-amber-500/10'
                      }`
                )}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      alert.status === 'expired' ? 'text-red-500' : 'text-amber-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm truncate">{alert.name}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                        {alert.type}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{getExpiryStatusText(alert.days_until_expiry)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Date: {formatUkDate(alert.expiry_date)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function useAlertsBadgeCount() {
  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60000,
  });

  const { data: expiryData } = useQuery({
    queryKey: ['alerts-expiring'],
    queryFn: () => getExpiringAlerts(),
    refetchInterval: 120000,
  });

  const unread = countData?.count || 0;
  const expiries = expiryData?.total ?? expiryData?.data?.length ?? 0;
  return unread + expiries;
}
