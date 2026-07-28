'use client';

import { useState } from 'react';
import { AlertsCenter, type AlertsTab } from '@/components/alerts/AlertsCenter';

export default function AlertsPage() {
  const [tab, setTab] = useState<AlertsTab>('notifications');

  return (
    <div className="page-shell space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts & Notifications</h1>
          <p className="page-subtitle">
            Inbox notices and certification, membership, and insurance expiry reminders — same place as the bell.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
        <AlertsCenter tab={tab} onTabChange={setTab} />
      </div>
    </div>
  );
}
