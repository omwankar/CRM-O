'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createBuyer } from '@/lib/api/buyers';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (buyer: { id: string; buyer_name: string; contact_email?: string | null }) => void;
};

export function InvoiceQuickClientDialog({ open, onOpenChange, onCreated }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      toast.error('Client name is required');
      return;
    }
    setSaving(true);
    try {
      const buyer = await createBuyer({
        buyer_name: name.trim(),
        contact_email: email.trim() || null,
      });
      await qc.invalidateQueries({ queryKey: ['buyers-invoice'] });
      await qc.invalidateQueries({ queryKey: ['buyers'] });
      onCreated({
        id: buyer.id,
        buyer_name: buyer.buyer_name,
        contact_email: buyer.contact_email,
      });
      toast.success('Client created');
      setName('');
      setEmail('');
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Client name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company or person name" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Email (for sending invoice)</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="billing@client.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            Create client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
