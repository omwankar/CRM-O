'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getCreditStatusList } from '@/lib/api/payments';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Landmark, Loader2 } from 'lucide-react';

function formatMoney(amount: number | null | undefined) {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function CreditStatusPage() {
  const router = useRouter();
  const { canWrite, isLoading: userLoading } = useCurrentUser();

  const { data, isLoading, error } = useQuery({
    queryKey: ['credit-status'],
    queryFn: getCreditStatusList,
    enabled: canWrite,
  });

  if (userLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canWrite) {
    return (
      <div className="space-y-4 max-w-lg">
        <h1 className="text-2xl font-semibold">Credit status</h1>
        <p className="text-muted-foreground text-sm">
          Credit exposure is available to managers and super admins only.
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard/invoices')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to invoices
        </Button>
      </div>
    );
  }

  const rows = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Landmark className="w-8 h-8" />
          Credit status
        </h1>
        <p className="text-muted-foreground">
          Buyer credit utilization from unpaid invoice balances (highest first)
        </p>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="p-8 text-destructive text-sm">
            {(error as Error).message || 'Failed to load credit status'}
          </p>
        ) : rows.length === 0 ? (
          <p className="p-12 text-center text-muted-foreground">No buyers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium text-right">Limit</th>
                  <th className="px-4 py-3 font-medium text-right">Used</th>
                  <th className="px-4 py-3 font-medium text-right">Available</th>
                  <th className="px-4 py-3 font-medium text-right">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const util = r.utilization_pct;
                  const over = util != null && util >= 100;
                  const warn = util != null && util >= 80 && util < 100;
                  return (
                    <tr key={r.buyer_id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/buyers/${r.buyer_id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {r.buyer_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.credit_limit)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.credit_used)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(r.credit_available)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {util == null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              over
                                ? 'bg-red-100 text-red-800'
                                : warn
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {util.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
