/** Customer-facing price: revised price takes precedence over finalized send price. */
export function getQuotationCustomerPrice(q: {
  revised_price?: number | null;
  revised_currency?: string | null;
  clarusto_final_price?: number | null;
  clarusto_final_currency?: string | null;
}): { amount: number; currency: string } | null {
  if (q.revised_price != null && !Number.isNaN(Number(q.revised_price))) {
    return {
      amount: Number(q.revised_price),
      currency: (q.revised_currency || 'INR').toUpperCase(),
    };
  }
  if (q.clarusto_final_price != null && !Number.isNaN(Number(q.clarusto_final_price))) {
    return {
      amount: Number(q.clarusto_final_price),
      currency: (q.clarusto_final_currency || 'INR').toUpperCase(),
    };
  }
  return null;
}
