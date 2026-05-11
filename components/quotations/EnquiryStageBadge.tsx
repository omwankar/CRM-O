import { cn } from '@/lib/utils';
import {
  ENQUIRY_STAGE_BADGE_CLASSES,
  ENQUIRY_STAGE_LABELS,
  normalizeEnquiryStage,
  type EnquiryStage,
} from '@/types/quotations';

export function EnquiryStageBadge({
  stage,
  quotation,
  className,
}: {
  stage?: EnquiryStage;
  quotation?: { enquiry_stage?: EnquiryStage | null };
  className?: string;
}) {
  const resolved = stage ?? normalizeEnquiryStage(quotation);
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-tight',
        ENQUIRY_STAGE_BADGE_CLASSES[resolved],
        className,
      )}
    >
      <span className="truncate">{ENQUIRY_STAGE_LABELS[resolved]}</span>
    </span>
  );
}
