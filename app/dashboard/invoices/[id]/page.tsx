'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getInvoice,
  updateInvoice,
  generateInvoicePdf,
  sendInvoice,
  fetchInvoicePdfBlob,
  deleteInvoice,
} from '@/lib/api/invoices';
import { getBuyers } from '@/lib/api/buyers';
import {
  createPayment,
  deletePayment,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from '@/lib/api/payments';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CanWrite } from '@/components/auth/Can';
import {
  InvoiceForm,
  invoiceFormToPayload,
  invoiceToFormValues,
  validateInvoiceForm,
  type InvoiceFormValues,
} from '@/components/invoices/InvoiceForm';
import {
  INVOICE_STATUS_CLASSES,
  INVOICE_STATUS_LABELS,
  type Invoice,
  type InvoiceStatus,
} from '@/types/invoices';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Banknote, FileText, Link2, Loader2, Mail, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function invoiceToForm(inv: Invoice): InvoiceFormValues {
  return invoiceToFormValues(inv);
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

const emptyPaymentForm = () => ({
  amount: '',
  payment_date: new Date().toISOString().slice(0, 10),
  method: 'bank_transfer' as PaymentMethod,
  reference: '',
  notes: '',
});

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState<InvoiceFormValues | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState(emptyPaymentForm);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!),
    enabled: !!id,
  });

  const { data: buyersData } = useQuery({
    queryKey: ['buyers-invoice'],
    queryFn: () => getBuyers({ limit: 200 }),
  });

  useEffect(() => {
    if (invoice) {
      setForm(invoiceToForm(invoice));
      setSendEmail(invoice.buyer?.contact_email || invoice.buyers?.contact_email || '');
    }
  }, [invoice]);

  const saveMut = useMutation({
    mutationFn: () => {
      const err = validateInvoiceForm(form!);
      if (err) throw new Error(err);
      return updateInvoice(id!, invoiceFormToPayload(form!));
    },
    onSuccess: () => {
      toast.success('Invoice saved');
      qc.invalidateQueries({ queryKey: ['invoice', id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pdfMut = useMutation({
    mutationFn: () => generateInvoicePdf(id!),
    onSuccess: (res) => {
      toast.success('PDF generated');
      if (res.storage_warning) toast.warning(`Storage: ${res.storage_warning}`);
      qc.invalidateQueries({ queryKey: ['invoice', id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMut = useMutation({
    mutationFn: () => sendInvoice(id!, sendEmail.trim() || undefined),
    onSuccess: () => {
      toast.success('Invoice sent');
      setSendOpen(false);
      qc.invalidateQueries({ queryKey: ['invoice', id] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteInvoice(id!),
    onSuccess: () => {
      toast.success('Invoice cancelled');
      router.push('/dashboard/invoices');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payMut = useMutation({
    mutationFn: () => {
      const amount = Number(payForm.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid payment amount');
      return createPayment({
        invoice_id: id!,
        amount,
        payment_date: payForm.payment_date || undefined,
        method: payForm.method,
        reference: payForm.reference.trim() || null,
        notes: payForm.notes.trim() || null,
      });
    },
    onSuccess: (res) => {
      toast.success('Payment recorded');
      if ((res.invoice as Invoice | null)?.overpaid) {
        toast.warning(
          `Overpayment of ${formatMoney(Number((res.invoice as Invoice).overpayment_amount || 0), invoice!.currency)}`,
          { duration: 8000 },
        );
      }
      setPayOpen(false);
      setPayForm(emptyPaymentForm());
      qc.invalidateQueries({ queryKey: ['invoice', id] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const voidPayMut = useMutation({
    mutationFn: (paymentId: string) => deletePayment(paymentId),
    onSuccess: () => {
      toast.success('Payment voided');
      qc.invalidateQueries({ queryKey: ['invoice', id] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const previewPdf = async () => {
    try {
      const blob = await fetchInvoicePdfBlob(id!);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not open PDF');
    }
  };

  if (isLoading || !invoice) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isDraft = invoice.status === 'draft';
  const isCancelled = invoice.status === 'cancelled';
  const canRecordPayment = !isDraft && !isCancelled;
  const buyerName = invoice.buyer?.buyer_name || invoice.buyers?.buyer_name || '—';
  const amountPaid = Number(invoice.amount_paid ?? 0);
  const balanceDue = Number(invoice.balance_due ?? Math.max(Number(invoice.total) - amountPaid, 0));
  const payments = invoice.payments || [];

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => router.push('/dashboard/invoices')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to invoices
      </Button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono">{invoice.invoice_number}</h1>
          <p className="text-muted-foreground">{buyerName}</p>
          <p className="text-lg font-semibold mt-1">{formatMoney(Number(invoice.total), invoice.currency)}</p>
          <span
            className={`inline-flex mt-2 text-xs px-2 py-0.5 rounded-full ${
              INVOICE_STATUS_CLASSES[invoice.status as InvoiceStatus] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus] || invoice.status}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            Status is derived from payments (paid / partial / overdue) after send.
          </p>
          {invoice.sent_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Sent {new Date(invoice.sent_at).toLocaleString()} to {invoice.sent_to_email}
            </p>
          )}
          {invoice.quotation && (
            <p className="text-sm mt-2 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Linked quotation:</span>
              <Link
                href={`/dashboard/quotations/${invoice.quotation.id}`}
                className="font-mono text-blue-600 hover:underline"
              >
                {invoice.quotation.quotation_number}
              </Link>
            </p>
          )}
        </div>
        <CanWrite>
          <div className="flex flex-wrap gap-2">
            {isDraft && (
              <>
                <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Save invoice
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setForm(invoiceToForm(invoice));
                    toast.message('Changes reset');
                  }}
                >
                  Reset
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => pdfMut.mutate()} disabled={pdfMut.isPending}>
              <FileText className="w-4 h-4 mr-2" />
              Generate PDF
            </Button>
            <Button variant="outline" onClick={previewPdf}>
              Preview PDF
            </Button>
            {invoice.status !== 'cancelled' && (
              <Button onClick={() => setSendOpen(true)}>
                <Mail className="w-4 h-4 mr-2" />
                Send to client
              </Button>
            )}
            {canRecordPayment && (
              <Button
                onClick={() => {
                  setPayForm({
                    ...emptyPaymentForm(),
                    amount: balanceDue > 0 ? String(balanceDue) : '',
                  });
                  setPayOpen(true);
                }}
              >
                <Banknote className="w-4 h-4 mr-2" />
                Record payment
              </Button>
            )}
            {isDraft && (
              <Button variant="destructive" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CanWrite>
      </div>

      {invoice.overpaid && (
        <Card className="p-4 border-amber-300 bg-amber-50 text-amber-950">
          <p className="text-sm font-medium">Overpayment recorded</p>
          <p className="text-sm mt-1">
            Payments exceed invoice total by{' '}
            {formatMoney(Number(invoice.overpayment_amount || 0), invoice.currency)}. Refunds / credit
            notes are not handled yet — review manually.
          </p>
        </Card>
      )}

      {!isDraft && !isCancelled && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Invoice total</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatMoney(Number(invoice.total), invoice.currency)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Amount paid</p>
            <p className="text-xl font-semibold tabular-nums text-emerald-700">
              {formatMoney(amountPaid, invoice.currency)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Balance due</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatMoney(Math.max(balanceDue, 0), invoice.currency)}
            </p>
          </Card>
        </div>
      )}

      {invoice.pdf_url && (
        <Card className="p-4">
          <p className="text-sm">
            Stored PDF:{' '}
            <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Open link
            </a>
          </p>
        </Card>
      )}

      <div className="rounded-xl bg-slate-100/90 p-4 md:p-6">
      <Card className="p-0 overflow-hidden border-0 shadow-none bg-transparent">
        {form && (
          <InvoiceForm
            value={form}
            onChange={setForm}
            buyers={buyersData?.data || []}
            disabled={!isDraft}
          />
        )}
        {!isDraft && (
          <p className="text-sm text-slate-600 mt-4 px-6 pb-4 bg-amber-50 border border-amber-200 rounded-md mx-4">
            This invoice was sent — view only. Duplicate as a new draft to edit. Record payments to update
            paid / partial / overdue status.
          </p>
        )}
      </Card>
      </div>

      {!isDraft && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Payments</h2>
              <p className="text-sm text-muted-foreground">
                Paid / partial / overdue are derived from these records — not set manually.
              </p>
            </div>
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Method</th>
                    <th className="px-3 py-2 font-medium">Reference</th>
                    <th className="px-3 py-2 font-medium">Notes</th>
                    <th className="px-3 py-2 font-medium w-16" />
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2 whitespace-nowrap">{p.payment_date}</td>
                      <td className="px-3 py-2 tabular-nums font-medium">
                        {formatMoney(Number(p.amount), p.currency || invoice.currency)}
                      </td>
                      <td className="px-3 py-2">
                        {PAYMENT_METHOD_LABELS[p.method as PaymentMethod] || p.method}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{p.reference || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground max-w-xs truncate">
                        {p.notes || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <CanWrite>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Void payment"
                            disabled={voidPayMut.isPending}
                            onClick={() => {
                              if (confirm('Void this payment? Status will recalculate.')) {
                                voidPayMut.mutate(p.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </CanWrite>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send invoice to client</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Email will include PDF attachment for <strong>{invoice.invoice_number}</strong> and will be
            sent from info@clarustologistics.com.
          </p>
          <div>
            <label className="text-sm font-medium block mb-1">Recipient email</label>
            <Input
              type="email"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              placeholder="billing@client.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => sendMut.mutate()} disabled={sendMut.isPending || !sendEmail.trim()}>
              {sendMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Currency is taken from the invoice ({invoice.currency}). Balance due:{' '}
            {formatMoney(Math.max(balanceDue, 0), invoice.currency)}.
          </p>
          <div className="grid gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Amount</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Payment date</label>
              <Input
                type="date"
                value={payForm.payment_date}
                onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Method</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={payForm.method}
                onChange={(e) => setPayForm({ ...payForm, method: e.target.value as PaymentMethod })}
              >
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Reference</label>
              <Input
                value={payForm.reference}
                onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                placeholder="UTR / cheque no."
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Notes</label>
              <Input
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => payMut.mutate()} disabled={payMut.isPending}>
              {payMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
