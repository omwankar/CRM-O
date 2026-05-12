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
import type { ClosureKind } from '@/types/quotations';
import { CLOSURE_KIND_LABELS, parseClosureKindFromOutcome } from '@/types/quotations';
import { ClosureOutcomePicker } from '@/components/quotations/ClosureOutcomePicker';
import { notifyQuotationError } from '@/lib/quotation-notify';

export function EnquiryOutcomeModal({
  open,
  onOpenChange,
  adjustOnly,
  presetClosureKind,
  currentOutcome,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjustOnly: boolean;
  presetClosureKind?: ClosureKind | null;
  currentOutcome?: string | null;
  onConfirm: (kind: ClosureKind, detail: string) => Promise<void> | void;
}) {
  const [kind, setKind] = useState<ClosureKind | null>(null);
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const parsed = presetClosureKind ?? parseClosureKindFromOutcome(currentOutcome);
    setKind(parsed || null);
    setDetail('');
  }, [open, currentOutcome, presetClosureKind]);

  const title = adjustOnly ? 'Update outcome' : 'Close this enquiry';
  const description = adjustOnly
    ? 'Pick Won, Lost, or Closed again and optional notes.'
    : presetClosureKind
      ? `Confirm ${CLOSURE_KIND_LABELS[presetClosureKind]} and add optional details.`
      : 'Choose how this enquiry ended.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {presetClosureKind ? (
            <p className="text-sm font-semibold text-foreground">Outcome: {CLOSURE_KIND_LABELS[presetClosureKind]}</p>
          ) : (
            <ClosureOutcomePicker value={kind} onChange={setKind} disabled={saving} />
          )}
          <div>
            <Label htmlFor="closure-detail">Details (optional)</Label>
            <Textarea
              id="closure-detail"
              className="mt-1.5"
              rows={3}
              placeholder="e.g. PO number, reason, next steps…"
              value={detail}
              disabled={saving}
              onChange={(e) => setDetail(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || !(presetClosureKind || kind)}
            onClick={async () => {
              const resolved = presetClosureKind || kind;
              if (!resolved) return;
              setSaving(true);
              try {
                await onConfirm(resolved, detail);
                onOpenChange(false);
              } catch (e) {
                notifyQuotationError(e, 'Could not save. Please try again.');
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
