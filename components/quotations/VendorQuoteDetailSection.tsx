'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { QuotationFollowup, VendorQuote } from '@/types/quotations';
import { QUOTATION_CURRENCIES } from '@/types/quotations';
import { getVendors } from '@/lib/api/vendors';
import { supabase } from '@/lib/auth';
import { Upload, FileText, X } from 'lucide-react';
import { FollowUpTable } from '@/components/quotations/FollowUpTable';
import { notifyQuotationError } from '@/lib/quotation-notify';

type VendorLite = { id: string; vendor_name: string; contact_email?: string | null };

const QUOTE_FILE_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp';

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 120);
}

type Props = {
  mode: 'add' | 'edit';
  quotationId?: string;
  customerDisplayName?: string | null;
  initial?: Partial<VendorQuote> | null;
  followups: QuotationFollowup[];
  currentUserId?: string;
  isSuperAdmin?: boolean;
  onClose: () => void;
  onSubmit: (data: {
    vendor_id?: string;
    vendor_name?: string;
    email_sent_to: string;
    email_sent_at?: string;
    quoted_price?: number;
    currency?: string;
    quote_received_at?: string;
    notes?: string;
    validity_date?: string;
    quote_file_url?: string;
  }) => Promise<void> | void;
  onAddFollowup: () => void;
  onEditFollowup: (f: QuotationFollowup) => void;
  onDeleteFollowup: (f: QuotationFollowup) => void;
};

export function VendorQuoteDetailSection({
  mode,
  quotationId,
  customerDisplayName,
  initial,
  followups,
  currentUserId,
  isSuperAdmin,
  onClose,
  onSubmit,
  onAddFollowup,
  onEditFollowup,
  onDeleteFollowup,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vendorQuoteId = initial?.id ?? null;
  const vendorFollowups = useMemo(
    () => (vendorQuoteId ? followups.filter((f) => f.vendor_quote_id === vendorQuoteId) : []),
    [followups, vendorQuoteId],
  );
  const [vendors, setVendors] = useState<VendorLite[]>([]);
  const [vendorMode, setVendorMode] = useState<'select' | 'manual'>(
    initial?.vendor_id ? 'select' : initial?.vendor_name ? 'manual' : 'select',
  );
  const [uploadingFile, setUploadingFile] = useState(false);

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
      validity_date: initial?.validity_date ? String(initial.validity_date).slice(0, 10) : '',
      quote_file_url: initial?.quote_file_url || '',
    };
  }, [initial]);

  const [form, setForm] = useState(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(defaults);
    if (initial?.vendor_id) {
      setVendorMode('select');
    } else if (initial?.vendor_name) {
      setVendorMode('manual');
    }
  }, [defaults, initial?.vendor_id, initial?.vendor_name]);

  const loadVendors = async () => {
    if (vendors.length) return;
    const res = await getVendors({ limit: 100 });
    setVendors(
      (res?.data || []).map((v: { id: string; vendor_name: string; contact_email?: string | null }) => ({
        id: v.id,
        vendor_name: v.vendor_name,
        contact_email: v.contact_email,
      })),
    );
  };

  const handleQuoteFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !quotationId) {
      if (!quotationId) {
        notifyQuotationError('Missing enquiry id. Refresh the page and try again.');
      }
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      notifyQuotationError('File is too large (max 20 MB).');
      return;
    }

    setUploadingFile(true);
    try {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'pdf';
      const path = `quotation-vendor-quotes/${quotationId}/${Date.now()}-${sanitizeFileName(file.name) || `quote.${ext}`}`;

      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from('documents').getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      if (!publicUrl) throw new Error('No public URL returned');

      setForm((s) => ({ ...s, quote_file_url: publicUrl }));
    } catch (err) {
      notifyQuotationError(err, 'Upload failed. Check storage permissions or paste a public file URL instead.');
    } finally {
      setUploadingFile(false);
    }
  };

  const submit = async () => {
    const price = form.quoted_price === '' ? undefined : Number(form.quoted_price);
    if (price != null && (Number.isNaN(price) || price < 0)) {
      notifyQuotationError('Quoted price (total) cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        vendor_id: vendorMode === 'select' ? (form.vendor_id || undefined) : undefined,
        vendor_name: vendorMode === 'manual' ? (form.vendor_name || undefined) : undefined,
        email_sent_to: form.email_sent_to,
        email_sent_at: form.email_sent_at ? new Date(form.email_sent_at).toISOString() : undefined,
        quoted_price: price,
        currency: form.currency || 'INR',
        quote_received_at: form.quote_received_at ? new Date(form.quote_received_at).toISOString() : undefined,
        notes: form.notes || undefined,
        validity_date: form.validity_date || undefined,
        quote_file_url: form.quote_file_url?.trim() || undefined,
      });
    } catch (err) {
      notifyQuotationError(err, 'Could not save this company quotation.');
    } finally {
      setSaving(false);
    }
  };

  const vendorLabel =
    initial?.vendor_name || initial?.vendors?.vendor_name || (mode === 'add' ? 'New company quotation' : 'Vendor details');

  return (
    <div className="mt-5 rounded-xl border border-border/80 bg-muted/10">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 px-4 py-3 sm:px-5">
        <div className="min-w-0 space-y-0.5">
          <h4 className="text-sm font-semibold text-foreground">
            {mode === 'add' ? 'Add company quotation' : 'Vendor details'}
          </h4>
          <p className="text-xs text-muted-foreground">
            {mode === 'add' ? 'Capture vendor outreach and quote details.' : vendorLabel}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose} aria-label="Close vendor details">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div
          className={
            customerDisplayName
              ? 'rounded-lg border border-border bg-background/80 px-3 py-2 text-sm'
              : 'rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-200/90'
          }
        >
          <span className="text-muted-foreground">Customer </span>
          <span className="font-medium text-foreground">{customerDisplayName || 'Not set — add on tracker'}</span>
        </div>

        <div>
          <Label>Vendor</Label>
          <div className="mt-2 flex items-center gap-2">
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
              onChange={(e) => {
                const vendorId = e.target.value;
                const vendor = vendors.find((v) => v.id === vendorId);
                setForm((s) => ({
                  ...s,
                  vendor_id: vendorId,
                  email_sent_to: vendor?.contact_email?.trim() || s.email_sent_to,
                }));
              }}
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <div>
          <Label>Validity Date</Label>
          <Input
            type="date"
            className="mt-2"
            value={form.validity_date}
            onChange={(e) => setForm((s) => ({ ...s, validity_date: e.target.value }))}
          />
        </div>

        <div>
          <Label>Quote file</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload to storage (PDF or image) or paste a public link below.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={QUOTE_FILE_ACCEPT}
            className="sr-only"
            disabled={uploadingFile || !quotationId}
            onChange={handleQuoteFileUpload}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingFile || !quotationId}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadingFile ? 'Uploading…' : 'Upload file'}
            </Button>
            {form.quote_file_url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setForm((s) => ({ ...s, quote_file_url: '' }))}
              >
                <X className="mr-1 h-4 w-4" />
                Clear file
              </Button>
            ) : null}
          </div>
          {form.quote_file_url ? (
            <a
              href={form.quote_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-blue-500 hover:underline"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{form.quote_file_url}</span>
            </a>
          ) : null}
          <Input
            className="mt-3"
            placeholder="Or paste file URL (https://…)"
            value={form.quote_file_url}
            onChange={(e) => setForm((s) => ({ ...s, quote_file_url: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
                <Label>Quoted price (total)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
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
              {QUOTATION_CURRENCIES.map((c) => (
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

        <div className="flex flex-wrap justify-end gap-2 border-t border-border/80 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving || uploadingFile}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={saving || uploadingFile || !form.email_sent_to}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="border-t border-border/80 px-4 py-4 sm:px-5">
        <FollowUpTable
          followups={vendorFollowups}
          currentUserId={currentUserId}
          isSuperAdmin={isSuperAdmin}
          onAdd={vendorQuoteId ? onAddFollowup : undefined}
          onEdit={onEditFollowup}
          onDelete={onDeleteFollowup}
          emptyMessage={
            vendorQuoteId ? 'No follow-ups for this vendor yet.' : 'Save this company quotation to start logging follow-ups.'
          }
          addHint={
            vendorQuoteId
              ? 'Follow-ups here are only for this vendor quotation.'
              : 'Follow-ups are linked to each saved company quotation.'
          }
        />
      </div>
    </div>
  );
}
