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
import { parseClosureKindFromOutcome } from '@/types/quotations';
import { ClosureOutcomePicker } from '@/components/quotations/ClosureOutcomePicker';

export function EnquiryOutcomeModal({
  open,
  onOpenChange,
  adjustOnly,
  currentOutcome,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If true, only updates outcome + CRM status (enquiry already at Won/Lost/Closed) */
  adjustOnly: boolean;
  currentOutcome?: string | null;
  onConfirm: (kind: ClosureKind, detail: string) => Promise<void> | void;
}) {
  const [kind, setKind] = useState<ClosureKind | null>(null);
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const parsed = parseClosureKindFromOutcome(currentOutcome);
    setKind(parsed || null);
    setDetail('');
  }, [open, currentOutcome]);

  const title = adjustOnly ? 'Update outcome' : 'Close this enquiry';
  const description = adjustOnly
    ? 'Pick Won, Lost, or Closed again and optional notes.'
    : 'You moved the workflow to Won / Lost / Closed. Which result applies?';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <ClosureOutcomePicker value={kind} onChange={setKind} disabled={saving} />
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
            disabled={saving || !kind}
            onClick={async () => {
              if (!kind) return;
              setSaving(true);
              try {
                await onConfirm(kind, detail);
                onOpenChange(false);
              } catch (e) {
                console.error(e);
                alert('Could not save. Please try again.');
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
