'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getInvoices } from '@/lib/api/invoices';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CanWrite } from '@/components/auth/Can';
import { INVOICE_STATUS_CLASSES, INVOICE_STATUS_LABELS, type InvoiceStatus } from '@/types/invoices';
import { Plus, Search, Receipt } from 'lucide-react';

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function InvoicesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', search, status],
    queryFn: () => getInvoices({ search: search || undefined, status: status || undefined, limit: 50 }),
  });

  const invoices = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="w-8 h-8" />
            Invoices
          </h1>
          <p className="text-muted-foreground">Create, send PDF invoices to buyers</p>
        </div>
        <CanWrite>
          <Button onClick={() => router.push('/dashboard/invoices/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New invoice
          </Button>
        </CanWrite>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 md:w-40"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map((s) => (
            <option key={s} value={s}>
              {INVOICE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-muted-foreground">Loading...</p>
        ) : invoices.length === 0 ? (
          <p className="p-12 text-center text-muted-foreground">No invoices yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3">Invoice #</th>
                <th className="text-left p-3">Buyer</th>
                <th className="text-left p-3">Issue</th>
                <th className="text-left p-3">Due</th>
                <th className="text-right p-3">Total</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                >
                  <td className="p-3 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="p-3 font-medium">
                    {inv.buyers?.buyer_name || inv.buyer?.buyer_name || '—'}
                  </td>
                  <td className="p-3">{inv.issue_date}</td>
                  <td className="p-3">{inv.due_date}</td>
                  <td className="p-3 text-right tabular-nums">{formatMoney(Number(inv.total), inv.currency)}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${INVOICE_STATUS_CLASSES[inv.status as InvoiceStatus] || ''}`}
                    >
                      {INVOICE_STATUS_LABELS[inv.status as InvoiceStatus] || inv.status}
                    </span>
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
