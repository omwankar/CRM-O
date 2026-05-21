'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { INVOICE_CURRENCIES, type InvoiceCurrency } from '@/types/invoices';
import { Plus, Trash2 } from 'lucide-react';

export type LineDraft = { description: string; quantity: string; unit_price: string };

export type InvoiceFormValues = {
  buyer_id: string;
  issue_date: string;
  due_date: string;
  currency: InvoiceCurrency;
  tax_rate: string;
  notes: string;
  terms: string;
  line_items: LineDraft[];
};

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function emptyInvoiceForm(): InvoiceFormValues {
  return {
    buyer_id: '',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: defaultDueDate(),
    currency: 'INR',
    tax_rate: '0',
    notes: '',
    terms: 'Any disputes should be emailed to accounts@clarustologistics.com',
    line_items: [{ description: '', quantity: '1', unit_price: '0' }],
  };
}

type Props = {
  value: InvoiceFormValues;
  onChange: (v: InvoiceFormValues) => void;
  buyers: Array<{ id: string; buyer_name: string; contact_email?: string | null }>;
  disabled?: boolean;
};

export function InvoiceForm({ value, onChange, buyers, disabled }: Props) {
  const totals = useMemo(() => {
    const lines = value.line_items.map((l) => ({
      quantity: Number(l.quantity) || 0,
      unit_price: Number(l.unit_price) || 0,
    }));
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const taxRate = Number(value.tax_rate) || 0;
    const tax = subtotal * (taxRate / 100);
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round((subtotal + tax) * 100) / 100,
    };
  }, [value.line_items, value.tax_rate]);

  const setLine = (index: number, patch: Partial<LineDraft>) => {
    const next = [...value.line_items];
    next[index] = { ...next[index], ...patch };
    onChange({ ...value, line_items: next });
  };

  const selectedBuyer = buyers.find((b) => b.id === value.buyer_id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Buyer *</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3"
            value={value.buyer_id}
            onChange={(e) => onChange({ ...value, buyer_id: e.target.value })}
            disabled={disabled}
            required
          >
            <option value="">Select buyer</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.buyer_name}
                {b.contact_email ? ` (${b.contact_email})` : ''}
              </option>
            ))}
          </select>
          {selectedBuyer && !selectedBuyer.contact_email && (
            <p className="text-xs text-amber-600 mt-1">No email on buyer — add one before sending.</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">Currency</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3"
              value={value.currency}
              onChange={(e) => onChange({ ...value, currency: e.target.value as InvoiceCurrency })}
              disabled={disabled}
            >
              {INVOICE_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Tax %</label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={value.tax_rate}
              onChange={(e) => onChange({ ...value, tax_rate: e.target.value })}
              disabled={disabled}
              placeholder="e.g. 15"
            />
            <p className="text-xs text-muted-foreground mt-1">Percentage from 0 to 100 (e.g. 15 for 15% VAT)</p>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Issue date</label>
          <Input
            type="date"
            value={value.issue_date}
            onChange={(e) => onChange({ ...value, issue_date: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Due date *</label>
          <Input
            type="date"
            value={value.due_date}
            onChange={(e) => onChange({ ...value, due_date: e.target.value })}
            disabled={disabled}
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Line items</h3>
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  ...value,
                  line_items: [...value.line_items, { description: '', quantity: '1', unit_price: '0' }],
                })
              }
            >
              <Plus className="w-4 h-4 mr-1" />
              Add line
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {value.line_items.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-6">
                <Input
                  placeholder="e.g. Port Dues | AT ACTUAL  or  Fasah Charges | AT ACTUAL | +15% (+15% shows under Rate)"
                  value={line.description}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="Qty"
                  value={line.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Unit price"
                  value={line.unit_price}
                  onChange={(e) => setLine(i, { unit_price: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                {!disabled && value.line_items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => onChange({ ...value, line_items: value.line_items.filter((_, j) => j !== i) })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right text-sm space-y-1">
          <p>Subtotal: {totals.subtotal.toFixed(2)}</p>
          <p>Tax: {totals.tax.toFixed(2)}</p>
          <p className="font-bold text-lg">Total: {totals.total.toFixed(2)} {value.currency}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Notes</label>
          <Textarea value={value.notes} onChange={(e) => onChange({ ...value, notes: e.target.value })} disabled={disabled} rows={3} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Terms</label>
          <Textarea value={value.terms} onChange={(e) => onChange({ ...value, terms: e.target.value })} disabled={disabled} rows={3} />
        </div>
      </div>
    </div>
  );
}

export function validateInvoiceForm(form: InvoiceFormValues): string | null {
  if (!form.buyer_id) return 'Select a buyer';
  if (!form.due_date) return 'Due date is required';
  const taxRate = Number(form.tax_rate);
  if (form.tax_rate.trim() !== '' && (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100)) {
    return 'Tax % must be between 0 and 100 (e.g. 15 for 15% tax)';
  }
  if (form.line_items.length === 0) return 'Add at least one line item';
  if (form.line_items.some((l) => !l.description.trim())) return 'All line items need a description';
  return null;
}

export function invoiceFormToPayload(form: InvoiceFormValues) {
  const taxRate = Math.min(100, Math.max(0, Number(form.tax_rate) || 0));
  return {
    buyer_id: form.buyer_id,
    issue_date: form.issue_date,
    due_date: form.due_date,
    currency: form.currency,
    tax_rate: taxRate,
    notes: form.notes || null,
    terms: form.terms || null,
    line_items: form.line_items.map((l) => ({
      description: l.description.trim(),
      quantity: Number(l.quantity) || 1,
      unit_price: Number(l.unit_price) || 0,
    })),
  };
}
