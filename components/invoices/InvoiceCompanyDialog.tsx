'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getInvoiceCompanySettings,
  updateInvoiceCompanySettings,
  type InvoiceCompanySettings,
} from '@/lib/api/invoices';
import {
  DEFAULT_INVOICE_COMPANY,
  saveInvoiceCompanyToStorage,
} from '@/lib/invoiceCompanyStorage';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: InvoiceCompanySettings | null;
  onSaved: (settings: InvoiceCompanySettings) => void;
};

export function InvoiceCompanyDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const [form, setForm] = useState<InvoiceCompanySettings>(DEFAULT_INVOICE_COMPANY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm(initial);
      return;
    }
    getInvoiceCompanySettings()
      .then(setForm)
      .catch(() => setForm(DEFAULT_INVOICE_COMPANY));
  }, [open, initial]);

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      phone: form.phone?.trim() || '',
      address: form.address?.trim() || '',
      vat_number: form.vat_number?.trim() || '',
    };
    setSaving(true);
    saveInvoiceCompanyToStorage(payload);
    onSaved(payload);
    try {
      await updateInvoiceCompanySettings(payload);
      toast.success('Business information saved');
    } catch {
      toast.success('Saved on this device (run migration 024 to sync to server)');
    } finally {
      setSaving(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Business Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Company name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Phone</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Address</label>
            <Textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={4}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">VAT / Tax number (optional)</label>
            <Input value={form.vat_number} onChange={(e) => setForm({ ...form, vat_number: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
