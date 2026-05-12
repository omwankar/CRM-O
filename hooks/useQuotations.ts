import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateFollowupInput, Quotation, UpdateFollowupInput, UpdateQuotationInput } from '@/types/quotations';
import {
  addFollowup,
  chooseVendorQuote,
  deleteFollowup,
  getQuotationById,
  updateFollowup,
  updateQuotation,
} from '@/lib/api/quotations';
import { notifyQuotationError } from '@/lib/quotation-notify';

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: () => getQuotationById(id),
    enabled: !!id,
  });
}

export function useUpdateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuotationInput }) => updateQuotation(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      qc.invalidateQueries({ queryKey: ['quotation', vars.id] });
      qc.invalidateQueries({ queryKey: ['quotation-stats'] });
    },
    onError: (error) => notifyQuotationError(error, 'Could not update this enquiry.'),
  });
}

export function useChooseVendorQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quotation_id, vendor_quote_id }: { quotation_id: string; vendor_quote_id: string }) =>
      chooseVendorQuote(quotation_id, vendor_quote_id),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['quotation', vars.quotation_id] });
      const previous = qc.getQueryData<Quotation>(['quotation', vars.quotation_id]);
      if (previous) {
        qc.setQueryData<Quotation>(['quotation', vars.quotation_id], {
          ...previous,
          chosen_quote_id: vars.vendor_quote_id,
          quotation_vendor_quotes: (previous.quotation_vendor_quotes || []).map((quote) => ({
            ...quote,
            is_chosen: quote.id === vars.vendor_quote_id,
            quote_line_status: quote.id === vars.vendor_quote_id ? 'finalised' : quote.quote_line_status,
          })),
        });
      }
      return { previous };
    },
    onSuccess: (data, vars) => {
      qc.setQueryData<Quotation | undefined>(['quotation', vars.quotation_id], (current) => {
        if (!current) return current;
        return {
          ...current,
          ...data,
          quotation_vendor_quotes: (current.quotation_vendor_quotes || []).map((quote) => ({
            ...quote,
            is_chosen: quote.id === vars.vendor_quote_id,
            quote_line_status: quote.id === vars.vendor_quote_id ? 'finalised' : quote.quote_line_status,
          })),
        };
      });
    },
    onError: (error, vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['quotation', vars.quotation_id], context.previous);
      }
      notifyQuotationError(error, 'Could not update the final vendor selection.');
    },
  });
}

export function useAddFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quotation_id, data }: { quotation_id: string; data: CreateFollowupInput }) =>
      addFollowup(quotation_id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['quotation', vars.quotation_id] });
    },
    onError: (error) => notifyQuotationError(error, 'Could not save this follow-up.'),
  });
}

export function useUpdateFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { followupId: string; quotationId: string; data: UpdateFollowupInput }) =>
      updateFollowup(vars.followupId, vars.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['quotation', vars.quotationId] });
    },
    onError: (error) => notifyQuotationError(error, 'Could not update this follow-up.'),
  });
}

export function useDeleteFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { followupId: string; quotationId: string }) => deleteFollowup(vars.followupId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['quotation', vars.quotationId] });
    },
    onError: (error) => notifyQuotationError(error, 'Could not delete this follow-up.'),
  });
}
