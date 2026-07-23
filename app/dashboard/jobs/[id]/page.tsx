'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CanWrite } from '@/components/auth/Can';
import { JobStatusPill } from '@/components/jobs/JobStatusPill';
import { JobStatusChangeModal } from '@/components/jobs/JobStatusChangeModal';
import { JobMilestoneTimeline } from '@/components/jobs/JobMilestoneTimeline';
import { EntityTaskList } from '@/components/tasks/EntityTaskList';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import {
  changeJobStatus,
  deleteJob,
  getJob,
  getJobHistory,
  updateJob,
  addJobVendor,
  removeJobVendor,
  addJobPartner,
  removeJobPartner,
  addJobAttachment,
  deleteJobAttachment,
} from '@/lib/api/jobs';
import { getUsers } from '@/lib/api/users';
import { getVendors } from '@/lib/api/vendors';
import { apiRequest } from '@/lib/api/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/lib/auth';
import {
  JOB_MODE_LABELS,
  type JobModeType,
  type JobStatus,
  type UpdateJobInput,
} from '@/types/jobs';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, canWrite } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateJobInput | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(id!),
    enabled: !!id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['job-history', id],
    queryFn: () => getJobHistory(id!),
    enabled: !!id,
  });

  const { data: usersRes } = useQuery({
    queryKey: ['users', 'job-detail'],
    queryFn: () => getUsers({ limit: 200 }),
  });

  const { data: vendorsRes } = useQuery({
    queryKey: ['vendors', 'job-detail'],
    queryFn: () => getVendors({ limit: 100 }),
  });

  const { data: partnershipsRes } = useQuery({
    queryKey: ['partnerships', 'job-detail'],
    queryFn: () =>
      apiRequest('/partnerships?limit=100') as Promise<{
        data: Array<{ id: string; partner_name: string }>;
      }>,
  });

  const users = usersRes?.data || [];
  const vendors = Array.isArray(vendorsRes)
    ? vendorsRes
    : (vendorsRes as any)?.vendors || (vendorsRes as any)?.data || [];
  const partnerships = partnershipsRes?.data || [];

  useEffect(() => {
    if (job && editing && !form) {
      setForm({
        title: job.title,
        origin: job.origin,
        destination: job.destination,
        cargo_description: job.cargo_description,
        weight_kg: job.weight_kg,
        volume_cbm: job.volume_cbm,
        container_type: job.container_type,
        mode_type: job.mode_type,
        supervisor_id: job.supervisor_id,
        assigned_person_id: job.assigned_person_id,
        notes: job.notes,
        linked_email: job.linked_email,
        quotation_id: job.quotation_id,
        invoice_id: job.invoice_id,
      });
    }
  }, [job, editing, form]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['job', id] });
    qc.invalidateQueries({ queryKey: ['job-history', id] });
  };

  const saveEdit = async () => {
    if (!form || !id) return;
    setSaving(true);
    try {
      await updateJob(id, form);
      toast.success('Job updated');
      setEditing(false);
      setForm(null);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onStatusChange = async (status: JobStatus, reason: string) => {
    if (!id) return;
    try {
      await changeJobStatus(id, { status, reason, changed_by: user?.id });
      toast.success('Milestone logged');
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Status change failed');
    }
  };

  const onDelete = async () => {
    if (!id || !confirm('Soft-delete this job?')) return;
    try {
      await deleteJob(id);
      toast.success('Job deleted');
      router.push('/dashboard/jobs');
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  const uploadAttachment = async (file: File) => {
    if (!id || !user?.id) return;
    const path = `jobs/${id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('attachments').upload(path, file);
    if (upErr) {
      // fallback: try documents bucket naming used elsewhere, or store metadata-only URL
      const { data: pub } = supabase.storage.from('documents').getPublicUrl(path);
      try {
        await supabase.storage.from('documents').upload(path, file);
        await addJobAttachment(id, {
          file_name: file.name,
          file_type: file.type,
          file_url: pub.publicUrl,
          file_size: file.size,
          uploaded_by: user.id,
        });
      } catch (e: any) {
        toast.error(e?.message || 'Upload failed');
        return;
      }
    } else {
      const { data: pub } = supabase.storage.from('attachments').getPublicUrl(path);
      await addJobAttachment(id, {
        file_name: file.name,
        file_type: file.type,
        file_url: pub.publicUrl,
        file_size: file.size,
        uploaded_by: user.id,
      });
    }
    toast.success('Attachment added');
    refresh();
  };

  if (isLoading || !job) {
    return <p className="p-6 text-sm text-muted-foreground">Loading job…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/jobs">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <p className="text-xs font-mono text-muted-foreground">{job.job_number}</p>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <JobStatusPill status={job.status} />
              {job.mode_type && (
                <span className="text-xs text-muted-foreground">{JOB_MODE_LABELS[job.mode_type]}</span>
              )}
            </div>
          </div>
        </div>
        <CanWrite>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStatusOpen(true)}>
              Update milestone
            </Button>
            {!editing ? (
              <Button
                variant="outline"
                onClick={() => {
                  setForm(null);
                  setEditing(true);
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setForm(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={saveEdit} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </>
            )}
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CanWrite>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 space-y-4 lg:col-span-2">
          <h2 className="font-semibold">Shipment details</h2>
          {editing && form ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title || ''}
                  onChange={(e) => setForm((f) => ({ ...f!, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Origin</Label>
                  <Input
                    value={form.origin || ''}
                    onChange={(e) => setForm((f) => ({ ...f!, origin: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input
                    value={form.destination || ''}
                    onChange={(e) => setForm((f) => ({ ...f!, destination: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select
                    value={form.mode_type || 'none'}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f!,
                        mode_type: v === 'none' ? null : (v as JobModeType),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {(Object.keys(JOB_MODE_LABELS) as JobModeType[]).map((m) => (
                        <SelectItem key={m} value={m}>
                          {JOB_MODE_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={form.weight_kg ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f!,
                        weight_kg: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Volume (CBM)</Label>
                  <Input
                    type="number"
                    value={form.volume_cbm ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f!,
                        volume_cbm: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Textarea
                  rows={3}
                  value={form.cargo_description || ''}
                  onChange={(e) => setForm((f) => ({ ...f!, cargo_description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={form.assigned_person_id || 'none'}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f!, assigned_person_id: v === 'none' ? null : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Supervisor</Label>
                  <Select
                    value={form.supervisor_id || 'none'}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f!, supervisor_id: v === 'none' ? null : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={form.notes || ''}
                  onChange={(e) => setForm((f) => ({ ...f!, notes: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Lane</dt>
                <dd>
                  {job.origin || job.destination
                    ? `${job.origin || '—'} → ${job.destination || '—'}`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Container / type</dt>
                <dd>{job.container_type || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Weight</dt>
                <dd>{job.weight_kg != null ? `${job.weight_kg} kg` : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Volume</dt>
                <dd>{job.volume_cbm != null ? `${job.volume_cbm} CBM` : '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Cargo</dt>
                <dd className="whitespace-pre-wrap">{job.cargo_description || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Assignee</dt>
                <dd>{job.assigned_person?.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Supervisor</dt>
                <dd>{job.supervisor?.name || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-wrap">{job.notes || '—'}</dd>
              </div>
            </dl>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Links</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Buyer</dt>
              <dd>
                {job.buyer?.id ? (
                  <Link href={`/dashboard/buyers/${job.buyer.id}`} className="text-blue-600 hover:underline">
                    {job.buyer.buyer_name}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Opportunity</dt>
              <dd>
                {job.opportunity?.id ? (
                  <Link
                    href={`/dashboard/opportunities/${job.opportunity.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {job.opportunity.title}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Quotation</dt>
              <dd>
                {job.quotation?.id ? (
                  <Link
                    href={`/dashboard/quotations/${job.quotation.id}`}
                    className="text-blue-600 hover:underline font-mono"
                  >
                    {job.quotation.quotation_number}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Invoice</dt>
              <dd>
                {job.invoice?.id ? (
                  <Link
                    href={`/dashboard/invoices/${job.invoice.id}`}
                    className="text-blue-600 hover:underline font-mono"
                  >
                    {job.invoice.invoice_number}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Vendors</h2>
            {canWrite && (
              <Select
                value="add"
                onValueChange={async (v) => {
                  if (v === 'add') return;
                  try {
                    await addJobVendor(id!, { vendor_id: v });
                    refresh();
                  } catch (e: any) {
                    toast.error(e?.message || 'Failed to add vendor');
                  }
                }}
              >
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue placeholder="Add" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add" disabled>
                    Add vendor
                  </SelectItem>
                  {vendors.map((v: any) => (
                    <SelectItem
                      key={v.id}
                      value={v.id}
                      disabled={(job.vendors || []).some((x) => x.vendor_id === v.id)}
                    >
                      {v.vendor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {(job.vendors || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">None assigned</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(job.vendors || []).map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2">
                  <span>{v.vendor?.vendor_name || v.vendor_id}</span>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await removeJobVendor(id!, v.vendor_id);
                        refresh();
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Partners</h2>
          </div>
          {(job.partners || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">None assigned</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(job.partners || []).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>{p.partner?.partner_name || p.partnership_id}</span>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await removeJobPartner(id!, p.partnership_id);
                        refresh();
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canWrite && (
            <Select
              value="add"
              onValueChange={async (v) => {
                if (v === 'add') return;
                try {
                  await addJobPartner(id!, { partnership_id: v });
                  refresh();
                } catch (e: any) {
                  toast.error(e?.message || 'Failed to add partner');
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Add partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add" disabled>
                  Add partner…
                </SelectItem>
                {partnerships.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    disabled={(job.partners || []).some((x) => x.partnership_id === p.id)}
                  >
                    {p.partner_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Card>
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Attachments</h2>
          {canWrite && (
            <Input
              type="file"
              className="max-w-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAttachment(file);
                e.target.value = '';
              }}
            />
          )}
        </div>
        {(job.attachments || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No files yet (POD, customs, shipping docs).</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(job.attachments || []).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  {a.file_name}
                </a>
                {canWrite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await deleteJobAttachment(id!, a.id);
                      refresh();
                    }}
                  >
                    Delete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Milestone timeline</h2>
        <JobMilestoneTimeline history={history} />
      </Card>

      <EntityTaskList entityType="job" entityId={job.id} />
      <ActivityTimeline entityType="job" entityId={job.id} />

      <JobStatusChangeModal
        currentStatus={job.status}
        isOpen={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={onStatusChange}
      />
    </div>
  );
}
