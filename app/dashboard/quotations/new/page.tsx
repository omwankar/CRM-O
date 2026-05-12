'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { QuotationForm } from '@/components/quotations/QuotationForm';

export default function NewQuotationPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New enquiry</h1>
          <p className="text-muted-foreground">Create a new quotation enquiry</p>
        </div>
      </div>

      <QuotationForm onSuccess={() => router.push('/dashboard/quotations')} />
    </div>
  );
}

