'use client';

import { InquiryIntake } from '@/components/operations/InquiryIntake';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function NewInquiryModal({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ops max-h-[90vh] overflow-y-auto border-[var(--ops-line)] sm:max-w-4xl" style={{ background: 'var(--ops-surface)', color: 'var(--ops-fg)' }}>
        <DialogHeader>
          <DialogTitle>New inquiry</DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: 'var(--ops-muted)' }}>Paste an email or WhatsApp message, then check and edit the fields before creating it.</p>
        <InquiryIntake onCreated={() => { onCreated(); onOpenChange(false); }} />
      </DialogContent>
    </Dialog>
  );
}
