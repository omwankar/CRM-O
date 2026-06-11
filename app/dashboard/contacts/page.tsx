'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone } from 'lucide-react';
import {
  type Contact,
  type ContactInput,
  createContact,
  deleteContact,
  getContacts,
  updateContact,
} from '@/lib/api/contacts';

const emptyForm: ContactInput = {
  full_name: '',
  email: '',
  phone: '',
  designation: '',
  company: '',
  notes: '',
};

export default function ContactsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactInput>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search],
    queryFn: () => getContacts({ search: search || undefined, limit: 100 }),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: ContactInput = {
        ...form,
        email: form.email || null,
        phone: form.phone || null,
        designation: form.designation || null,
        company: form.company || null,
        notes: form.notes || null,
      };
      return editing ? updateContact(editing.id, payload) : createContact(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Contact updated' : 'Contact created');
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      toast.success('Contact deleted');
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const contacts = data?.data || [];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({
      full_name: c.full_name,
      email: c.email || '',
      phone: c.phone || '',
      designation: c.designation || '',
      company: c.company || '',
      notes: c.notes || '',
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">People directory across leads, buyers, and vendors</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New contact
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <Card className="p-10 flex flex-col items-center text-center">
          <Users className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="font-medium">No contacts yet</p>
          <p className="text-sm text-muted-foreground">Add your first contact to build the directory.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c) => (
            <Card key={c.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{c.full_name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {[c.designation, c.company].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      if (confirm(`Delete contact "${c.full_name}"?`)) deleteMut.mutate(c.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {c.email ? (
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    {c.email}
                  </p>
                ) : null}
                {c.phone ? (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {c.phone}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.buyer ? <Badge variant="secondary">Buyer: {c.buyer.buyer_name}</Badge> : null}
                {c.vendor ? <Badge variant="secondary">Vendor: {c.vendor.vendor_name}</Badge> : null}
                {c.lead ? <Badge variant="secondary">Lead: {c.lead.lead_name}</Badge> : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit contact' : 'New contact'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Full name *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Phone</Label>
                <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Designation</Label>
                <Input
                  value={form.designation || ''}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Company</Label>
                <Input
                  value={form.company || ''}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMut.mutate()} disabled={!form.full_name.trim() || saveMut.isPending}>
              {editing ? 'Save changes' : 'Create contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
