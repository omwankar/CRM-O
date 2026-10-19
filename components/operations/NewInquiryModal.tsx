'use client';

import { InquiryIntake } from '@/components/operations/InquiryIntake';
import { opsFontClass } from '@/components/operations/opsFonts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function NewInquiryModal({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${opsFontClass} ops max-h-[90vh] overflow-y-auto border-[var(--line)] p-0 sm:max-w-4xl`} style={{ background: 'var(--surface)', color: 'var(--fg)' }}>
        <DialogHeader className="border-b border-[var(--line-soft)] px-5 py-4">
          <DialogTitle>New inquiry</DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4">
          <p className="hint" style={{ marginTop: 0 }}>Paste an email or WhatsApp message, check the fields, then create it. The inquiry ID is assigned automatically.</p>
          <InquiryIntake onCreated={() => { onCreated(); onOpenChange(false); }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
