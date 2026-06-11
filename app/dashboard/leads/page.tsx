'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { Plus, Search, Pencil, Trash2, ArrowRightCircle, Target } from 'lucide-react';
import {
  type Lead,
  type LeadInput,
  type LeadStatus,
  convertLead,
  createLead,
  deleteLead,
  getLeadStats,
  getLeads,
  updateLead,
} from '@/lib/api/leads';

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

const SOURCE_OPTIONS = ['website', 'referral', 'cold_call', 'event', 'other'];

const STATUS_BADGE: Record<LeadStatus, string> = {
  new: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  contacted: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  qualified: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  converted: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  lost: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

const emptyForm: LeadInput = {
  lead_name: '',
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  source: 'website',
  status: 'new',
  notes: '',
};

export default function LeadsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadInput>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', statusFilter, search],
    queryFn: () => getLeads({ status: statusFilter, search: search || undefined, limit: 100 }),
  });

  const { data: stats } = useQuery({ queryKey: ['lead-stats'], queryFn: getLeadStats });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['leads'] });
    qc.invalidateQueries({ queryKey: ['lead-stats'] });
  };

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: LeadInput = {
        ...form,
        email: form.email || null,
        company_name: form.company_name || null,
        contact_person: form.contact_person || null,
        phone: form.phone || null,
        notes: form.notes || null,
      };
      return editing ? updateLead(editing.id, payload) : createLead(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Lead updated' : 'Lead created');
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const convertMut = useMutation({
    mutationFn: (id: string) => convertLead(id),
    onSuccess: (result) => {
      toast.success('Lead converted to buyer');
      invalidate();
      router.push(`/dashboard/buyers/${result.buyer.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      toast.success('Lead deleted');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leads = data?.data || [];

  const statCards = useMemo(() => {
    const by = stats?.by_status || {};
    return [
      { label: 'Total', value: stats?.total || 0 },
      { label: 'New', value: by.new || 0 },
      { label: 'Qualified', value: by.qualified || 0 },
      { label: 'Converted', value: by.converted || 0 },
    ];
  }, [stats]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setForm({
      lead_name: lead.lead_name,
      company_name: lead.company_name || '',
      contact_person: lead.contact_person || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || 'other',
      status: lead.status,
      notes: lead.notes || '',
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Capture and qualify new business opportunities</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New lead
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </Card>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <Card className="p-10 flex flex-col items-center text-center">
          <Target className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="font-medium">No leads yet</p>
          <p className="text-sm text-muted-foreground">Create your first lead to start tracking opportunities.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {leads.map((lead) => (
            <Card key={lead.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{lead.lead_name}</h3>
                    <Badge className={STATUS_BADGE[lead.status]}>{lead.status}</Badge>
                    {lead.source ? (
                      <span className="text-xs text-muted-foreground">via {lead.source.replace('_', ' ')}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {lead.company_name ? <span>{lead.company_name}</span> : null}
                    {lead.contact_person ? <span>{lead.contact_person}</span> : null}
                    {lead.email ? <span>{lead.email}</span> : null}
                    {lead.phone ? <span>{lead.phone}</span> : null}
                  </div>
                  {lead.notes ? (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{lead.notes}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {lead.status !== 'converted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => convertMut.mutate(lead.id)}
                      disabled={convertMut.isPending}
                    >
                      <ArrowRightCircle className="w-4 h-4 mr-1" />
                      Convert to buyer
                    </Button>
                  )}
                  {lead.converted_buyer_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/buyers/${lead.converted_buyer_id}`)}
                    >
                      View buyer
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEdit(lead)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete lead "${lead.lead_name}"?`)) deleteMut.mutate(lead.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit lead' : 'New lead'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Lead name *</Label>
              <Input
                value={form.lead_name}
                onChange={(e) => setForm({ ...form, lead_name: e.target.value })}
                placeholder="e.g. Industrial pumps enquiry"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Company</Label>
                <Input
                  value={form.company_name || ''}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Contact person</Label>
                <Input
                  value={form.contact_person || ''}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                />
              </div>
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
                <Label>Source</Label>
                <Select
                  value={form.source || 'other'}
                  onValueChange={(v) => setForm({ ...form, source: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status || 'new'}
                  onValueChange={(v) => setForm({ ...form, status: v as LeadStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <Button onClick={() => saveMut.mutate()} disabled={!form.lead_name.trim() || saveMut.isPending}>
              {editing ? 'Save changes' : 'Create lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
