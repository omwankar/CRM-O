'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { VendorQuote } from '@/types/quotations';
import { getVendors } from '@/lib/api/vendors';

type VendorLite = { id: string; vendor_name: string };

export function VendorQuoteForm({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<VendorQuote> | null;
  onSubmit: (data: {
    vendor_id?: string;
    vendor_name?: string;
    email_sent_to: string;
    email_sent_at?: string;
    quoted_price?: number;
    currency?: string;
    quote_received_at?: string;
    notes?: string;
  }) => Promise<void> | void;
}) {
  const [vendors, setVendors] = useState<VendorLite[]>([]);
  const [vendorMode, setVendorMode] = useState<'select' | 'manual'>('select');

  const defaults = useMemo(() => {
    return {
      vendor_id: initial?.vendor_id || '',
      vendor_name: initial?.vendor_name || '',
      email_sent_to: initial?.email_sent_to || '',
      email_sent_at: initial?.email_sent_at ? initial.email_sent_at.slice(0, 16) : '',
      quoted_price: initial?.quoted_price ?? '',
      currency: initial?.currency || 'INR',
      quote_received_at: initial?.quote_received_at ? initial.quote_received_at.slice(0, 16) : '',
      notes: initial?.notes || '',
    };
  }, [initial]);

  const [form, setForm] = useState(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(defaults);
  }, [defaults, open]);

  const loadVendors = async () => {
    if (vendors.length) return;
    const res = await getVendors({ limit: 100 });
    setVendors((res?.data || []).map((v: any) => ({ id: v.id, vendor_name: v.vendor_name })));
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({
        vendor_id: vendorMode === 'select' ? (form.vendor_id || undefined) : undefined,
        vendor_name: vendorMode === 'manual' ? (form.vendor_name || undefined) : undefined,
        email_sent_to: form.email_sent_to,
        email_sent_at: form.email_sent_at ? new Date(form.email_sent_at).toISOString() : undefined,
        quoted_price: form.quoted_price === '' ? undefined : Number(form.quoted_price),
        currency: form.currency || 'INR',
        quote_received_at: form.quote_received_at ? new Date(form.quote_received_at).toISOString() : undefined,
        notes: form.notes || undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{initial?.id ? 'Edit Vendor Quote' : 'Add Vendor Quote'}</SheetTitle>
          <SheetDescription>Capture vendor outreach and quote details.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-2">
          <div>
            <Label>Vendor</Label>
            <div className="flex items-center gap-2 mt-2">
              <Button
                type="button"
                variant={vendorMode === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVendorMode('select')}
              >
                Select
              </Button>
              <Button
                type="button"
                variant={vendorMode === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVendorMode('manual')}
              >
                Type Name
              </Button>
            </div>
            {vendorMode === 'select' ? (
              <select
                className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                value={form.vendor_id}
                onFocus={loadVendors}
                onChange={(e) => setForm((s) => ({ ...s, vendor_id: e.target.value }))}
              >
                <option value="">Select vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                className="mt-2"
                placeholder="Vendor name"
                value={form.vendor_name}
                onChange={(e) => setForm((s) => ({ ...s, vendor_name: e.target.value }))}
              />
            )}
          </div>

          <div>
            <Label>Email Sent To *</Label>
            <Input
              type="email"
              className="mt-2"
              placeholder="vendor@email.com"
              value={form.email_sent_to}
              onChange={(e) => setForm((s) => ({ ...s, email_sent_to: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>Email Sent At</Label>
              <Input
                type="datetime-local"
                className="mt-2"
                value={form.email_sent_at}
                onChange={(e) => setForm((s) => ({ ...s, email_sent_at: e.target.value }))}
              />
            </div>
            <div>
              <Label>Quote Received At</Label>
              <Input
                type="datetime-local"
                className="mt-2"
                value={form.quote_received_at}
                onChange={(e) => setForm((s) => ({ ...s, quote_received_at: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>Quoted Price</Label>
              <Input
                type="number"
                step="0.01"
                className="mt-2"
                value={form.quoted_price}
                onChange={(e) => setForm((s) => ({ ...s, quoted_price: e.target.value }))}
              />
            </div>
            <div>
              <Label>Currency</Label>
              <select
                className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                value={form.currency}
                onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value }))}
              >
                {['INR', 'USD', 'EUR', 'AED'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              className="mt-2"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>
        </div>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={saving || !form.email_sent_to}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

