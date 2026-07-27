'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, X, AlertCircle, Info, CheckCircle, CalendarDays, Megaphone, Clock3 } from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';

function getIcon(type: string) {
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

function formatTime(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60000,
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(30),
    enabled: isOpen,
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

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isOpen]);

  const unreadCount = countData?.count || 0;
  const notifications = listData?.data || [];

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen((o) => !o)}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-10 z-50 w-96 max-h-[70vh] overflow-hidden flex flex-col shadow-xl">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => markAllMut.mutate()}
                  disabled={markAllMut.isPending}
                >
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications</p>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 hover:bg-muted/50 cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`}
                    onClick={() => {
                      if (!n.is_read) markReadMut.mutate(n.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-muted shrink-0">{getIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-medium text-sm truncate">{n.title}</p>
                          {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatTime(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
