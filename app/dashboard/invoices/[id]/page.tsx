'use client';

import { useEffect, useState } from 'react';
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
import Link from 'next/link';
import { ArrowLeft, FileText, Link2, Loader2, Mail, Save, Trash2 } from 'lucide-react';
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

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState<InvoiceFormValues | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState('');

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
  const buyerName = invoice.buyer?.buyer_name || invoice.buyers?.buyer_name || '—';

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
              INVOICE_STATUS_CLASSES[invoice.status as InvoiceStatus]
            }`}
          >
            {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus]}
          </span>
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
            {isDraft && (
              <Button variant="destructive" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CanWrite>
      </div>

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
            This invoice was sent — view only. Duplicate as a new draft to edit.
          </p>
        )}
      </Card>
      </div>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send invoice to client</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Email will include PDF attachment for <strong>{invoice.invoice_number}</strong>.
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
    </div>
  );
}
