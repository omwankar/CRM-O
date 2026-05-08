'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QUOTATION_STATUS_LABELS, type QuotationStatus } from '@/types/quotations';

export function QuotationStatusChangeModal({
  isOpen,
  onClose,
  currentStatus,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: QuotationStatus;
  onConfirm: (status: QuotationStatus) => Promise<void> | void;
}) {
  const [status, setStatus] = useState<QuotationStatus>(currentStatus);
  const options = useMemo(() => Object.keys(QUOTATION_STATUS_LABELS) as QuotationStatus[], []);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change quotation status</DialogTitle>
          <DialogDescription>Update the quotation workflow status.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Status</p>
          <Select value={status} onValueChange={(v) => setStatus(v as QuotationStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {options.map((s) => (
                <SelectItem key={s} value={s}>
                  {QUOTATION_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await onConfirm(status);
              onClose();
            }}
          >
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

