'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Bell,
  Pencil,
  Send,
  Edit3,
  Search,
} from 'lucide-react';
import {
  addVendorQuote,
  updateVendorQuote,
  deleteVendorQuote,
  updateQuotation,
} from '@/lib/api/quotations';
import type { EnquiryStage, Quotation, QuotationFollowup, UpdateQuotationInput, VendorQuote } from '@/types/quotations';
import { normalizeEnquiryStage, buildOutcomeString, closureKindToCrmStatus } from '@/types/quotations';
import { EnquiryOutcomeModal } from '@/components/quotations/EnquiryOutcomeModal';
import { VendorQuoteTable } from '@/components/quotations/VendorQuoteTable';
import { VendorQuoteForm } from '@/components/quotations/VendorQuoteForm';
import { EnquiryInfoPanel } from '@/components/quotations/EnquiryInfoPanel';
import { FollowUpTable } from '@/components/quotations/FollowUpTable';
import { FollowUpForm } from '@/components/quotations/FollowUpForm';
import { QuotationStatusBar } from '@/components/quotations/QuotationStatusBar';
import {
  useQuotation,
  useUpdateQuotation,
  useChooseVendorQuote,
  useAddFollowup,
  useUpdateFollowup,
  useDeleteFollowup,
} from '@/hooks/useQuotations';
import { useCurrentUser } from '@/hooks/useCurrentUser';
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
  const { user, role } = useCurrentUser();

  const [searchQ, setSearchQ] = useState('');
  const [quoteSheetOpen, setQuoteSheetOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<VendorQuote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorQuote | null>(null);
  const [clarustoOpen, setClarustoOpen] = useState(false);
  const [clarustoDraft, setClarustoDraft] = useState({
    clarusto_final_price: '',
    clarusto_final_currency: 'INR',
    clarusto_final_notes: '',
  });
  const [followupOpen, setFollowupOpen] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState<QuotationFollowup | null>(null);
  const [deleteFollowupTarget, setDeleteFollowupTarget] = useState<QuotationFollowup | null>(null);
  const [closureOpen, setClosureOpen] = useState(false);
  const [closureAdjustOnly, setClosureAdjustOnly] = useState(false);

  const { data: q, isLoading, error } = useQuotation(id || '');

  const updateQuotationMut = useUpdateQuotation();
  const chooseQuoteMut = useChooseVendorQuote();
  const addFollowupMut = useAddFollowup();
  const updateFollowupMut = useUpdateFollowup();
  const deleteFollowupMut = useDeleteFollowup();

  const addQuoteMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => addVendorQuote(id!, payload as never),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ quoteId, payload }: { quoteId: string; payload: Record<string, unknown> }) =>
      updateVendorQuote(quoteId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => deleteVendorQuote(quoteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
  });

  const updateClarustoMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateQuotation(id!, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
  });

  const quotation = q as Quotation | undefined;
  const enquiryStage = useMemo(() => (quotation ? normalizeEnquiryStage(quotation) : 'new_enquiry'), [quotation]);

  const followups = quotation?.quotation_followups || [];

  const runSearch = () => {
    const t = searchQ.trim();
    if (!t) return;
    router.push(`/dashboard/quotations?search=${encodeURIComponent(t)}`);
  };

  return (
    <div className="min-h-0 space-y-6 pb-8">
      <header className="sticky top-0 z-40 -mx-6 border-b border-zinc-200/90 bg-white px-6 py-3.5 shadow-sm dark:border-border dark:bg-background">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0 -ml-1" onClick={() => router.push('/dashboard/quotations')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-foreground sm:text-xl">Quotation Tracker</h1>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 lg:min-w-0 lg:max-w-3xl">
            <div className="relative flex-1 min-w-[180px] max-w-lg">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 rounded-lg border-zinc-200 bg-zinc-50/80 pl-9 shadow-inner placeholder:text-muted-foreground/80 dark:border-border dark:bg-muted/30"
                placeholder="Search enquiry by ID, name, customer..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runSearch();
                }}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-zinc-600" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-10 shrink-0 bg-blue-600 px-4 font-semibold text-white shadow-sm hover:bg-blue-700"
              onClick={() => router.push('/dashboard/quotations/new')}
            >
              + Add Enquiry
            </Button>
            {id ? (
              <Button variant="outline" size="sm" className="h-10 shrink-0 border-zinc-300" onClick={() => router.push(`/dashboard/quotations/${id}/edit`)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-48 rounded-2xl bg-muted animate-pulse" />
          <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        </div>
      ) : !quotation ? (
        <Card className="p-6 rounded-2xl">
          <p className="text-sm text-destructive">Quotation not found.</p>
          {error ? (
            <p className="text-xs text-muted-foreground mt-2 break-all">{String((error as Error)?.message || '')}</p>
          ) : null}
        </Card>
      ) : (
        <>
          <EnquiryInfoPanel
            quotation={quotation}
            enquiryStage={enquiryStage}
            isSaving={updateQuotationMut.isPending}
            onPatch={async (data) => {
              if (!id) return;
              await updateQuotationMut.mutateAsync({ id, data });
            }}
            onStageChange={async (stage) => {
              if (!id) return;
              if (stage === 'won_lost_closed' && enquiryStage !== 'won_lost_closed') {
                setClosureAdjustOnly(false);
                setClosureOpen(true);
                return;
              }
              await updateQuotationMut.mutateAsync({ id, data: { enquiry_stage: stage } });
            }}
            onRequestCloseEnquiry={() => {
              setClosureAdjustOnly(false);
              setClosureOpen(true);
            }}
            onRequestAdjustOutcome={() => {
              setClosureAdjustOnly(true);
              setClosureOpen(true);
            }}
          />

          <EnquiryOutcomeModal
            open={closureOpen}
            onOpenChange={setClosureOpen}
            adjustOnly={closureAdjustOnly}
            currentOutcome={quotation.outcome}
            onConfirm={async (kind, detail) => {
              if (!id) return;
              const data: UpdateQuotationInput = {
                outcome: buildOutcomeString(kind, detail),
                status: closureKindToCrmStatus(kind),
              };
              if (!closureAdjustOnly) {
                data.enquiry_stage = 'won_lost_closed';
              }
              await updateQuotationMut.mutateAsync({ id, data });
            }}
          />

          <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
            <VendorQuoteTable
              quotes={(quotation.quotation_vendor_quotes || []) as VendorQuote[]}
              chosenQuoteId={quotation.chosen_quote_id}
              onAdd={() => {
                setEditingQuote(null);
                setQuoteSheetOpen(true);
              }}
              onEdit={(vq) => {
                setEditingQuote(vq);
                setQuoteSheetOpen(true);
              }}
              onDelete={(vq) => setDeleteTarget(vq)}
              onChoose={(vq) => id && chooseQuoteMut.mutate({ quotation_id: id, vendor_quote_id: vq.id })}
            />
          </Card>

          <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
            <FollowUpTable
              followups={followups}
              currentUserId={user?.id}
              isSuperAdmin={role === 'super_admin'}
              onAdd={() => {
                setEditingFollowup(null);
                setFollowupOpen(true);
              }}
              onEdit={(f) => {
                setEditingFollowup(f);
                setFollowupOpen(true);
              }}
              onDelete={(f) => setDeleteFollowupTarget(f)}
            />
          </Card>

          <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-0.5">
                <h3 className="text-base font-semibold tracking-tight text-foreground">Clarusto Final Quotation</h3>
                <p className="text-xs text-muted-foreground">Internal final price and sent status</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    setClarustoDraft({
                      clarusto_final_price:
                        quotation?.clarusto_final_price == null ? '' : String(quotation.clarusto_final_price),
                      clarusto_final_currency: quotation?.clarusto_final_currency || 'INR',
                      clarusto_final_notes: quotation?.clarusto_final_notes || '',
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
                  className="h-9"
                  disabled={!!quotation?.clarusto_quote_sent_at || updateClarustoMutation.isPending}
                  onClick={async () => {
                    await updateClarustoMutation.mutateAsync({
                      clarusto_quote_sent_at: new Date().toISOString(),
                    });
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {quotation?.clarusto_quote_sent_at ? 'Sent' : 'Mark as Sent'}
                </Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-3 sm:px-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Final price</p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {formatCurrency(quotation.clarusto_final_price, quotation.clarusto_final_currency)}
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-3 sm:px-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sent at</p>
                <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                  {quotation.clarusto_quote_sent_at
                    ? new Date(quotation.clarusto_quote_sent_at).toLocaleString()
                    : '—'}
                </p>
              </div>
            </div>
            {quotation.clarusto_final_notes ? (
              <div className="mt-3 rounded-lg border border-border/50 bg-muted/10 px-3 py-3 sm:px-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {quotation.clarusto_final_notes}
                </p>
              </div>
            ) : null}
          </Card>

          <QuotationStatusBar quotation={quotation} enquiryStage={enquiryStage} />
        </>
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
        quotationId={id || undefined}
        customerDisplayName={
          quotation?.projects?.project_name || quotation?.standalone_project_name || undefined
        }
        initial={editingQuote}
        onSubmit={async (payload) => {
          if (!id) return;
          if (editingQuote?.id) {
            await updateQuoteMutation.mutateAsync({ quoteId: editingQuote.id, payload });
          } else {
            await addQuoteMutation.mutateAsync(payload);
          }
        }}
      />

      <FollowUpForm
        open={followupOpen}
        onOpenChange={setFollowupOpen}
        initial={editingFollowup}
        onSubmit={async (data) => {
          if (!id) return;
          if (editingFollowup?.id) {
            await updateFollowupMut.mutateAsync({
              followupId: editingFollowup.id,
              quotationId: id,
              data,
            });
          } else {
            await addFollowupMut.mutateAsync({ quotation_id: id, data });
          }
        }}
      />

      {deleteTarget && (
        <AlertDialog open onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete vendor quote?</AlertDialogTitle>
              <AlertDialogDescription>This will remove the company quotation from this enquiry.</AlertDialogDescription>
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

      {deleteFollowupTarget && id ? (
        <AlertDialog open onOpenChange={() => setDeleteFollowupTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete follow-up?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteFollowupTarget(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  await deleteFollowupMut.mutateAsync({
                    followupId: deleteFollowupTarget.id,
                    quotationId: id,
                  });
                  setDeleteFollowupTarget(null);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
