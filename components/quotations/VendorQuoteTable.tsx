'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { VendorQuote } from '@/types/quotations';
import { Mail, CheckCircle2, Pencil, Trash2 } from 'lucide-react';

function formatCurrency(amount?: number | null, currency?: string | null) {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR' }).format(amount);
  } catch {
    return String(amount);
  }
}

export function VendorQuoteTable({
  quotes,
  onAdd,
  onEdit,
  onDelete,
  onChoose,
}: {
  quotes: VendorQuote[];
  onAdd: () => void;
  onEdit: (q: VendorQuote) => void;
  onDelete: (q: VendorQuote) => void;
  onChoose: (q: VendorQuote) => void;
}) {
  const sorted = useMemo(() => {
    return [...(quotes || [])].sort((a, b) => {
      if (a.is_chosen && !b.is_chosen) return -1;
      if (!a.is_chosen && b.is_chosen) return 1;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }, [quotes]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-medium">Vendors Contacted</h3>
        <Button size="sm" onClick={onAdd}>
          Add Vendor Quote
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No vendor quotes yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Chosen</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((q) => {
              const vendorLabel = q.vendor_name || q.vendors?.vendor_name || '—';
              const chosen = q.is_chosen;
              return (
                <TableRow
                  key={q.id}
                  className={chosen ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50 dark:bg-emerald-950/20' : ''}
                >
                  <TableCell className="font-medium">{vendorLabel}</TableCell>
                  <TableCell>
                    {q.email_sent_to ? (
                      <a
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                        href={`mailto:${q.email_sent_to}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-4 w-4" />
                        {q.email_sent_to}
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{q.email_sent_at ? new Date(q.email_sent_at).toLocaleString() : '—'}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(q.quoted_price, q.currency)}</TableCell>
                  <TableCell>{q.quote_received_at ? new Date(q.quote_received_at).toLocaleString() : '—'}</TableCell>
                  <TableCell>
                    {chosen ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" /> Yes
                      </span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => onChoose(q)}>
                        Choose
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(q)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(q)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

