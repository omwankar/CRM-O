'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Pencil, FileText, User2, CalendarDays, Briefcase, BadgeIndianRupee, Send, Edit3 } from 'lucide-react';
import { getQuotationById, addVendorQuote, updateVendorQuote, deleteVendorQuote, chooseVendorQuote, updateQuotation } from '@/lib/api/quotations';
import { QuotationStatusBadge } from '@/components/quotations/QuotationStatusBadge';
import { VendorQuoteTable } from '@/components/quotations/VendorQuoteTable';
import { VendorQuoteForm } from '@/components/quotations/VendorQuoteForm';
import type { VendorQuote } from '@/types/quotations';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function formatCurrency(amount?: number | null, currency?: string | null) {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR' }).format(amount);
  } catch {
    return String(amount);
  }
}

export default function QuotationDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const qc = useQueryClient();

  const [quoteSheetOpen, setQuoteSheetOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<VendorQuote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorQuote | null>(null);
  const [clarustoOpen, setClarustoOpen] = useState(false);
  const [clarustoDraft, setClarustoDraft] = useState({
    clarusto_final_price: '',
    clarusto_final_currency: 'INR',
    clarusto_final_notes: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => getQuotationById(id),
    enabled: !!id,
  });

  const q: any = data;

  const addQuoteMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addVendorQuote>[1]) => addVendorQuote(id, payload as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ quoteId, payload }: { quoteId: string; payload: any }) => updateVendorQuote(quoteId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => deleteVendorQuote(quoteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
  });

  const chooseQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => chooseVendorQuote(id, quoteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
  });

  const updateClarustoMutation = useMutation({
    mutationFn: (payload: any) => updateQuotation(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Quotation</h1>
            <p className="text-muted-foreground">Details</p>
          </div>
        </div>
        {id && (
          <Button variant="outline" onClick={() => router.push(`/dashboard/quotations/${id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : !q ? (
        <Card className="p-6">
          <p className="text-sm text-destructive">Quotation not found.</p>
          {error ? (
            <p className="text-xs text-muted-foreground mt-2 break-all">{String((error as any)?.message || '')}</p>
          ) : null}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-4">
            <Card className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <p className="font-mono text-sm">{q.quotation_number}</p>
                  </div>
                  <h2 className="text-[18px] font-semibold text-foreground mt-2">Requirement</h2>
                </div>
                <QuotationStatusBadge status={q.status} className="mt-1" />
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{q.requirement}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3 bg-background/30">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <User2 className="h-3.5 w-3.5" />
                    Lead
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1">{q.users?.full_name || '—'}</p>
                </div>

                <div className="rounded-xl border border-border p-3 bg-background/30">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                    {q.projects?.id || q.standalone_project_name ? (
                      <Briefcase className="h-3.5 w-3.5" />
                    ) : (
                      <BadgeIndianRupee className="h-3.5 w-3.5" />
                    )}
                    {q.projects?.id || q.standalone_project_name ? 'Project' : 'Client Budget'}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {q.projects?.id ? (
                      <button
                        className="text-primary hover:underline"
                        onClick={() => router.push(`/dashboard/projects/${q.projects.id}`)}
                      >
                        {q.projects.project_name}
                      </button>
                    ) : q.standalone_project_name ? (
                      q.standalone_project_name
                    ) : (
                      formatCurrency(q.client_budget, q.client_currency)
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-3 bg-background/30">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Deadline
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {q.deadline ? new Date(q.deadline).toLocaleDateString() : '—'}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-3 bg-background/30">
                  <p className="text-[11px] text-muted-foreground">Vendors Contacted</p>
                  <p className="text-sm font-medium text-foreground mt-1 tabular-nums">
                    {(q.quotation_vendor_quotes || []).length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-border bg-card p-5">
              <VendorQuoteTable
                quotes={(q.quotation_vendor_quotes || []) as VendorQuote[]}
                onAdd={() => {
                  setEditingQuote(null);
                  setQuoteSheetOpen(true);
                }}
                onEdit={(vq) => {
                  setEditingQuote(vq);
                  setQuoteSheetOpen(true);
                }}
                onDelete={(vq) => setDeleteTarget(vq)}
                onChoose={(vq) => chooseQuoteMutation.mutate(vq.id)}
              />
            </Card>

            <Card className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-medium">Revision History</h3>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {(q.quotation_revisions || []).length} total
                </p>
              </div>
              <div className="space-y-2">
                {(q.quotation_revisions || []).map((r: any) => (
                  <div key={r.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Revision #{r.revision_number}</p>
                      <p className="text-sm font-semibold">{formatCurrency(r.revised_price, r.currency)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.users?.full_name || '—'} • {new Date(r.created_at).toLocaleString()}</p>
                    {r.notes && <p className="text-sm mt-2">{r.notes}</p>}
                  </div>
                ))}
                {(q.quotation_revisions || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No revisions yet.</p>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <Card className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-medium">Clarusto Final Quotation</h3>
                  <p className="text-xs text-muted-foreground">Internal final price & sent status</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setClarustoDraft({
                        clarusto_final_price: q?.clarusto_final_price == null ? '' : String(q.clarusto_final_price),
                        clarusto_final_currency: q?.clarusto_final_currency || 'INR',
                        clarusto_final_notes: q?.clarusto_final_notes || '',
                      });
                      setClarustoOpen(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!!q?.clarusto_quote_sent_at || updateClarustoMutation.isPending}
                    onClick={async () => {
                      await updateClarustoMutation.mutateAsync({
                        clarusto_quote_sent_at: new Date().toISOString(),
                      });
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {q?.clarusto_quote_sent_at ? 'Sent' : 'Mark as Sent'}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Final Price</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(q.clarusto_final_price, q.clarusto_final_currency)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Sent At</p>
                  <p className="text-sm font-medium mt-1">
                    {q.clarusto_quote_sent_at ? new Date(q.clarusto_quote_sent_at).toLocaleString() : '—'}
                  </p>
                </div>
                {q.clarusto_final_notes && (
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{q.clarusto_final_notes}</p>
                  </div>
                )}
              </div>
            </Card>

            {q.chosen_quote_id ? (
              <Card className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-base font-medium mb-3">Chosen Vendor Quote</h3>
                {(() => {
                  const chosen = (q.quotation_vendor_quotes || []).find((x: any) => x.id === q.chosen_quote_id) || (q.quotation_vendor_quotes || []).find((x: any) => x.is_chosen);
                  if (!chosen) return <p className="text-sm text-muted-foreground">No chosen quote found.</p>;
                  return (
                    <div className="rounded-xl border border-border bg-emerald-50 dark:bg-emerald-950/20 p-4">
                      <p className="text-sm font-medium">
                        {chosen.vendor_name || chosen.vendors?.vendor_name || 'Vendor'}
                      </p>
                      <p className="text-sm font-semibold mt-1">{formatCurrency(chosen.quoted_price, chosen.currency)}</p>
                      <p className="text-xs text-muted-foreground mt-2">{chosen.email_sent_to || '—'}</p>
                    </div>
                  );
                })()}
              </Card>
            ) : null}
          </div>
        </div>
      )}

      <Dialog open={clarustoOpen} onOpenChange={setClarustoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Clarusto Final Quotation</DialogTitle>
            <DialogDescription>Set final price, currency, and notes.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>Final Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="mt-2"
                  value={clarustoDraft.clarusto_final_price}
                  onChange={(e) =>
                    setClarustoDraft((s) => ({ ...s, clarusto_final_price: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Currency</Label>
                <select
                  className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  value={clarustoDraft.clarusto_final_currency}
                  onChange={(e) =>
                    setClarustoDraft((s) => ({ ...s, clarusto_final_currency: e.target.value }))
                  }
                >
                  {['INR', 'USD', 'EUR', 'AED'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                className="mt-2"
                rows={4}
                value={clarustoDraft.clarusto_final_notes}
                onChange={(e) =>
                  setClarustoDraft((s) => ({ ...s, clarusto_final_notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClarustoOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await updateClarustoMutation.mutateAsync({
                  clarusto_final_price:
                    clarustoDraft.clarusto_final_price === ''
                      ? null
                      : Number(clarustoDraft.clarusto_final_price),
                  clarusto_final_currency: clarustoDraft.clarusto_final_currency || 'INR',
                  clarusto_final_notes: clarustoDraft.clarusto_final_notes || null,
                });
                setClarustoOpen(false);
              }}
              disabled={updateClarustoMutation.isPending}
            >
              {updateClarustoMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VendorQuoteForm
        open={quoteSheetOpen}
        onOpenChange={setQuoteSheetOpen}
        initial={editingQuote}
        onSubmit={async (payload) => {
          if (!id) return;
          if (editingQuote?.id) {
            await updateQuoteMutation.mutateAsync({ quoteId: editingQuote.id, payload });
          } else {
            await addQuoteMutation.mutateAsync(payload as any);
          }
        }}
      />

      {deleteTarget && (
        <AlertDialog open onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete vendor quote?</AlertDialogTitle>
              <AlertDialogDescription>This will remove the vendor quote from this quotation.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  await deleteQuoteMutation.mutateAsync(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

