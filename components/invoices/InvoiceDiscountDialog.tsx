'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DiscountDraft } from '@/components/invoices/InvoiceForm';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount: DiscountDraft | null;
  onApply: (discount: DiscountDraft | null) => void;
};

export function InvoiceDiscountDialog({ open, onOpenChange, discount, onApply }: Props) {
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      setType(discount?.type ?? 'percent');
      setValue(discount?.value ?? '');
    }
  }, [open, discount]);

  const apply = () => {
    const n = Number(value);
    if (!value.trim() || Number.isNaN(n) || n <= 0) {
      onApply(null);
    } else {
      onApply({ type, value: String(n) });
    }
    onOpenChange(false);
  };

  const clear = () => {
    onApply(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Discount</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'percent' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setType('percent')}
            >
              Percentage %
            </Button>
            <Button
              type="button"
              variant={type === 'fixed' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setType('fixed')}
            >
              Fixed amount
            </Button>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              {type === 'percent' ? 'Discount %' : 'Discount amount'}
            </label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'percent' ? '10' : '100.00'}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={clear}>
            Remove discount
          </Button>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={apply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
