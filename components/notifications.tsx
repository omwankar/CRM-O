'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';
import { AlertsCenter, useAlertsBadgeCount, type AlertsTab } from '@/components/alerts/AlertsCenter';

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<AlertsTab>('notifications');
  const panelRef = useRef<HTMLDivElement>(null);
  const badgeCount = useAlertsBadgeCount();

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

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen((o) => !o)}
        className="relative"
        aria-label="Alerts and notifications"
      >
        <Bell className="w-4 h-4" />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-10 z-50 w-[26rem] max-h-[75vh] overflow-hidden flex flex-col shadow-xl">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Alerts & Notifications</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/dashboard/alerts" onClick={() => setIsOpen(false)}>
                  Open full page
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <AlertsCenter
            tab={tab}
            onTabChange={setTab}
            compact
            onItemClick={() => setIsOpen(false)}
          />
        </Card>
      )}
    </div>
  );
}
