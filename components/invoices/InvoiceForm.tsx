'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { INVOICE_CURRENCIES, type InvoiceCurrency } from '@/types/invoices';
import { InvoiceTaxesDialog } from '@/components/invoices/InvoiceTaxesDialog';
import { InvoiceCompanyDialog } from '@/components/invoices/InvoiceCompanyDialog';
import { InvoiceDiscountDialog } from '@/components/invoices/InvoiceDiscountDialog';
import { InvoiceQuickClientDialog } from '@/components/invoices/InvoiceQuickClientDialog';
import { getInvoiceCompanySettings, type InvoiceCompanySettings } from '@/lib/api/invoices';
import {
  DEFAULT_INVOICE_COMPANY,
  loadInvoiceCompanyFromStorage,
} from '@/lib/invoiceCompanyStorage';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Force readable colors inside white invoice card (app shell may use dark theme) */
const LBL = 'text-sm font-semibold text-slate-700';
const LBL_SM = 'text-xs font-semibold uppercase tracking-wide text-slate-600';
const FIELD =
  'bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 shadow-sm';
const SELECT = 'w-full h-10 rounded-md border border-slate-300 bg-white text-slate-900 px-3 text-sm shadow-sm';
const LINK = 'text-blue-700 hover:text-blue-900 hover:underline font-medium';
const MUTED = 'text-slate-600 text-sm';

export type LineDraft = {
  item_name: string;
  line_detail: string;
  quantity: string;
  unit_price: string;
};

export type TaxDraft = {
  rate: string;
  name: string;
  tax_number: string;
  enabled?: boolean;
};

export type DiscountDraft = {
  type: 'percent' | 'fixed';
  value: string;
};

export type InvoiceFormValues = {
  buyer_id: string;
  issue_date: string;
  due_date: string;
  currency: InvoiceCurrency;
  reference: string;
  taxes: TaxDraft[];
  discount: DiscountDraft | null;
  notes: string;
  terms: string;
  line_items: LineDraft[];
  preview_invoice_number?: string;
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
    currency: 'GBP',
    reference: '',
    taxes: [],
    discount: null,
    notes: '',
    terms: 'Any disputes should be emailed to accounts@clarustologistics.com',
    line_items: [{ item_name: '', line_detail: '', quantity: '1', unit_price: '0' }],
  };
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function computeTotals(
  lines: { quantity: number; unit_price: number }[],
  taxes: TaxDraft[],
  discount: DiscountDraft | null
) {
  const subtotal = Math.round(lines.reduce((s, l) => s + l.quantity * l.unit_price, 0) * 100) / 100;
  let discountAmount = 0;
  if (discount && Number(discount.value) > 0) {
    const v = Number(discount.value);
    discountAmount =
      discount.type === 'percent'
        ? Math.round(subtotal * (Math.min(100, v) / 100) * 100) / 100
        : Math.round(Math.min(v, subtotal) * 100) / 100;
  }
  const taxable = Math.round(Math.max(0, subtotal - discountAmount) * 100) / 100;
  const breakdown = taxes
    .filter((t) => t.enabled !== false && t.rate.trim() !== '' && Number(t.rate) > 0)
    .map((t) => {
      const rate = Math.min(100, Math.max(0, Number(t.rate) || 0));
      const amount = Math.round(taxable * (rate / 100) * 100) / 100;
      return { ...t, rate: String(rate), amount };
    });
  const tax = Math.round(breakdown.reduce((s, t) => s + t.amount, 0) * 100) / 100;
  return {
    subtotal,
    discountAmount,
    taxable,
    tax,
    total: Math.round((taxable + tax) * 100) / 100,
    breakdown,
  };
}

type Props = {
  value: InvoiceFormValues;
  onChange: (v: InvoiceFormValues) => void;
  buyers: Array<{ id: string; buyer_name: string; contact_email?: string | null }>;
  disabled?: boolean;
};

export function InvoiceForm({ value, onChange, buyers, disabled }: Props) {
  const [taxesOpen, setTaxesOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [company, setCompany] = useState<InvoiceCompanySettings>(
    () => loadInvoiceCompanyFromStorage() || DEFAULT_INVOICE_COMPANY
  );

  const { data: companyData } = useQuery({
    queryKey: ['invoice-company-settings'],
    queryFn: getInvoiceCompanySettings,
    retry: false,
  });

  useEffect(() => {
    const local = loadInvoiceCompanyFromStorage();
    if (local) setCompany(local);
  }, []);

  useEffect(() => {
    if (companyData) setCompany(companyData);
  }, [companyData]);

  const totals = useMemo(() => {
    const lines = value.line_items.map((l) => ({
      quantity: Number(l.quantity) || 0,
      unit_price: Number(l.unit_price) || 0,
    }));
    return computeTotals(lines, value.taxes, value.discount);
  }, [value.line_items, value.taxes, value.discount]);

  const setLine = (index: number, patch: Partial<LineDraft>) => {
    const next = [...value.line_items];
    next[index] = { ...next[index], ...patch };
    onChange({ ...value, line_items: next });
  };

  const filteredBuyers = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return buyers;
    return buyers.filter(
      (b) =>
        b.buyer_name?.toLowerCase().includes(q) ||
        b.contact_email?.toLowerCase().includes(q)
    );
  }, [buyers, clientSearch]);

  const selectedBuyer = buyers.find((b) => b.id === value.buyer_id);
  const companyLines = (company?.address || '').split(/\n|\|/).map((l) => l.trim()).filter(Boolean);

  return (
    <div className="invoice-editor-light bg-white text-slate-900 rounded-lg border border-slate-300 shadow-lg overflow-hidden w-full [&_input]:text-slate-900 [&_textarea]:text-slate-900">
      <InvoiceTaxesDialog
        open={taxesOpen}
        onOpenChange={setTaxesOpen}
        taxes={value.taxes}
        onApply={(taxes) => onChange({ ...value, taxes })}
      />
      <InvoiceCompanyDialog
        open={companyOpen}
        onOpenChange={setCompanyOpen}
        initial={company}
        onSaved={setCompany}
      />
      <InvoiceQuickClientDialog
        open={clientOpen}
        onOpenChange={setClientOpen}
        onCreated={(b) => onChange({ ...value, buyer_id: b.id })}
      />
      <InvoiceDiscountDialog
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        discount={value.discount}
        onApply={(discount) => onChange({ ...value, discount })}
      />

      {/* Header: logo + company */}
      <div className="p-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-b">
        <div className="border-2 border-dashed border-slate-200 rounded-md p-6 flex flex-col items-center justify-center min-h-[120px] bg-slate-50/50">
          <img
            src="/clarusto-logo.png"
            alt="Company logo"
            className="max-h-14 w-auto object-contain opacity-90"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <p className={cn(MUTED, 'text-xs mt-2')}>Company logo</p>
        </div>
        <div className="text-right text-sm space-y-1 text-slate-800">
          <p className="font-bold uppercase tracking-wide text-lg text-slate-900">
            {company?.name || 'Your company'}
          </p>
          {company?.phone && <p className="text-slate-700">Tel: {company.phone}</p>}
          {companyLines.map((line, i) => (
            <p key={i} className="text-slate-700">
              {line}
            </p>
          ))}
          {!disabled && (
            <button
              type="button"
              className={cn(LINK, 'text-sm mt-2 inline-block')}
              onClick={() => setCompanyOpen(true)}
            >
              Edit Business Information
            </button>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 border-b-4 border-slate-800">
        <div className="lg:col-span-4 space-y-2">
          <p className={LBL_SM}>Billed To</p>
          <Input
            placeholder="Search for a client"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            disabled={disabled}
            className={cn(FIELD, 'mb-1')}
          />
          <select
            className={SELECT}
            value={value.buyer_id}
            onChange={(e) => onChange({ ...value, buyer_id: e.target.value })}
            disabled={disabled}
          >
            <option value="">Select buyer</option>
            {filteredBuyers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.buyer_name}
              </option>
            ))}
          </select>
          {!disabled && (
            <button
              type="button"
              className={cn(LINK, 'text-sm inline-block')}
              onClick={() => setClientOpen(true)}
            >
              + Create a Client
            </button>
          )}
          {selectedBuyer && (
            <p className={cn(MUTED, 'text-xs pt-1')}>
              {selectedBuyer.contact_email || 'No email on file'}
            </p>
          )}
        </div>

        <div className="lg:col-span-3 space-y-3 text-sm">
          <div>
            <p className={cn(LBL_SM, 'mb-1')}>Date of Issue</p>
            <Input
              type="date"
              value={value.issue_date}
              onChange={(e) => onChange({ ...value, issue_date: e.target.value })}
              disabled={disabled}
              className={FIELD}
            />
          </div>
          <div>
            <p className={cn(LBL_SM, 'mb-1')}>Due Date</p>
            <Input
              type="date"
              value={value.due_date}
              onChange={(e) => onChange({ ...value, due_date: e.target.value })}
              disabled={disabled}
              className={FIELD}
            />
          </div>
          <div>
            <p className={cn(LBL_SM, 'mb-1')}>Currency</p>
            <select
              className={SELECT}
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
        </div>

        <div className="lg:col-span-3 space-y-3 text-sm">
          <div>
            <p className={cn(LBL_SM, 'mb-1')}>Invoice Number</p>
            <p className="font-semibold text-slate-900">
              {value.preview_invoice_number || 'Assigned on save'}
            </p>
          </div>
          <div>
            <p className={cn(LBL_SM, 'mb-1')}>Reference</p>
            <Input
              placeholder="Enter value (e.g. PO #)"
              value={value.reference}
              onChange={(e) => onChange({ ...value, reference: e.target.value })}
              disabled={disabled}
              className={FIELD}
            />
          </div>
        </div>

        <div className="lg:col-span-2 text-right flex flex-col justify-start">
          <p className={LBL_SM}>Amount Due ({value.currency})</p>
          <p className="text-3xl font-bold mt-1 text-slate-900 tabular-nums">
            {formatMoney(totals.total, value.currency)}
          </p>
        </div>
      </div>

      {/* Line items */}
      <div className="px-6 py-4">
        <div className="hidden md:grid grid-cols-12 gap-2 pb-2 mb-3 border-b-2 border-slate-800">
          <div className={cn(LBL, 'col-span-5')}>Description</div>
          <div className={cn(LBL, 'col-span-2 text-center')}>Quantity</div>
          <div className={cn(LBL, 'col-span-2 text-right')}>Unit price</div>
          <div className={cn(LBL, 'col-span-2 text-right')}>Line Total</div>
          <div className="col-span-1" />
        </div>

        <div className="space-y-4">
          {value.line_items.map((line, i) => {
            const qty = Number(line.quantity) || 0;
            const price = Number(line.unit_price) || 0;
            const lineTotal = qty * price;
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-start border-b border-slate-200 pb-4">
                <div className="col-span-12 md:col-span-5 space-y-1.5">
                  <Input
                    placeholder="Enter an item name"
                    value={line.item_name}
                    onChange={(e) => setLine(i, { item_name: e.target.value })}
                    disabled={disabled}
                    className={FIELD}
                  />
                  <Input
                    placeholder="Add a description (optional)"
                    value={line.line_detail}
                    onChange={(e) => setLine(i, { line_detail: e.target.value })}
                    disabled={disabled}
                    className={cn(FIELD, 'text-sm')}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={line.quantity}
                    onChange={(e) => setLine(i, { quantity: e.target.value })}
                    disabled={disabled}
                    className={cn(FIELD, 'text-center')}
                  />
                </div>
                <div className="col-span-4 md:col-span-2 space-y-1">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={line.unit_price}
                    onChange={(e) => setLine(i, { unit_price: e.target.value })}
                    disabled={disabled}
                    className={cn(FIELD, 'text-right')}
                  />
                  {!disabled && (
                    <button type="button" className={cn(LINK, 'text-xs')} onClick={() => setTaxesOpen(true)}>
                      Add Taxes
                    </button>
                  )}
                </div>
                <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-2 pt-2 md:pt-0">
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {formatMoney(lineTotal, value.currency)}
                  </span>
                  {!disabled && value.line_items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        onChange({
                          ...value,
                          line_items: value.line_items.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!disabled && (
          <button
            type="button"
            className="w-full mt-4 py-4 border-2 border-dashed border-slate-400 rounded-md text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-500 flex items-center justify-center gap-2"
            onClick={() =>
              onChange({
                ...value,
                line_items: [
                  ...value.line_items,
                  { item_name: '', line_detail: '', quantity: '1', unit_price: '0' },
                ],
              })
            }
          >
            <Plus className="w-4 h-4" />
            Add a Line
          </button>
        )}
      </div>

      {/* Totals + notes */}
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-50/80 border-t border-slate-200">
        <div className="space-y-4 py-2">
          <div>
            <label className={LBL}>Notes</label>
            <Textarea
              value={value.notes}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
              disabled={disabled}
              rows={3}
              className={cn(FIELD, 'mt-1.5 min-h-[80px]')}
            />
          </div>
          <div>
            <label className={LBL}>Terms</label>
            <Textarea
              value={value.terms}
              onChange={(e) => onChange({ ...value, terms: e.target.value })}
              disabled={disabled}
              rows={2}
              className={cn(FIELD, 'mt-1.5')}
            />
          </div>
        </div>

        <div className="text-right text-sm space-y-2.5 max-w-sm ml-auto w-full py-2 text-slate-800">
          <div className="flex justify-between gap-4">
            <span className="font-medium text-slate-700">Subtotal</span>
            <span className="tabular-nums font-semibold text-slate-900">
              {totals.subtotal.toFixed(2)}
            </span>
          </div>
          {!disabled && (
            <button type="button" className={cn(LINK, 'text-sm block ml-auto')} onClick={() => setDiscountOpen(true)}>
              {value.discount ? 'Edit Discount' : 'Add a Discount'}
            </button>
          )}
          {totals.discountAmount > 0 && (
            <div className="flex justify-between gap-4 text-emerald-800 font-medium">
              <span>Discount</span>
              <span className="tabular-nums">-{totals.discountAmount.toFixed(2)}</span>
            </div>
          )}
          {totals.breakdown.length > 0 ? (
            totals.breakdown.map((t, idx) => (
              <div key={idx} className="flex justify-between gap-4">
                <span className="text-slate-700">
                  {t.rate}% ({t.name})
                </span>
                <span className="tabular-nums font-medium text-slate-900">{t.amount.toFixed(2)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between gap-4">
              <span className="text-slate-700">Tax</span>
              <span className="tabular-nums font-medium text-slate-900">{totals.tax.toFixed(2)}</span>
            </div>
          )}
          {!disabled && value.taxes.length === 0 && (
            <button type="button" className={cn(LINK, 'text-sm block ml-auto')} onClick={() => setTaxesOpen(true)}>
              Add Taxes
            </button>
          )}
          <div className="flex justify-between gap-4 font-bold text-lg pt-3 border-t-2 border-slate-300 text-slate-900">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(totals.total, value.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function validateInvoiceForm(form: InvoiceFormValues): string | null {
  if (!form.buyer_id) return 'Select a buyer (client)';
  if (!form.due_date) return 'Due date is required';
  for (const t of form.taxes) {
    if (t.enabled === false) continue;
    const rate = Number(t.rate);
    if (t.rate.trim() !== '' && (Number.isNaN(rate) || rate < 0 || rate > 100)) {
      return 'Each tax rate must be between 0 and 100';
    }
    if (t.rate.trim() !== '' && rate > 0 && !t.name.trim()) {
      return 'Each tax needs a name';
    }
  }
  if (form.discount && Number(form.discount.value) > 0) {
    const v = Number(form.discount.value);
    if (Number.isNaN(v) || v < 0) return 'Invalid discount value';
  }
  if (form.line_items.length === 0) return 'Add at least one line item';
  if (form.line_items.some((l) => !l.item_name.trim())) return 'All line items need an item name';
  return null;
}

export function invoiceFormToPayload(form: InvoiceFormValues) {
  const taxes = form.taxes
    .filter((t) => t.enabled !== false && t.rate.trim() !== '' && Number(t.rate) > 0)
    .map((t) => ({
      rate: Math.min(100, Math.max(0, Number(t.rate) || 0)),
      name: t.name.trim() || String(t.rate),
      tax_number: t.tax_number.trim() || null,
    }));

  const discount =
    form.discount && Number(form.discount.value) > 0
      ? {
          type: form.discount.type,
          value: Number(form.discount.value),
        }
      : null;

  return {
    buyer_id: form.buyer_id,
    issue_date: form.issue_date,
    due_date: form.due_date,
    currency: form.currency,
    reference: form.reference.trim() || null,
    taxes,
    tax_rate: taxes.length === 1 ? taxes[0].rate : taxes[0]?.rate ?? 0,
    discount,
    notes: form.notes || null,
    terms: form.terms || null,
    line_items: form.line_items.map((l) => ({
      description: l.item_name.trim(),
      line_detail: l.line_detail.trim() || null,
      quantity: Number(l.quantity) || 1,
      unit_price: Number(l.unit_price) || 0,
    })),
  };
}

/** Map saved invoice → form */
export function invoiceToFormValues(inv: {
  buyer_id: string;
  issue_date: string;
  due_date: string;
  currency: string;
  invoice_number?: string;
  reference?: string | null;
  discount_type?: string | null;
  discount_value?: number;
  tax_rate?: number;
  taxes?: Array<{ rate: number; name: string; tax_number?: string | null }>;
  notes?: string | null;
  terms?: string | null;
  line_items?: Array<{
    description: string;
    line_detail?: string | null;
    quantity: number;
    unit_price: number;
  }>;
}): InvoiceFormValues {
  const taxes =
    inv.taxes?.length
      ? inv.taxes.map((t) => ({
          rate: String(t.rate),
          name: t.name,
          tax_number: t.tax_number || '',
          enabled: true,
        }))
      : Number(inv.tax_rate) > 0
        ? [{ rate: String(inv.tax_rate), name: String(inv.tax_rate), tax_number: '', enabled: true }]
        : [];

  const discount =
    inv.discount_type && Number(inv.discount_value) > 0
      ? { type: inv.discount_type as 'percent' | 'fixed', value: String(inv.discount_value) }
      : null;

  return {
    buyer_id: inv.buyer_id,
    issue_date: inv.issue_date,
    due_date: inv.due_date,
    currency: (inv.currency as InvoiceCurrency) || 'GBP',
    reference: inv.reference || '',
    taxes,
    discount,
    notes: inv.notes || '',
    terms: inv.terms || '',
    preview_invoice_number: inv.invoice_number,
    line_items: (inv.line_items || []).map((l) => ({
      item_name: l.description,
      line_detail: l.line_detail || '',
      quantity: String(l.quantity),
      unit_price: String(l.unit_price),
    })),
  };
}
