import { toast } from 'sonner';

export function quotationErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

export function notifyQuotationError(error: unknown, fallback?: string) {
  toast.error(quotationErrorMessage(error, fallback));
}

export function notifyQuotationSuccess(message: string) {
  toast.success(message);
}
