import { apiRequest } from '@/lib/api/client';

export type PaymentMethod = 'bank_transfer' | 'cheque' | 'cash' | 'card' | 'other';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
  cash: 'Cash',
  card: 'Card',
  other: 'Other',
};

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  recorded_by?: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export async function getPayments(invoiceId: string) {
  return apiRequest(`/payments?invoice_id=${invoiceId}`) as Promise<{ data: Payment[] }>;
}

export async function createPayment(input: {
  invoice_id: string;
  amount: number;
  payment_date?: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}) {
  return apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<{ payment: Payment; invoice: unknown }>;
}

export async function deletePayment(id: string) {
  return apiRequest(`/payments/${id}`, { method: 'DELETE' });
}

export interface BuyerCreditStatus {
  buyer_id: string;
  buyer_name?: string;
  credit_limit: number | null;
  credit_used: number;
  credit_available: number | null;
  utilization_pct?: number | null;
  open_invoices?: Array<{
    id: string;
    invoice_number: string;
    status: string;
    total: number;
    currency: string;
    due_date: string;
    amount_paid: number;
    balance_due: number;
  }>;
}

export async function getBuyerCreditStatus(buyerId: string) {
  return apiRequest(`/buyers/${buyerId}/credit-status`) as Promise<BuyerCreditStatus>;
}

export async function getCreditStatusList() {
  return apiRequest('/credit-status') as Promise<{
    data: Array<{
      buyer_id: string;
      buyer_name: string;
      credit_limit: number | null;
      credit_used: number;
      credit_available: number | null;
      utilization_pct: number | null;
    }>;
  }>;
}
