'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationNumber: string;
  defaultEmail?: string | null;
  onSend: (payload: { email: string; message?: string }) => Promise<void>;
};

export function SendQuotationDialog({
  open,
  onOpenChange,
  quotationNumber,
  defaultEmail,
  onSend,
}: Props) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail(defaultEmail?.trim() || '');
    setMessage('');
  }, [open, defaultEmail]);

  const submit = async () => {
    const to = email.trim();
    if (!to) return;
    setSending(true);
    try {
      await onSend({ email: to, message: message.trim() || undefined });
      onOpenChange(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send quotation to client</DialogTitle>
          <DialogDescription>
            Email quote PDF for <span className="font-mono font-medium">{quotationNumber}</span> via Resend.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="quote-email">Client email</Label>
            <Input
              id="quote-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quote-message">Message (optional)</Label>
            <Textarea
              id="quote-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Additional note in the email body…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={sending || !email.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Send quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
