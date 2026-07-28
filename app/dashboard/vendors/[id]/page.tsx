'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { getVendor, updateVendor, getVendorJobs } from '@/lib/api/vendors';
import { getComments, createComment } from '@/lib/api/comments';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { EntityTaskList } from '@/components/tasks/EntityTaskList';
import { JobStatusPill } from '@/components/jobs/JobStatusPill';
import { ArrowLeft, Edit2, Save, X, Plus, MessageSquare, History, Package } from 'lucide-react';
import type { JobStatus } from '@/types/jobs';
import { formatUkDateTime } from '@/lib/date';

type Tab = 'overview' | 'details' | 'jobs' | 'tasks' | 'comments' | 'activity';

export default function VendorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [newComment, setNewComment] = useState('');

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => getVendor(id),
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', 'vendors', id],
    queryFn: () => getComments({ related_table: 'vendors', related_id: id }),
  });

  const { data: jobsRes } = useQuery({
    queryKey: ['vendor-jobs', id],
    queryFn: () => getVendorJobs(id),
    enabled: activeTab === 'jobs',
  });

  const assignedJobs = jobsRes?.data || [];

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] });
      setIsEditing(false);
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => createComment({ body, related_table: 'vendors', related_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'vendors', id] });
      setNewComment('');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editForm);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      commentMutation.mutate(newComment);
    }
  };

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  const v = vendor;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/dashboard/vendors')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Vendors
      </Button>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{v.vendor_name}</h1>
            <p className="text-muted-foreground">{v.contact_person}</p>
            {v.company?.id ? (
              <p className="mt-1 text-sm">
                Company:{' '}
                <Link href={`/dashboard/companies/${v.company.id}`} className="text-blue-600 hover:underline">
                  {v.company.name}
                </Link>
              </p>
            ) : null}
            {v.also_buyer && (v.sibling_buyers || []).length > 0 ? (
              <p className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                This company is also a buyer:{' '}
                {(v.sibling_buyers || []).map((b: { id: string; buyer_name: string }, i: number) => (
                  <span key={b.id}>
                    {i > 0 ? ', ' : ''}
                    <Link href={`/dashboard/buyers/${b.id}`} className="font-medium underline">
                      {b.buyer_name}
                    </Link>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditForm(v); setIsEditing(true); }}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <div className="flex gap-1 border-b mb-6">
          {(['overview', 'details', 'jobs', 'tasks', 'comments', 'activity'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'jobs' ? 'Assigned jobs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {isEditing && (
          <Card className="p-4 mb-6 bg-muted/50">
            <h3 className="font-semibold mb-4">Edit Vendor</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Vendor Name" value={editForm.vendor_name || ''} onChange={(e) => setEditForm({ ...editForm, vendor_name: e.target.value })} />
              <Input placeholder="Contact Person" value={editForm.contact_person || ''} onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })} />
              <Input placeholder="Email" value={editForm.contact_email || ''} onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })} />
              <Input placeholder="Phone" value={editForm.contact_phone || ''} onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })} />
              <Input placeholder="Vendor Type" value={editForm.vendor_type || ''} onChange={(e) => setEditForm({ ...editForm, vendor_type: e.target.value })} />
              <Input placeholder="Payment Terms" value={editForm.payment_terms || ''} onChange={(e) => setEditForm({ ...editForm, payment_terms: e.target.value })} />
              <Input placeholder="Vendor Portal Link" value={editForm.vendor_portal_link || ''} onChange={(e) => setEditForm({ ...editForm, vendor_portal_link: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Email:</span> {v.contact_email || '-'}</p>
                <p><span className="text-muted-foreground">Phone:</span> {v.contact_phone || '-'}</p>
                <p><span className="text-muted-foreground">Address:</span> {v.address || '-'}</p>
                <p><span className="text-muted-foreground">City:</span> {v.city || '-'}</p>
                <p><span className="text-muted-foreground">State:</span> {v.state || '-'}</p>
                <p><span className="text-muted-foreground">Country:</span> {v.country || '-'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Business Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Vendor Type:</span> {v.vendor_type || '-'}</p>
                <p><span className="text-muted-foreground">Payment Terms:</span> {v.payment_terms || '-'}</p>
                <p><span className="text-muted-foreground">Tax ID:</span> {v.tax_id || '-'}</p>
                <p><span className="text-muted-foreground">Website:</span> {v.website || '-'}</p>
                <p><span className="text-muted-foreground">Vendor Portal Link:</span> {v.vendor_portal_link || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div>
            <h3 className="font-semibold mb-4">Additional Details</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Description:</span> {v.description || '-'}</p>
              <p><span className="text-muted-foreground">Notes:</span> {v.notes || '-'}</p>
              <p><span className="text-muted-foreground">Status:</span> {v.status || '-'}</p>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Jobs where this vendor is assigned as executor.
            </p>
            {assignedJobs.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                <Package className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No assigned jobs yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Job</th>
                      <th className="px-3 py-2 font-medium">Lane</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedJobs.map((row) => (
                      <tr
                        key={row.link_id}
                        className="border-t hover:bg-muted/30 cursor-pointer"
                        onClick={() => router.push(`/dashboard/jobs/${row.job.id}`)}
                      >
                        <td className="px-3 py-2">
                          <div className="font-mono text-xs text-muted-foreground">
                            {row.job.job_number}
                          </div>
                          <div className="font-medium">{row.job.title}</div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.job.origin || row.job.destination
                            ? `${row.job.origin || '—'} → ${row.job.destination || '—'}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <JobStatusPill status={row.job.status as JobStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && <EntityTaskList entityType="vendor" entityId={id} />}

        {activeTab === 'comments' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold">Comments</h3>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddComment} disabled={commentMutation.isPending}>
                Post
              </Button>
            </div>
            <div className="space-y-4">
              {comments?.data?.map((comment: any) => (
                <Card key={comment.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">{comment.author?.full_name?.[0] || 'U'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author?.full_name || 'User'}</span>
                        <span className="text-xs text-muted-foreground">{formatUkDateTime(comment.created_at)}</span>
                      </div>
                      <p className="text-sm">{comment.body}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {comments?.data?.length === 0 && <p className="text-muted-foreground text-sm">No comments yet</p>}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <ActivityTimeline entityType="vendor" entityId={id} />
        )}
      </Card>
    </div>
  );
}