'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { VendorQuote, VendorQuoteLineStatus } from '@/types/quotations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Download, MoreHorizontal, Star, FileText, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(amount?: number | null, currency?: string | null) {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR' }).format(amount);
  } catch {
    return String(amount);
  }
}

function lineStatusBadge(status: VendorQuoteLineStatus | null | undefined) {
  const s = status || 'under_review';
  if (s === 'finalised') return <Badge className="bg-emerald-500/15 text-emerald-800 border-emerald-500/30">Finalised</Badge>;
  if (s === 'sent') return <Badge className="bg-blue-500/15 text-blue-800 border-blue-500/30">Sent</Badge>;
  return <Badge className="bg-orange-500/15 text-orange-800 border-orange-500/30">Under Review</Badge>;
}

export function VendorQuoteTable({
  quotes,
  chosenQuoteId,
  onAdd,
  onEdit,
  onDelete,
  onChoose,
}: {
  quotes: VendorQuote[];
  chosenQuoteId?: string | null;
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

  const chosen =
    sorted.find((q) => q.id === chosenQuoteId) || sorted.find((q) => q.is_chosen) || null;
  const companyLabel = (q: VendorQuote) => q.vendor_name || q.vendors?.vendor_name || '—';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Quotations from Different Companies</h3>
        <Button
          size="sm"
          variant="outline"
          className="border-blue-600 bg-white font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:bg-transparent dark:text-blue-400 dark:hover:bg-blue-950/30"
          onClick={onAdd}
        >
          + Add Quotation
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No company quotations yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200/90 bg-white dark:border-border dark:bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-zinc-50/90 hover:bg-zinc-50/90 dark:bg-muted/50">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Quote No.</TableHead>
                <TableHead>Quote Date</TableHead>
                <TableHead className="whitespace-nowrap">Amount</TableHead>
                <TableHead>Validity Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Quote File</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="text-center">Final Selection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((q, idx) => {
                const vendorLabel = companyLabel(q);
                const chosenRow = q.is_chosen || q.id === chosenQuoteId;
                const quoteDate = q.email_sent_at || q.quote_received_at || q.created_at;
                return (
                  <TableRow
                    key={q.id}
                    className={cn(
                      chosenRow && 'border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/15',
                    )}
                  >
                    <TableCell className="align-middle">
                      <div className="flex items-center gap-1">
                        {chosenRow ? <Star className="h-4 w-4 fill-amber-400 text-amber-500 shrink-0" /> : null}
                        <span className="tabular-nums text-muted-foreground">{idx + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        className="text-left text-blue-600 hover:underline dark:text-blue-400"
                        onClick={() => onEdit(q)}
                      >
                        {vendorLabel}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{q.vendor_quote_number || '—'}</TableCell>
                    <TableCell className="text-sm tabular-nums whitespace-nowrap">
                      {quoteDate ? new Date(quoteDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums whitespace-nowrap">
                      {formatCurrency(q.quoted_price, q.currency)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums whitespace-nowrap">
                      {q.validity_date ? new Date(q.validity_date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>{lineStatusBadge(q.quote_line_status as VendorQuoteLineStatus)}</TableCell>
                    <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground" title={q.notes || ''}>
                      {q.notes || '—'}
                    </TableCell>
                    <TableCell>
                      {q.quote_file_url ? (
                        <a
                          href={q.quote_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="h-4 w-4" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(q)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {q.quote_file_url ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={q.quote_file_url} download target="_blank" rel="noopener noreferrer" title="Download">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(q)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(q)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="radio"
                        name="final-vendor-quote"
                        className="h-4 w-4 accent-emerald-600"
                        checked={chosenRow}
                        onChange={() => onChoose(q)}
                        aria-label={`Select ${vendorLabel}`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {chosen ? (
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-3 py-2.5 text-sm font-semibold text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          ★ Finalised Quotation: {companyLabel(chosen)} ({chosen.vendor_quote_number || chosen.id.slice(0, 8)}) – Amount:{' '}
          {formatCurrency(chosen.quoted_price, chosen.currency)}
        </div>
      ) : null}
    </div>
  );
}
