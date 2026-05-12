'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Pencil,
  Search,
} from 'lucide-react';
import {
  addVendorQuote,
  updateVendorQuote,
  deleteVendorQuote,
} from '@/lib/api/quotations';
import type { EnquiryStage, Quotation, QuotationFollowup, UpdateQuotationInput, VendorQuote } from '@/types/quotations';
import { normalizeEnquiryStage, buildOutcomeString, closureKindToCrmStatus, isTerminalEnquiryStage, closureKindForEnquiryStage, enquiryStageForClosureKind } from '@/types/quotations';
import { EnquiryOutcomeModal } from '@/components/quotations/EnquiryOutcomeModal';
import { FinalizeQuotationModal } from '@/components/quotations/FinalizeQuotationModal';
import { VendorQuoteTable } from '@/components/quotations/VendorQuoteTable';
import { VendorQuoteDetailSection } from '@/components/quotations/VendorQuoteDetailSection';
import { EnquiryInfoPanel } from '@/components/quotations/EnquiryInfoPanel';
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
import { notifyQuotationError } from '@/lib/quotation-notify';
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

export default function QuotationDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const qc = useQueryClient();
  const { user, role } = useCurrentUser();

  const [searchQ, setSearchQ] = useState('');
  const [vendorDetailMode, setVendorDetailMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editingQuote, setEditingQuote] = useState<VendorQuote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorQuote | null>(null);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [followupVendorQuoteId, setFollowupVendorQuoteId] = useState<string | null>(null);
  const [editingFollowup, setEditingFollowup] = useState<QuotationFollowup | null>(null);
  const [deleteFollowupTarget, setDeleteFollowupTarget] = useState<QuotationFollowup | null>(null);
  const [closureOpen, setClosureOpen] = useState(false);
  const [pendingClosureStage, setPendingClosureStage] = useState<EnquiryStage | null>(null);

  const { data: q, isLoading, error } = useQuotation(id || '');

  const updateQuotationMut = useUpdateQuotation();
  const chooseQuoteMut = useChooseVendorQuote();
  const addFollowupMut = useAddFollowup();
  const updateFollowupMut = useUpdateFollowup();
  const deleteFollowupMut = useDeleteFollowup();

  const addQuoteMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => addVendorQuote(id!, payload as never),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
    onError: (error) => notifyQuotationError(error, 'Could not save this company quotation.'),
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ quoteId, payload }: { quoteId: string; payload: Record<string, unknown> }) =>
      updateVendorQuote(quoteId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
    onError: (error) => notifyQuotationError(error, 'Could not update this company quotation.'),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => deleteVendorQuote(quoteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotation', id] }),
    onError: (error) => notifyQuotationError(error, 'Could not delete this company quotation.'),
  });

  const quotation = q as Quotation | undefined;
  const enquiryStage = useMemo(() => (quotation ? normalizeEnquiryStage(quotation) : 'new_enquiry'), [quotation]);

  const chosenVendorQuote = useMemo(() => {
    if (!quotation) return null;
    const quotes = (quotation.quotation_vendor_quotes || []) as VendorQuote[];
    return (
      quotes.find((quote) => quote.id === quotation.chosen_quote_id) ||
      quotes.find((quote) => quote.is_chosen) ||
      null
    );
  }, [quotation]);

  const followups = quotation?.quotation_followups || [];

  const runSearch = () => {
    const t = searchQ.trim();
    if (!t) return;
    router.push(`/dashboard/quotations?search=${encodeURIComponent(t)}`);
  };

  return (
    <div className="min-h-0 space-y-6 pb-8">
      <header className="border-b border-border bg-card py-3.5">
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
            <Button
              type="button"
              size="sm"
              className="h-10 shrink-0 bg-blue-600 px-4 font-semibold text-white shadow-sm hover:bg-blue-700"
              onClick={() => router.push('/dashboard/quotations/new')}
            >
              + Add enquiry
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
              if (isTerminalEnquiryStage(stage) && stage !== enquiryStage) {
                setPendingClosureStage(stage);
                setClosureOpen(true);
                return;
              }
              await updateQuotationMut.mutateAsync({ id, data: { enquiry_stage: stage } });
            }}
          />

          <EnquiryOutcomeModal
            open={closureOpen}
            onOpenChange={(open) => {
              setClosureOpen(open);
              if (!open) setPendingClosureStage(null);
            }}
            adjustOnly={false}
            presetClosureKind={pendingClosureStage ? closureKindForEnquiryStage(pendingClosureStage) : null}
            currentOutcome={quotation.outcome}
            onConfirm={async (kind, detail) => {
              if (!id) return;
              const data: UpdateQuotationInput = {
                outcome: buildOutcomeString(kind, detail),
                status: closureKindToCrmStatus(kind),
              };
              if (pendingClosureStage) {
                data.enquiry_stage = pendingClosureStage;
              } else {
                data.enquiry_stage = enquiryStageForClosureKind(kind);
              }
              await updateQuotationMut.mutateAsync({ id, data });
            }}
          />

          <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
            <VendorQuoteTable
              quotes={(quotation.quotation_vendor_quotes || []) as VendorQuote[]}
              chosenQuoteId={quotation.chosen_quote_id}
              selectedQuoteId={vendorDetailMode === 'edit' ? editingQuote?.id : null}
              onAdd={() => {
                setEditingQuote(null);
                setVendorDetailMode('add');
              }}
              onEdit={(vq) => {
                setEditingQuote(vq);
                setVendorDetailMode('edit');
              }}
              onDelete={(vq) => setDeleteTarget(vq)}
              onChoose={(vq) => {
                if (!id || vq.id === quotation.chosen_quote_id || vq.is_chosen) return;
                chooseQuoteMut.mutate({ quotation_id: id, vendor_quote_id: vq.id });
              }}
            />

            {vendorDetailMode !== 'none' ? (
              <VendorQuoteDetailSection
                mode={vendorDetailMode === 'add' ? 'add' : 'edit'}
                quotationId={id || undefined}
                customerDisplayName={
                  quotation?.projects?.project_name || quotation?.standalone_project_name || undefined
                }
                initial={editingQuote}
                followups={followups}
                currentUserId={user?.id}
                isSuperAdmin={role === 'super_admin'}
                onClose={() => {
                  setVendorDetailMode('none');
                  setEditingQuote(null);
                }}
                onSubmit={async (payload) => {
                  if (!id) return;
                  if (editingQuote?.id) {
                    await updateQuoteMutation.mutateAsync({ quoteId: editingQuote.id, payload });
                    return;
                  }
                  const created = (await addQuoteMutation.mutateAsync(payload)) as VendorQuote;
                  setEditingQuote(created);
                  setVendorDetailMode('edit');
                }}
                onAddFollowup={() => {
                  if (!editingQuote?.id) return;
                  setFollowupVendorQuoteId(editingQuote.id);
                  setEditingFollowup(null);
                  setFollowupOpen(true);
                }}
                onEditFollowup={(f) => {
                  setFollowupVendorQuoteId(f.vendor_quote_id || editingQuote?.id || null);
                  setEditingFollowup(f);
                  setFollowupOpen(true);
                }}
                onDeleteFollowup={(f) => setDeleteFollowupTarget(f)}
              />
            ) : null}
          </Card>

          <QuotationStatusBar
            quotation={quotation}
            enquiryStage={enquiryStage}
            chosenVendorQuote={chosenVendorQuote}
            onFinalize={isTerminalEnquiryStage(enquiryStage) ? undefined : () => setFinalizeOpen(true)}
            finalizeDisabled={!chosenVendorQuote || updateQuotationMut.isPending}
          />
        </>
      )}

      <FinalizeQuotationModal
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        defaultSendPrice={quotation?.revised_price ?? chosenVendorQuote?.quoted_price ?? null}
        defaultSendCurrency={quotation?.revised_currency ?? chosenVendorQuote?.currency ?? 'INR'}
        onConfirm={async ({ kind, detail, sendPrice, sendCurrency }) => {
          if (!id || !chosenVendorQuote) return;
          const data: UpdateQuotationInput = {
            outcome: buildOutcomeString(kind, detail),
            status: closureKindToCrmStatus(kind),
            enquiry_stage: enquiryStageForClosureKind(kind),
            revised_price: sendPrice,
            revised_currency: sendCurrency,
            clarusto_final_price: chosenVendorQuote.quoted_price ?? undefined,
            clarusto_final_currency: chosenVendorQuote.currency || 'INR',
            clarusto_quote_sent_at: new Date().toISOString(),
          };
          await updateQuotationMut.mutateAsync({ id, data });
        }}
      />

      <FollowUpForm
        open={followupOpen}
        onOpenChange={(open) => {
          setFollowupOpen(open);
          if (!open) {
            setEditingFollowup(null);
            setFollowupVendorQuoteId(null);
          }
        }}
        initial={editingFollowup}
        onSubmit={async (data) => {
          if (!id) return;
          if (editingFollowup?.id) {
            await updateFollowupMut.mutateAsync({
              followupId: editingFollowup.id,
              quotationId: id,
              data,
            });
            return;
          }
          if (!followupVendorQuoteId) return;
          await addFollowupMut.mutateAsync({
            quotation_id: id,
            data: { ...data, vendor_quote_id: followupVendorQuoteId },
          });
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
