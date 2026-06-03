import { emptyInvoiceForm, type InvoiceFormValues } from '@/components/invoices/InvoiceForm';
import { getQuotationCustomerPrice } from '@/lib/quotationPricing';
import type { InvoiceCurrency } from '@/types/invoices';
import type { Quotation } from '@/types/quotations';

/** Prefill the new-invoice form from a quotation (mirrors backend from-quotation defaults). */
export function invoiceFormFromQuotation(quotation: Quotation): InvoiceFormValues | null {
  const price = getQuotationCustomerPrice(quotation);
  if (!price) return null;

  const base = emptyInvoiceForm();
  const desc =
    (quotation.requirement || 'Quotation').slice(0, 500) ||
    `Quotation ${quotation.quotation_number}`;
  const notes = price.notes
    ? `Linked to quotation ${quotation.quotation_number}. ${price.notes}`
    : `Linked to quotation ${quotation.quotation_number}.`;

  const currency = (price.currency || 'INR').toUpperCase() as InvoiceCurrency;
  const taxes =
    currency === 'SAR'
      ? [{ rate: '15', name: '15', tax_number: '', enabled: true }]
      : [];

  return {
    ...base,
    quotation_id: quotation.id,
    buyer_id: quotation.buyer_id || '',
    currency,
    reference: quotation.quotation_number,
    notes,
    taxes,
    line_items: [
      {
        item_name: desc,
        line_detail: '',
        quantity: '1',
        unit_price: String(price.amount),
      },
    ],
  };
}
