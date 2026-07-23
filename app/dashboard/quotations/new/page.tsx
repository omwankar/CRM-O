'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { convertEnquiryToQuotation } from '@/lib/api/enquiries';
import { notifyQuotationError } from '@/lib/quotation-notify';
import { toast } from 'sonner';

function NewQuotationFromEnquiry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enquiryId = searchParams.get('enquiry_id');
  const started = useRef(false);

  useEffect(() => {
    if (!enquiryId) {
      router.replace('/dashboard/enquiries');
      return;
    }
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const data = await convertEnquiryToQuotation(enquiryId);
        toast.success('Quotation created');
        if (data.credit_warning?.message) {
          toast.warning(data.credit_warning.message, { duration: 8000 });
        }
        if (data.quotation?.id) router.replace(`/dashboard/quotations/${data.quotation.id}`);
        else router.replace('/dashboard/quotations');
      } catch (error) {
        started.current = false;
        notifyQuotationError(error, 'Could not create quotation from enquiry.');
        router.replace(`/dashboard/enquiries/${enquiryId}`);
      }
    })();
  }, [enquiryId, router]);

  if (!enquiryId) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Quotations are created from Enquiries. Redirecting…</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/enquiries')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go to Enquiries
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-muted-foreground py-12">
      <Loader2 className="h-5 w-5 animate-spin" />
      Creating quotation from enquiry…
    </div>
  );
}

export default function NewQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      }
    >
      <NewQuotationFromEnquiry />
    </Suspense>
  );
}
