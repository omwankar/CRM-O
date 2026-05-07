'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getQuotationById } from '@/lib/api/quotations';
import { QuotationForm } from '@/components/quotations/QuotationForm';

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => getQuotationById(id),
    enabled: !!id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Quotation</h1>
          <p className="text-muted-foreground">Update quotation details</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : data ? (
        <QuotationForm quotation={data as any} onSuccess={() => router.push(`/dashboard/quotations/${id}`)} />
      ) : (
        <div>
          <p className="text-sm text-destructive">Quotation not found.</p>
          {error ? (
            <p className="text-xs text-muted-foreground mt-2 break-all">{String((error as any)?.message || '')}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

