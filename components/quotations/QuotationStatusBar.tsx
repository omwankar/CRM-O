'use client';

import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EnquiryStage, Quotation, QuotationStatus, VendorQuote } from '@/types/quotations';
import { ENQUIRY_STAGE_LABELS, isTerminalEnquiryStage } from '@/types/quotations';
import { QuotationOutcomeBadge } from '@/components/quotations/QuotationOutcomeBadge';

function formatCurrency(amount?: number | null, currency?: string | null) {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR' }).format(amount);
  } catch {
    return String(amount);
  }
}

function openStatusPhrase(stage: EnquiryStage): string {
  if (stage === 'quote_sent') return 'Quotation sent';
  return ENQUIRY_STAGE_LABELS[stage];
}

function finalStatusLabel(stage: EnquiryStage, status: QuotationStatus, outcome?: string | null): string {
  if (status === 'approved') {
    return stage === 'won_closed' ? 'Won & Closed' : `Won (${ENQUIRY_STAGE_LABELS[stage]})`;
  }
  if (status === 'rejected') {
    return stage === 'lost_closed' ? 'Lost & Closed' : `Lost (${ENQUIRY_STAGE_LABELS[stage]})`;
  }
  if (status === 'cancelled') {
    return stage === 'lost_closed' ? 'Closed' : `Closed (${ENQUIRY_STAGE_LABELS[stage]})`;
  }

  if (isTerminalEnquiryStage(stage)) {
    if (outcome?.trim()) return ENQUIRY_STAGE_LABELS[stage];
    return `${ENQUIRY_STAGE_LABELS[stage]} — add outcome on the tracker`;
  }

  return `Open (${openStatusPhrase(stage)})`;
}

type Props = {
  quotation: Quotation;
  enquiryStage: EnquiryStage;
  chosenVendorQuote?: VendorQuote | null;
  onFinalize?: () => void;
  finalizeDisabled?: boolean;
};

export function QuotationStatusBar({
  quotation,
  enquiryStage,
  chosenVendorQuote,
  onFinalize,
  finalizeDisabled,
}: Props) {
  const updatedBy =
    quotation.updated_by_user?.full_name?.trim() || quotation.updated_by_user?.email?.trim() || '—';

  const internalPrice = chosenVendorQuote?.quoted_price ?? quotation.clarusto_final_price;
  const internalCurrency = chosenVendorQuote?.currency ?? quotation.clarusto_final_currency;

  return (
    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-5 py-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/25">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/90">
              Final status
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {finalStatusLabel(enquiryStage, quotation.status, quotation.outcome)}
              </p>
            </div>
          </div>
          <div className="lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/90">
              Final price (internal)
            </p>
            <p className="mt-1.5 text-sm font-semibold tabular-nums text-emerald-900/90 dark:text-emerald-100/80">
              {formatCurrency(internalPrice, internalCurrency)}
            </p>
          </div>
          <div className="lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/90">
              Send price (customer)
            </p>
            <p className="mt-1.5 text-sm font-semibold tabular-nums text-emerald-900/90 dark:text-emerald-100/80">
              {formatCurrency(quotation.revised_price, quotation.revised_currency)}
            </p>
          </div>
          <div className="lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/90">
              Last updated by
            </p>
            <p className="mt-1.5 text-sm font-medium text-emerald-900/90 dark:text-emerald-100/80">{updatedBy}</p>
          </div>
          <div className="lg:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/90">
              Last updated on
            </p>
            <p className="mt-1.5 text-xs font-medium tabular-nums text-emerald-900/90 dark:text-emerald-100/80">
              {quotation.updated_at ? new Date(quotation.updated_at).toLocaleString() : '—'}
            </p>
          </div>
          <div className="lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/90">
              Outcome
            </p>
            <div className="mt-1.5">
              <QuotationOutcomeBadge outcome={quotation.outcome} />
            </div>
          </div>
        </div>

        {onFinalize ? (
          <Button
            type="button"
            className="h-10 shrink-0 bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800"
            disabled={finalizeDisabled}
            onClick={onFinalize}
          >
            Finalize quotation
          </Button>
        ) : null}
      </div>
    </div>
  );
}
