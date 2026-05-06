'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { getTask, updateTask } from '@/lib/api/tasks';
import { getProjects } from '@/lib/api/projects';
import { Task, UpdateTaskInput } from '@/types/tasks';
import { supabase } from '@/lib/auth';
import { ArrowLeft, Save } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface ProjectOption {
  id: string;
  project_id: string;
  project_name: string;
}

export default function TaskEditPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  const [formData, setFormData] = useState<UpdateTaskInput>({});

  useEffect(() => {
    fetchTask();
    fetchUsers();
    fetchProjects();
  }, [taskId]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('id, email, full_name');
    setUsers(data || []);
  };

  const fetchProjects = async () => {
    try {
      const res = await getProjects({ limit: 100 });
      setProjects(res.projects.map((p: any) => ({ id: p.id, project_id: p.project_id, project_name: p.project_name })));
    } catch (e) {
      console.error('Failed to fetch projects', e);
    }
  };

  const fetchTask = async () => {
    setLoading(true);
    try {
      const data = await getTask(taskId);
      setTask(data);
      setFormData({
        task_title: data.task_title,
        task_type: data.task_type,
        project_id: data.project_id || undefined,
        assigned_person_id: data.assigned_person_id || undefined,
        supervisor_id: data.supervisor_id || undefined,
        assigned_date: data.assigned_date || undefined,
        due_date: data.due_date || undefined,
        status: data.status,
        notes: data.notes || undefined,
        linked_email: data.linked_email || undefined,
      });
    } catch (error) {
      console.error('Failed to fetch task:', error);
      router.push(`/dashboard/tasks/${taskId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTask(taskId, formData);
      router.push(`/dashboard/tasks/${taskId}`);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const currentTaskType = formData.task_type || task?.task_type || 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-[32px] font-medium text-foreground">Edit Task</h1>
          <p className="text-[14px] text-muted-foreground">{task?.task_id}</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card className="surface-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Task Type</Label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                    currentTaskType === 'admin' ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400' : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setFormData({ ...formData, task_type: 'admin', project_id: undefined })}
                >
                  Admin
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                    currentTaskType === 'sales' ? 'border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-400' : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setFormData({ ...formData, task_type: 'sales' })}
                >
                  Sales
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Task Title *</Label>
              <Input
                value={formData.task_title || ''}
                onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>

            {currentTaskType === 'sales' && (
              <div className="md:col-span-2">
                <Label>Project *</Label>
                <select
                  value={formData.project_id || ''}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value || undefined })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name} ({p.project_id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label>Assigned Person</Label>
              <select
                value={formData.assigned_person_id || ''}
                onChange={(e) => setFormData({ ...formData, assigned_person_id: e.target.value || undefined })}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
              >
                <option value="">Select employee...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Supervisor</Label>
              <select
                value={formData.supervisor_id || ''}
                onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value || undefined })}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
              >
                <option value="">Select supervisor...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Assigned Date</Label>
              <Input
                type="date"
                value={formData.assigned_date || ''}
                onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Status</Label>
              <select
                value={formData.status || 'Pending'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <Label>Linked Email</Label>
              <Input
                type="email"
                value={formData.linked_email || ''}
                onChange={(e) => setFormData({ ...formData, linked_email: e.target.value })}
                placeholder="task-email@example.com"
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter task notes..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => router.push(`/dashboard/tasks/${taskId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
