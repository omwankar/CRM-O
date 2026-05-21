export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const INVOICE_STATUS_CLASSES: Record<InvoiceStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  overdue: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export const INVOICE_CURRENCIES = ['SAR', 'INR', 'USD', 'EUR', 'AED', 'GBP'] as const;
export type InvoiceCurrency = (typeof INVOICE_CURRENCIES)[number];

export interface InvoiceTax {
  id?: string;
  invoice_id?: string;
  rate: number;
  name: string;
  tax_number?: string | null;
  amount: number;
  sort_order?: number;
}

export interface InvoiceLineItem {
  id?: string;
  invoice_id?: string;
  description: string;
  line_detail?: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order?: number;
}

export interface InvoiceBuyer {
  id: string;
  buyer_name: string;
  contact_person?: string | null;
  contact_email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  buyer_id: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  reference?: string | null;
  discount_type?: 'percent' | 'fixed' | null;
  discount_value?: number;
  discount_amount?: number;
  notes?: string | null;
  terms?: string | null;
  pdf_url?: string | null;
  pdf_path?: string | null;
  sent_at?: string | null;
  sent_to_email?: string | null;
  email_message_id?: string | null;
  created_at: string;
  updated_at: string;
  line_items?: InvoiceLineItem[];
  taxes?: InvoiceTax[];
  buyer?: InvoiceBuyer | null;
  buyers?: { id: string; buyer_name: string; contact_email?: string | null };
}

export type CreateInvoiceInput = {
  buyer_id: string;
  issue_date?: string;
  due_date: string;
  currency?: string;
  tax_rate?: number;
  taxes?: Array<{ rate: number; name: string; tax_number?: string | null }>;
  reference?: string | null;
  discount?: { type: 'percent' | 'fixed'; value: number } | null;
  notes?: string | null;
  line_items: Array<{ description: string; line_detail?: string | null; quantity: number; unit_price: number }>;
  terms?: string | null;
};


export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;
