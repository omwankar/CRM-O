import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateQuotationInput, UpdateQuotationInput } from '@/types/quotations';
import {
  addRevision,
  chooseVendorQuote,
  createQuotation,
  deleteQuotation,
  getQuotationById,
  getQuotations,
  updateQuotation,
} from '@/lib/api/quotations';

export function useQuotations(filters?: Parameters<typeof getQuotations>[0]) {
  return useQuery({
    queryKey: ['quotations', filters],
    queryFn: () => getQuotations(filters),
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: () => getQuotationById(id),
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuotationInput) => createQuotation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuotationInput }) => updateQuotation(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      qc.invalidateQueries({ queryKey: ['quotation', vars.id] });
    },
  });
}

export function useDeleteQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteQuotation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useChooseVendorQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quotation_id, vendor_quote_id }: { quotation_id: string; vendor_quote_id: string }) =>
      chooseVendorQuote(quotation_id, vendor_quote_id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['quotation', vars.quotation_id] });
    },
  });
}

export function useAddRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quotation_id, data }: { quotation_id: string; data: { revised_price: number; currency: string; notes: string } }) =>
      addRevision(quotation_id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['quotation', vars.quotation_id] });
    },
  });
}

