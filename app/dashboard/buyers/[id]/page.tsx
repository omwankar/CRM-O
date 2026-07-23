'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { getBuyer, updateBuyer } from '@/lib/api/buyers';
import { getComments, createComment } from '@/lib/api/comments';
import { getBuyerCreditStatus } from '@/lib/api/payments';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { EntityTaskList } from '@/components/tasks/EntityTaskList';
import { ArrowLeft, Edit2, Save, X, Plus, MessageSquare, History } from 'lucide-react';

type Tab = 'overview' | 'pipeline' | 'credit' | 'tasks' | 'comments' | 'activity';

export default function BuyerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [newComment, setNewComment] = useState('');

  const { data: buyer, isLoading } = useQuery({
    queryKey: ['buyer', id],
    queryFn: () => getBuyer(id),
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', 'buyers', id],
    queryFn: () => getComments({ related_table: 'buyers', related_id: id }),
  });

  const { data: credit } = useQuery({
    queryKey: ['buyer-credit', id],
    queryFn: () => getBuyerCreditStatus(id),
    enabled: !!id && activeTab === 'credit',
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateBuyer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', id] });
      setIsEditing(false);
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => createComment({ body, related_table: 'buyers', related_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'buyers', id] });
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

  const b = buyer;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/dashboard/buyers')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Buyers
      </Button>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{b.buyer_name}</h1>
            <p className="text-muted-foreground">{b.contact_person}</p>
            {b.company?.id ? (
              <p className="mt-1 text-sm">
                Company:{' '}
                <Link href={`/dashboard/companies/${b.company.id}`} className="text-blue-600 hover:underline">
                  {b.company.name}
                </Link>
              </p>
            ) : null}
            {b.also_vendor && (b.sibling_vendors || []).length > 0 ? (
              <p className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                This company is also a vendor:{' '}
                {(b.sibling_vendors || []).map((v: { id: string; vendor_name: string }, i: number) => (
                  <span key={v.id}>
                    {i > 0 ? ', ' : ''}
                    <Link href={`/dashboard/vendors/${v.id}`} className="font-medium underline">
                      {v.vendor_name}
                    </Link>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditForm(b); setIsEditing(true); }}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <div className="flex gap-1 border-b mb-6">
          {(['overview', 'pipeline', 'credit', 'tasks', 'comments', 'activity'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'pipeline' ? 'Opportunities' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {isEditing && (
          <Card className="p-4 mb-6 bg-muted/50">
            <h3 className="font-semibold mb-4">Edit Buyer</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Buyer Name" value={editForm.buyer_name || ''} onChange={(e) => setEditForm({ ...editForm, buyer_name: e.target.value })} />
              <Input placeholder="Contact Person" value={editForm.contact_person || ''} onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })} />
              <Input placeholder="Email" value={editForm.contact_email || ''} onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })} />
              <Input placeholder="Phone" value={editForm.contact_phone || ''} onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })} />
              <Input placeholder="Industry" value={editForm.industry || ''} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} />
              <Input placeholder="Company Type" value={editForm.company_type || ''} onChange={(e) => setEditForm({ ...editForm, company_type: e.target.value })} />
              <Input placeholder="Buyer Portal Link" value={editForm.buyer_portal_link || ''} onChange={(e) => setEditForm({ ...editForm, buyer_portal_link: e.target.value })} />
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
                <p><span className="text-muted-foreground">Email:</span> {b.contact_email || '-'}</p>
                <p><span className="text-muted-foreground">Phone:</span> {b.contact_phone || '-'}</p>
                <p><span className="text-muted-foreground">Address:</span> {b.address || '-'}</p>
                <p><span className="text-muted-foreground">City:</span> {b.city || '-'}</p>
                <p><span className="text-muted-foreground">State:</span> {b.state || '-'}</p>
                <p><span className="text-muted-foreground">Country:</span> {b.country || '-'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Business Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Industry:</span> {b.industry || '-'}</p>
                <p><span className="text-muted-foreground">Company Type:</span> {b.company_type || '-'}</p>
                <p><span className="text-muted-foreground">Website:</span> {b.website || '-'}</p>
                <p><span className="text-muted-foreground">Buyer Portal Link:</span> {b.buyer_portal_link || '-'}</p>
                <p><span className="text-muted-foreground">Description:</span> {b.description || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-semibold">Opportunities</h3>
                <p className="text-sm text-muted-foreground">
                  Deal stages live on Opportunities now (not a single buyer stage).
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href={`/dashboard/opportunities/new?buyer_id=${b.id}`}>New opportunity</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Open deals</p>
                <p className="text-2xl font-bold">{b.open_count ?? (b.opportunities || []).filter((o: any) => !['closed_won','closed_lost'].includes(o.stage)).length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Open pipeline value</p>
                <p className="text-2xl font-bold tabular-nums">
                  {(b.open_pipeline_value ?? 0).toLocaleString()}
                </p>
              </Card>
            </div>
            {(b.opportunities || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No opportunities yet for this buyer.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {(b.opportunities || []).map((o: any) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <Link href={`/dashboard/opportunities/${o.id}`} className="font-medium text-blue-600 hover:underline">
                        {o.title}
                      </Link>
                      <p className="text-xs text-muted-foreground capitalize">{String(o.stage).replace(/_/g, ' ')}</p>
                    </div>
                    <p className="text-sm tabular-nums">
                      {o.value != null ? `${o.currency || ''} ${Number(o.value).toLocaleString()}` : '—'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {b.pipeline_stages?.[0]?.name ? (
              <p className="text-xs text-muted-foreground">
                Legacy buyer stage (deprecated): {b.pipeline_stages[0].name}
              </p>
            ) : null}
          </div>
        )}

        {activeTab === 'credit' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Credit</h3>
              <p className="text-sm text-muted-foreground">
                Used amount is unpaid balance on non-cancelled invoices (total − payments).
              </p>
            </div>
            {!credit ? (
              <p className="text-sm text-muted-foreground">Loading credit…</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground">Credit limit</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {credit.credit_limit != null ? credit.credit_limit.toLocaleString() : '—'}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground">Used</p>
                    <p className="text-2xl font-bold tabular-nums">{credit.credit_used.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {credit.credit_available != null ? credit.credit_available.toLocaleString() : '—'}
                    </p>
                  </Card>
                </div>
                {credit.utilization_pct != null && (
                  <p className="text-sm text-muted-foreground">
                    Utilization: <span className="font-medium text-foreground">{credit.utilization_pct}%</span>
                  </p>
                )}
                <div>
                  <h4 className="font-medium mb-2">Open invoices (contributing to used)</h4>
                  {(credit.open_invoices || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No open balances.</p>
                  ) : (
                    <ul className="divide-y rounded-lg border">
                      {(credit.open_invoices || []).map((inv) => (
                        <li key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div>
                            <Link
                              href={`/dashboard/invoices/${inv.id}`}
                              className="font-mono text-blue-600 hover:underline"
                            >
                              {inv.invoice_number}
                            </Link>
                            <p className="text-xs text-muted-foreground capitalize">
                              {inv.status} · due {inv.due_date || '—'}
                            </p>
                          </div>
                          <div className="text-right text-sm tabular-nums">
                            <p>Balance {Number(inv.balance_due).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              of {Number(inv.total).toLocaleString()} {inv.currency}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'tasks' && <EntityTaskList entityType="buyer" entityId={id} />}

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
                        <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
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
          <ActivityTimeline entityType="buyer" entityId={id} />
        )}
      </Card>
    </div>
  );
}