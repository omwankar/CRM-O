'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getBuyers } from '@/lib/api/buyers';
import { createInvoice } from '@/lib/api/invoices';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InvoiceForm, emptyInvoiceForm, invoiceFormToPayload, validateInvoiceForm } from '@/components/invoices/InvoiceForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewInvoicePage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyInvoiceForm);

  const { data: buyersData } = useQuery({
    queryKey: ['buyers-invoice'],
    queryFn: () => getBuyers({ limit: 200 }),
  });

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

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push('/dashboard/invoices')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <div>
        <h1 className="text-3xl font-bold">New invoice</h1>
        <p className="text-muted-foreground">Draft will be saved; generate PDF and email from the detail page.</p>
      </div>
      <Card className="p-6">
        <InvoiceForm value={form} onChange={setForm} buyers={buyersData?.data || []} />
        <div className="mt-6 flex justify-end">
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create draft
          </Button>
        </div>
      </Card>
    </div>
  );
}
