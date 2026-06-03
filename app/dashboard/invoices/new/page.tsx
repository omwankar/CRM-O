'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getBuyers } from '@/lib/api/buyers';
import { createInvoice } from '@/lib/api/invoices';
import { getQuotationById } from '@/lib/api/quotations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  InvoiceForm,
  emptyInvoiceForm,
  invoiceFormToPayload,
  validateInvoiceForm,
} from '@/components/invoices/InvoiceForm';
import { invoiceFormFromQuotation } from '@/lib/invoiceFromQuotation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationId = searchParams.get('quotation_id');
  const [form, setForm] = useState(emptyInvoiceForm);
  const [prefilled, setPrefilled] = useState(false);

  const { data: buyersData } = useQuery({
    queryKey: ['buyers-invoice'],
    queryFn: () => getBuyers({ limit: 200 }),
  });

  const { data: quotation, isLoading: quotationLoading } = useQuery({
    queryKey: ['quotation-invoice-prefill', quotationId],
    queryFn: () => getQuotationById(quotationId!),
    enabled: !!quotationId,
  });

  useEffect(() => {
    if (!quotationId || !quotation || prefilled) return;
    const prefill = invoiceFormFromQuotation(quotation);
    if (!prefill) {
      toast.error('Set a customer send price on the quotation before creating an invoice.');
      router.replace('/dashboard/invoices/new');
      return;
    }
    setForm(prefill);
    setPrefilled(true);
  }, [quotationId, quotation, prefilled, router]);

  const createMut = useMutation({
    mutationFn: () => {
      const err = validateInvoiceForm(form);
      if (err) throw new Error(err);
      return createInvoice(invoiceFormToPayload(form));
    },
    onSuccess: (inv) => {
      toast.success('Invoice created');
      router.push(`/dashboard/invoices/${inv.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (quotationId && quotationLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-10">
      <Button variant="ghost" onClick={() => router.push('/dashboard/invoices')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <div>
        <h1 className="text-3xl font-bold text-foreground">New invoice</h1>
        <p className="text-slate-400">
          {quotationId && quotation
            ? `Prefilled from quotation ${quotation.quotation_number} — review and edit before saving.`
            : 'White invoice editor — all fields below print on the PDF.'}
        </p>
      </div>
      <div className="rounded-xl bg-slate-100/90 p-4 md:p-6">
        <Card className="p-0 overflow-hidden border-0 shadow-none bg-transparent">
          <InvoiceForm value={form} onChange={setForm} buyers={buyersData?.data || []} />
          <div className="mt-6 flex justify-end">
            <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create draft
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewInvoiceContent />
    </Suspense>
  );
}
