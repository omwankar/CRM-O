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
import {
  ENQUIRY_STAGE_LABELS,
  ENQUIRY_STAGES_ORDER,
  normalizeEnquiryStage,
  isTerminalEnquiryStage,
  closureKindForEnquiryStage,
  buildOutcomeString,
  closureKindToCrmStatus,
  type EnquiryStage,
  type UpdateQuotationInput,
} from '@/types/quotations';
import { notifyQuotationError } from '@/lib/quotation-notify';

export function EnquiryStageChangeModal({
  isOpen,
  onClose,
  quotation,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  quotation: { enquiry_stage?: EnquiryStage | null; outcome?: string | null } | null;
  onConfirm: (patch: UpdateQuotationInput) => Promise<void> | void;
}) {
  const previousStage = normalizeEnquiryStage(quotation);
  const [stage, setStage] = useState<EnquiryStage>(previousStage);
  const [closureDetail, setClosureDetail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStage(normalizeEnquiryStage(quotation));
    setClosureDetail('');
  }, [isOpen, quotation]);

  const needsClosure =
    isTerminalEnquiryStage(stage) && (!isTerminalEnquiryStage(previousStage) || stage !== previousStage);

  const save = async () => {
    const patch: UpdateQuotationInput = { enquiry_stage: stage };
    if (needsClosure) {
      const kind = closureKindForEnquiryStage(stage);
      if (!kind) {
        notifyQuotationError('Choose Won & Closed or Lost & Closed.');
        return;
      }
      patch.outcome = buildOutcomeString(kind, closureDetail);
      patch.status = closureKindToCrmStatus(kind);
    }
    setSaving(true);
    try {
      await onConfirm(patch);
      onClose();
    } catch (error) {
      notifyQuotationError(error, 'Could not update enquiry stage.');
    } finally {
      setSaving(false);
    }
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
          <DialogDescription>Same workflow as the quotation tracker. Closing requires an outcome.</DialogDescription>
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
            <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 dark:bg-amber-950/20">
              <p className="text-sm font-medium text-foreground">Outcome: {ENQUIRY_STAGE_LABELS[stage]}</p>
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
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? 'Updating…' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
