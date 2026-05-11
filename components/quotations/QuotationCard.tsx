import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { EnquiryStageBadge } from '@/components/quotations/EnquiryStageBadge';
import { PriorityBadge } from '@/components/quotations/PriorityBadge';
import type { Quotation } from '@/types/quotations';
import { ChevronRight, Calendar, Users, Briefcase, Building2 } from 'lucide-react';

function formatCurrency(amount?: number | null, currency?: string | null) {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR' }).format(amount);
  } catch {
    return String(amount);
  }
}

export function QuotationCard({
  quotation,
  canChangeEnquiryStage,
  onChangeEnquiryStage,
}: {
  quotation: Quotation & any;
  canChangeEnquiryStage?: boolean;
  onChangeEnquiryStage?: (q: Quotation) => void;
}) {
  const router = useRouter();

  const requirement = String(quotation.requirement || '');
  const vendorsCount =
    typeof quotation.vendor_quotes_count === 'number'
      ? quotation.vendor_quotes_count
      : (quotation.quotation_vendor_quotes || []).length;

  return (
    <Card
      className="surface-card p-5 cursor-pointer transition-all duration-150 hover:border-border/60 active:scale-[0.98]"
      onClick={() => router.push(`/dashboard/quotations/${quotation.id}`)}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-medium text-foreground mb-1 truncate">
              {requirement.length > 60 ? `${requirement.slice(0, 60)}…` : requirement}
            </h3>
            <code className="text-[11px] text-muted-foreground">{quotation.quotation_number}</code>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <PriorityBadge priority={quotation.priority} />
            {canChangeEnquiryStage && onChangeEnquiryStage ? (
              <button
                type="button"
                className="max-w-[min(100%,12rem)] text-right hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeEnquiryStage(quotation as Quotation);
                }}
                title="Change enquiry stage"
              >
                <EnquiryStageBadge quotation={quotation} />
              </button>
            ) : (
              <EnquiryStageBadge quotation={quotation} />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[12px] text-muted-foreground flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>Lead:</span> {quotation.users?.full_name || '—'}
          </p>
          <p className="text-[12px] text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5" />
            <span>Project:</span>{' '}
            {quotation.projects?.project_name ||
              quotation.standalone_project_name ||
              (quotation.project_id ? 'Linked' : '—')}
          </p>
          {!quotation.project_id && (
            <p className="text-[12px] text-muted-foreground flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              <span>Budget:</span> {formatCurrency(quotation.client_budget, quotation.client_currency)}
            </p>
          )}
          <p className="text-[12px] text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>Deadline:</span>{' '}
            {quotation.deadline ? new Date(quotation.deadline).toLocaleDateString() : '—'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground">
            Vendors contacted: <span className="font-medium text-foreground tabular-nums">{vendorsCount}</span>
          </p>
          <Button
            variant="ghost"
            className="h-8 px-3 justify-between group"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/quotations/${quotation.id}`);
            }}
          >
            <span className="text-[13px]">View</span>
            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
