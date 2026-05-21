'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { getBuyers } from '@/lib/api/buyers';
import { Loader2 } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationNumber: string;
  defaultBuyerId?: string | null;
  onConfirm: (buyerId: string) => Promise<void>;
};

export function CreateInvoiceFromQuotationDialog({
  open,
  onOpenChange,
  quotationNumber,
  defaultBuyerId,
  onConfirm,
}: Props) {
  const [buyerId, setBuyerId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: buyersData, isLoading } = useQuery({
    queryKey: ['buyers-invoice-from-quote'],
    queryFn: () => getBuyers({ limit: 200 }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setBuyerId(defaultBuyerId || '');
  }, [open, defaultBuyerId]);

  const submit = async () => {
    if (!buyerId) return;
    setSaving(true);
    try {
      await onConfirm(buyerId);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const buyers = buyersData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create invoice from quotation</DialogTitle>
          <DialogDescription>
            Draft invoice for <span className="font-mono font-medium">{quotationNumber}</span> will be linked to this
            quote and prefilled with the customer price.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="inv-buyer">Buyer (bill to)</Label>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <select
              id="inv-buyer"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
            >
              <option value="">Select buyer…</option>
              {buyers.map((b: { id: string; buyer_name: string }) => (
                <option key={b.id} value={b.id}>
                  {b.buyer_name}
                </option>
              ))}
            </select>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !buyerId}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create draft invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
