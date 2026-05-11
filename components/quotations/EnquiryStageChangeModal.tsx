'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClosureOutcomePicker } from '@/components/quotations/ClosureOutcomePicker';
import {
  ENQUIRY_STAGE_LABELS,
  ENQUIRY_STAGES_ORDER,
  normalizeEnquiryStage,
  buildOutcomeString,
  closureKindToCrmStatus,
  type ClosureKind,
  type EnquiryStage,
  type UpdateQuotationInput,
} from '@/types/quotations';

export function EnquiryStageChangeModal({
  isOpen,
  onClose,
  quotation,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  quotation: { enquiry_stage?: EnquiryStage | null } | null;
  onConfirm: (patch: UpdateQuotationInput) => Promise<void> | void;
}) {
  const previousStage = normalizeEnquiryStage(quotation);
  const [stage, setStage] = useState<EnquiryStage>(previousStage);
  const [closureKind, setClosureKind] = useState<ClosureKind | null>(null);
  const [closureDetail, setClosureDetail] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setStage(normalizeEnquiryStage(quotation));
    setClosureKind(null);
    setClosureDetail('');
  }, [isOpen, quotation]);

  const needsClosure = stage === 'won_lost_closed' && previousStage !== 'won_lost_closed';

  const save = async () => {
    const patch: UpdateQuotationInput = { enquiry_stage: stage };
    if (needsClosure) {
      if (!closureKind) {
        alert('Choose Won, Lost, or Closed before saving.');
        return;
      }
      patch.outcome = buildOutcomeString(closureKind, closureDetail);
      patch.status = closureKindToCrmStatus(closureKind);
    }
    await onConfirm(patch);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change enquiry stage</DialogTitle>
          <DialogDescription>Same workflow as the quotation tracker. Closing an enquiry requires an outcome.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Enquiry stage</p>
            <Select value={stage} onValueChange={(v) => setStage(v as EnquiryStage)}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent className="z-[120]">
                {ENQUIRY_STAGES_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ENQUIRY_STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsClosure ? (
            <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 dark:bg-amber-950/20">
              <p className="text-sm font-medium text-foreground">How did this enquiry end?</p>
              <ClosureOutcomePicker value={closureKind} onChange={setClosureKind} />
              <div>
                <Label htmlFor="card-closure-detail" className="text-xs text-muted-foreground">
                  Details (optional)
                </Label>
                <Textarea
                  id="card-closure-detail"
                  className="mt-1.5"
                  rows={2}
                  placeholder="e.g. PO number, reason…"
                  value={closureDetail}
                  onChange={(e) => setClosureDetail(e.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={save}>
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
