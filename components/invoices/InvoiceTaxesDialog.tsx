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
import { Plus, Trash2 } from 'lucide-react';
import type { TaxDraft } from '@/components/invoices/InvoiceForm';

function emptyTax(): TaxDraft {
  return { rate: '', name: '', tax_number: '', enabled: true };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taxes: TaxDraft[];
  onApply: (taxes: TaxDraft[]) => void;
};

export function InvoiceTaxesDialog({ open, onOpenChange, taxes, onApply }: Props) {
  const [draft, setDraft] = useState<TaxDraft[]>(taxes.length ? taxes : [emptyTax()]);

  useEffect(() => {
    if (open) setDraft(taxes.length ? taxes.map((t) => ({ ...t })) : [emptyTax()]);
  }, [open, taxes]);

  const setTax = (i: number, patch: Partial<TaxDraft>) => {
    const next = [...draft];
    next[i] = { ...next[i], ...patch };
    setDraft(next);
  };

  const apply = () => {
    const cleaned = draft
      .filter((t) => t.enabled !== false)
      .map((t) => ({
        ...t,
        rate: t.rate.trim(),
        name: t.name.trim() || t.rate.trim(),
        tax_number: t.tax_number?.trim() || '',
        enabled: true,
      }))
      .filter((t) => t.rate !== '' && Number(t.rate) > 0);
    onApply(cleaned);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Taxes</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {draft.map((tax, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-end border-b border-border pb-3 last:border-0"
            >
              <input
                type="checkbox"
                className="h-4 w-4 mb-2"
                checked={tax.enabled !== false}
                onChange={(e) => setTax(i, { enabled: e.target.checked })}
                aria-label="Apply tax"
              />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Rate</label>
                <div className="flex">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={tax.rate}
                    onChange={(e) => {
                      const rate = e.target.value;
                      setTax(i, {
                        rate,
                        name: tax.name === tax.rate || !tax.name ? rate : tax.name,
                      });
                    }}
                    placeholder="20"
                    className="rounded-r-none"
                  />
                  <span className="inline-flex items-center px-3 border border-l-0 border-input rounded-r-md bg-muted text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tax Name</label>
                <Input
                  value={tax.name}
                  onChange={(e) => setTax(i, { name: e.target.value })}
                  placeholder="VAT"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tax Number (Optional)</label>
                <Input
                  value={tax.tax_number}
                  onChange={(e) => setTax(i, { tax_number: e.target.value })}
                  placeholder="472 8989 25"
                />
              </div>
              {draft.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setDraft(draft.filter((_, j) => j !== i))}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setDraft([...draft, emptyTax()])}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add another Tax
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={apply}>
            Apply Taxes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
