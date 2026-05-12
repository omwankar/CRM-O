'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateFollowupInput, QuotationFollowup, ReminderStatus } from '@/types/quotations';
import { notifyQuotationError } from '@/lib/quotation-notify';

const methods = ['Call', 'Email', 'Meeting'] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: QuotationFollowup | null;
  onSubmit: (data: CreateFollowupInput) => Promise<void>;
};

export function FollowUpForm({ open, onOpenChange, initial, onSubmit }: Props) {
  const [followup_date, setFollowupDate] = useState('');
  const [method, setMethod] = useState<(typeof methods)[number]>('Call');
  const [customer_response, setCustomerResponse] = useState('');
  const [next_followup_date, setNextFollowupDate] = useState('');
  const [reminder_status, setReminderStatus] = useState<ReminderStatus>('not_set');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setFollowupDate(initial.followup_date ? String(initial.followup_date).slice(0, 10) : '');
      setMethod(initial.method);
      setCustomerResponse(initial.customer_response || '');
      setNextFollowupDate(initial.next_followup_date ? String(initial.next_followup_date).slice(0, 10) : '');
      setReminderStatus(initial.reminder_status);
    } else {
      setFollowupDate(new Date().toISOString().slice(0, 10));
      setMethod('Call');
      setCustomerResponse('');
      setNextFollowupDate('');
      setReminderStatus('not_set');
    }
  }, [open, initial]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({
        followup_date: followup_date,
        method,
        customer_response: customer_response || undefined,
        next_followup_date: next_followup_date || undefined,
        reminder_status,
      });
      onOpenChange(false);
    } catch (error) {
      notifyQuotationError(error, 'Could not save this follow-up.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initial ? 'Edit Follow-up' : 'Add Follow-up'}</SheetTitle>
          <SheetDescription>Log customer touchpoints and next steps.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <div>
            <Label>Follow-up Date</Label>
            <Input type="date" className="mt-2" value={followup_date} onChange={(e) => setFollowupDate(e.target.value)} />
          </div>
          <div>
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as (typeof methods)[number])}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Customer Response</Label>
            <Textarea className="mt-2" rows={3} value={customer_response} onChange={(e) => setCustomerResponse(e.target.value)} />
          </div>
          <div>
            <Label>Next Follow-up Date</Label>
            <Input type="date" className="mt-2" value={next_followup_date} onChange={(e) => setNextFollowupDate(e.target.value)} />
          </div>
          <div>
            <Label>Reminder</Label>
            <Select value={reminder_status} onValueChange={(v) => setReminderStatus(v as ReminderStatus)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_set">Not set</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="px-4 pb-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !followup_date}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
