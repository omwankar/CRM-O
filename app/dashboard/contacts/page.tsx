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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone, Link2, X } from 'lucide-react';
import {
  type Contact,
  type ContactInput,
  type ContactLinkEntityType,
  createContact,
  deleteContact,
  getContacts,
  updateContact,
} from '@/lib/api/contacts';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { EntityRecordPicker } from '@/components/tasks/EntityRecordPicker';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const ENTITY_TYPES: { value: ContactLinkEntityType; label: string }[] = [
  { value: 'company', label: 'Company' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'partnership', label: 'Partner' },
  { value: 'lead', label: 'Lead' },
  { value: 'opportunity', label: 'Opportunity' },
];

const ENTITY_BADGE: Record<ContactLinkEntityType, string> = {
  company: 'border border-slate-400/40 bg-slate-500/10',
  buyer: 'border border-emerald-500/35 bg-emerald-500/12',
  vendor: 'border border-blue-500/35 bg-blue-500/12',
  partnership: 'border border-teal-500/35 bg-teal-500/12',
  lead: 'border border-amber-500/35 bg-amber-500/12',
  opportunity: 'border border-violet-500/35 bg-violet-500/12',
};

type DraftLink = {
  key: string;
  entity_type: ContactLinkEntityType;
  entity_id: string;
  entity_label: string;
  role: string;
};

const emptyForm: ContactInput & { draftLinks: DraftLink[] } = {
  full_name: '',
  email: '',
  phone: '',
  designation: '',
  company: '',
  notes: '',
  draftLinks: [],
};

function newDraftLink(): DraftLink {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entity_type: 'company',
    entity_id: '',
    entity_label: '',
    role: '',
  };
}

export default function ContactsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', debouncedSearch],
    queryFn: () => getContacts({ search: debouncedSearch || undefined, limit: 100 }),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const links = form.draftLinks
        .filter((l) => l.entity_id)
        .map((l) => ({
          entity_type: l.entity_type,
          entity_id: l.entity_id,
          role: l.role.trim() || null,
        }));

      const payload: ContactInput = {
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        designation: form.designation || null,
        company: form.company || null,
        notes: form.notes || null,
        links,
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
    setForm({ ...emptyForm, draftLinks: [] });
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
      draftLinks: (c.links || []).map((l, i) => ({
        key: l.id || `existing-${i}`,
        entity_type: l.entity_type,
        entity_id: l.entity_id,
        entity_label: l.label || '',
        role: l.role || '',
      })),
    });
    setDialogOpen(true);
  };

  const entityLabel = (type: ContactLinkEntityType) =>
    ENTITY_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            People directory — link one person to companies, buyers, vendors, partners, leads, or deals.
          </p>
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
            <Card key={i} className="animate-pulse p-5">
              <div className="mb-2 h-4 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </Card>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <Card className="flex flex-col items-center p-10 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No contacts yet</p>
          <p className="text-sm text-muted-foreground">Add your first contact to build the directory.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c) => (
            <Card key={c.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{c.full_name}</h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {[c.designation, c.company].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      if (confirm(`Delete contact "${c.full_name}"?`)) deleteMut.mutate(c.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {c.email ? (
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {c.email}
                  </p>
                ) : null}
                {c.phone ? (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {c.phone}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(c.links || []).length === 0 ? (
                  <span className="text-xs text-muted-foreground">No links</span>
                ) : (
                  (c.links || []).map((l, i) => (
                    <Badge
                      key={l.id || `${l.entity_type}-${l.entity_id}-${i}`}
                      variant="outline"
                      className={ENTITY_BADGE[l.entity_type]}
                    >
                      {entityLabel(l.entity_type)}: {l.label || '—'}
                      {l.role ? ` (${l.role})` : ''}
                    </Badge>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
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
                <Input
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
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
                <Label>Company (free text)</Label>
                <Input
                  value={form.company || ''}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Display label if unlinked"
                />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Linked to
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({ ...f, draftLinks: [...f.draftLinks, newDraftLink()] }))
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Same person can link to multiple orgs/deals (e.g. buyer + vendor, or a new company after
                they move).
              </p>

              {form.draftLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No links yet.</p>
              ) : (
                <div className="space-y-3">
                  {form.draftLinks.map((link) => (
                      <div key={link.key} className="grid gap-2 rounded-md border bg-muted/20 p-2">
                        <div className="flex items-start gap-2">
                          <div className="grid flex-1 gap-2">
                            <Select
                              value={link.entity_type}
                              onValueChange={(v) =>
                                setForm((f) => ({
                                  ...f,
                                  draftLinks: f.draftLinks.map((d) =>
                                    d.key === link.key
                                      ? {
                                          ...d,
                                          entity_type: v as ContactLinkEntityType,
                                          entity_id: '',
                                          entity_label: '',
                                        }
                                      : d,
                                  ),
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {ENTITY_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <EntityRecordPicker
                              entityType={link.entity_type}
                              value={link.entity_id}
                              label={link.entity_label}
                              onChange={(id, label) =>
                                setForm((f) => ({
                                  ...f,
                                  draftLinks: f.draftLinks.map((d) =>
                                    d.key === link.key
                                      ? { ...d, entity_id: id, entity_label: label }
                                      : d,
                                  ),
                                }))
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 shrink-0 p-0"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                draftLinks: f.draftLinks.filter((d) => d.key !== link.key),
                              }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Role (optional) — e.g. Decision maker, Ops contact"
                          value={link.role}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              draftLinks: f.draftLinks.map((d) =>
                                d.key === link.key ? { ...d, role: e.target.value } : d,
                              ),
                            }))
                          }
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            {editing?.id ? (
              <div className="border-t pt-3">
                <ActivityTimeline entityType="contact" entityId={editing.id} compact />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={!form.full_name.trim() || saveMut.isPending}
            >
              {editing ? 'Save changes' : 'Create contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
