'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { getExpiringAlerts, type ExpiryAlert } from '@/lib/api/alerts';

function getAlertStyles(status: ExpiryAlert['status']) {
  return status === 'expired'
    ? 'border-red-500/35 bg-red-500/12'
    : 'border-amber-500/35 bg-amber-500/12';
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

function getStatusText(daysUntil: number) {
  if (daysUntil < 0) return `Expired ${Math.abs(daysUntil)} days ago`;
  if (daysUntil === 0) return 'Expires today';
  if (daysUntil === 1) return 'Expires tomorrow';
  return `Expires in ${daysUntil} days`;
}

export default function AlertsPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['alerts-expiring'],
    queryFn: () => getExpiringAlerts(),
  });

  const alerts = data?.data || [];
  const thresholds = data?.thresholds;

  return (
    <div className="page-shell space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts & Expiries</h1>
          <p className="page-subtitle">
            Certifications, memberships, and insurance nearing expiry
            {thresholds
              ? ` (within ${thresholds.certification}/${thresholds.membership}/${thresholds.insurance} days)`
              : ' (default window: 30 days)'}
            .
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The notification bell is separate — it shows leave, punch, and announcement notices.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card className="p-6 border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-700 dark:text-red-300">
            {(error as Error).message || 'Failed to load expiry alerts'}
          </p>
          <button
            type="button"
            className="mt-3 text-sm text-blue-600 hover:underline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Retry
          </button>
        </Card>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">All clear!</h2>
          <p className="text-muted-foreground text-center max-w-md">
            No certifications, memberships, or insurance policies are expiring within the alert
            window. Add records under Administration to start tracking renewals.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <Card
              key={`${alert.type}-${alert.id}`}
              className={`surface-card border-l-4 p-6 ${getAlertStyles(alert.status)}`}
            >
              <div className="flex items-start gap-4">
                <AlertCircle
                  className={`w-5 h-5 shrink-0 ${
                    alert.status === 'expired' ? 'text-red-500' : 'text-amber-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link
                      href={alert.href}
                      className="text-lg font-semibold text-foreground hover:underline"
                    >
                      {alert.name}
                    </Link>
                    <span className="rounded-full bg-card px-2 py-0.5 text-xs capitalize text-muted-foreground">
                      {alert.type}
                    </span>
                  </div>
                  <p className="mb-1 text-sm font-medium text-foreground">
                    {getStatusText(alert.days_until_expiry)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Date: {formatDate(alert.expiry_date)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
