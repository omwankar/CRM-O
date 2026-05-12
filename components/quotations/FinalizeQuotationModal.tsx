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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ClosureKind, QuotationCurrency } from '@/types/quotations';
import { QUOTATION_CURRENCIES } from '@/types/quotations';
import { ClosureOutcomePicker } from '@/components/quotations/ClosureOutcomePicker';
import { notifyQuotationError } from '@/lib/quotation-notify';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSendPrice?: number | null;
  defaultSendCurrency?: string | null;
  onConfirm: (payload: {
    kind: ClosureKind;
    detail: string;
    sendPrice: number;
    sendCurrency: string;
  }) => Promise<void> | void;
};

export function FinalizeQuotationModal({
  open,
  onOpenChange,
  defaultSendPrice,
  defaultSendCurrency,
  onConfirm,
}: Props) {
  const [kind, setKind] = useState<ClosureKind | null>(null);
  const [detail, setDetail] = useState('');
  const [sendPrice, setSendPrice] = useState('');
  const [sendCurrency, setSendCurrency] = useState<QuotationCurrency>('INR');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind(null);
    setDetail('');
    setSendPrice(defaultSendPrice == null ? '' : String(defaultSendPrice));
    setSendCurrency((defaultSendCurrency as QuotationCurrency) || 'INR');
  }, [open, defaultSendPrice, defaultSendCurrency]);

  const submit = async () => {
    if (!kind) return;
    const price = Number(sendPrice);
    if (sendPrice.trim() === '' || Number.isNaN(price) || price < 0) {
      notifyQuotationError('Enter a valid send price for the customer.');
      return;
    }

    setSaving(true);
    try {
      await onConfirm({
        kind,
        detail,
        sendPrice: price,
        sendCurrency,
      });
      onOpenChange(false);
    } catch (e) {
      notifyQuotationError(e, 'Could not finalize this quotation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalize quotation</DialogTitle>
          <DialogDescription>
            Choose the outcome, confirm the price sent to the customer, and close this enquiry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <Label className="text-sm font-medium">Outcome</Label>
            <div className="mt-2">
              <ClosureOutcomePicker value={kind} onChange={setKind} disabled={saving} />
            </div>
          </div>

          <div>
            <Label htmlFor="finalize-send-price">Send price (customer)</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="finalize-send-price"
                type="number"
                step="0.01"
                min="0"
                disabled={saving}
                value={sendPrice}
                onChange={(e) => setSendPrice(e.target.value)}
              />
              <select
                className="h-10 w-[5.5rem] shrink-0 rounded-lg border border-border bg-background px-2 text-sm"
                disabled={saving}
                value={sendCurrency}
                onChange={(e) => setSendCurrency(e.target.value as QuotationCurrency)}
              >
                {QUOTATION_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="finalize-detail">Details (optional)</Label>
            <Textarea
              id="finalize-detail"
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
          <Button type="button" disabled={saving || !kind} onClick={submit}>
            {saving ? 'Saving…' : 'Finalize'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
