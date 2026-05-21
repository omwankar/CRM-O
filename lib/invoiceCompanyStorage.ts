import type { InvoiceCompanySettings } from '@/lib/api/invoices';

const STORAGE_KEY = 'crm_invoice_company';

export const DEFAULT_INVOICE_COMPANY: InvoiceCompanySettings = {
  name: 'Clarusto Logistics LTD',
  phone: '+966 53 570 6708',
  address:
    'C/o NOORA WAQAIYAN AL DOSSARY EST\nPO Box – 8147, Riyadh – 14513\nKingdom of Saudi Arabia',
  vat_number: '#300828318400003',
};

export function loadInvoiceCompanyFromStorage(): InvoiceCompanySettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InvoiceCompanySettings;
  } catch {
    return null;
  }
}

export function saveInvoiceCompanyToStorage(settings: InvoiceCompanySettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
