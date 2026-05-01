'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { getBuyer, updateBuyer } from '@/lib/api/buyers';
import { getComments, createComment } from '@/lib/api/comments';
import { getTasks, createTask } from '@/lib/api/tasks';
import { ArrowLeft, Edit2, Save, X, Plus, MessageSquare, CheckSquare, History } from 'lucide-react';

type Tab = 'overview' | 'pipeline' | 'tasks' | 'comments' | 'activity';

export default function BuyerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [newComment, setNewComment] = useState('');
  const [newTask, setNewTask] = useState('');

  const { data: buyer, isLoading } = useQuery({
    queryKey: ['buyer', id],
    queryFn: () => getBuyer(id),
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', 'buyers', id],
    queryFn: () => getComments({ related_table: 'buyers', related_id: id }),
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', 'buyers', id],
    queryFn: () => getTasks({ related_table: 'buyers', related_id: id }),
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

  const taskMutation = useMutation({
    mutationFn: (title: string) => createTask({ title, related_table: 'buyers', related_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'buyers', id] });
      setNewTask('');
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

  const handleAddTask = () => {
    if (newTask.trim()) {
      taskMutation.mutate(newTask);
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
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditForm(b); setIsEditing(true); }}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <div className="flex gap-1 border-b mb-6">
          {(['overview', 'pipeline', 'tasks', 'comments', 'activity'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
          <div>
            <h3 className="font-semibold mb-4">Pipeline Status</h3>
            <div className="flex items-center gap-4">
              <span
                className="px-4 py-2 rounded-full text-white font-medium"
                style={{ backgroundColor: b.pipeline_stages?.[0]?.color || '#64748b' }}
              >
                {b.pipeline_stages?.[0]?.name || 'Unassigned'}
              </span>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">{b.pipeline_value ? `$${b.pipeline_value.toLocaleString()}` : '-'}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Expected Close Date</p>
                <p className="text-lg font-medium">{b.expected_close_date ? new Date(b.expected_close_date).toLocaleDateString() : '-'}</p>
              </div>
            </div>
            {b.pipeline_notes && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">Pipeline Notes</p>
                <p className="text-sm">{b.pipeline_notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold">Tasks</h3>
              <div className="flex-1" />
              <div className="flex gap-2">
                <Input
                  placeholder="New task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="w-64"
                />
                <Button size="sm" onClick={handleAddTask} disabled={taskMutation.isPending}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {tasks?.data?.map((task: any) => (
                <Card key={task.id} className="p-3 flex items-center gap-3">
                  <CheckSquare className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {task.priority}
                  </span>
                </Card>
              ))}
              {tasks?.data?.length === 0 && <p className="text-muted-foreground text-sm">No tasks assigned</p>}
            </div>
          </div>
        )}

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
          <div>
            <h3 className="font-semibold mb-4">Activity Log</h3>
            <p className="text-muted-foreground text-sm">Activity log will be displayed here from the activity_logs table.</p>
          </div>
        )}
      </Card>
    </div>
  );
}