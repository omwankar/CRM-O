'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { addTaskAttachment, createTask } from '@/lib/api/tasks';
import { getProjects } from '@/lib/api/projects';
import { supabase } from '@/lib/auth';
import { ArrowLeft, ArrowRight, Upload, X } from 'lucide-react';

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

export default function NewTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  useEffect(() => {
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
    fetchUsers();
    fetchProjects();
  }, []);

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    task_title: '',
    task_type: 'admin' as 'admin' | 'sales',
    project_id: '',
    assigned_person_id: '',
    supervisor_id: '',
    assigned_date: '',
    due_date: '',
    status: 'Pending' as 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled',
  });

  // Step 2: Notes
  const [notes, setNotes] = useState('');
  const [linkedEmail, setLinkedEmail] = useState('');

  // Step 3: Attachments
  const [attachments, setAttachments] = useState<File[]>([]);

  const uploadTaskAttachments = async (taskId: string, userId: string) => {
    await Promise.all(
      attachments.map(async (file) => {
        const extension = file.name.split('.').pop() || 'bin';
        const filePath = `tasks/${taskId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        await addTaskAttachment(taskId, {
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_url: filePath,
          file_size: file.size,
          uploaded_by: userId,
        });
      })
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const task = await createTask({
        task_title: basicInfo.task_title,
        task_type: basicInfo.task_type,
        project_id: basicInfo.task_type === 'sales' ? basicInfo.project_id || undefined : undefined,
        assigned_person_id: basicInfo.assigned_person_id || undefined,
        supervisor_id: basicInfo.supervisor_id || undefined,
        assigned_date: basicInfo.assigned_date || undefined,
        due_date: basicInfo.due_date || undefined,
        status: basicInfo.status,
        notes: notes || undefined,
        linked_email: linkedEmail || undefined,
        created_by: user.id,
      });

      if (attachments.length > 0) {
        try {
          await uploadTaskAttachments(task.id, user.id);
        } catch (uploadError) {
          console.error('Task created, but attachment upload failed:', uploadError);
          alert('Task created, but attachments failed to upload. You can add them from the task detail page.');
        }
      }

      router.push(`/dashboard/tasks/${task.id}`);
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep2 = basicInfo.task_title && (basicInfo.task_type === 'admin' || basicInfo.project_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/tasks')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-[32px] font-medium text-foreground">New Task</h1>
          <p className="text-[14px] text-muted-foreground">Create a new task</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {['Basic Info', 'Notes & Details', 'Attachments'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-medium ${
              step > i + 1 ? 'bg-primary text-primary-foreground' : step === i + 1 ? 'bg-primary/10 text-primary border border-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            <span className={`text-[13px] ${step === i + 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
            {i < 2 && <div className="w-8 h-[1px] bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card className="surface-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Task Type *</Label>
              <div className="flex gap-2 mt-1">
                <button
                  className={`flex-1 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                    basicInfo.task_type === 'admin' ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400' : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setBasicInfo({ ...basicInfo, task_type: 'admin', project_id: '' })}
                >
                  Admin
                </button>
                <button
                  className={`flex-1 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                    basicInfo.task_type === 'sales' ? 'border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-400' : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setBasicInfo({ ...basicInfo, task_type: 'sales' })}
                >
                  Sales
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Task Title *</Label>
              <Input
                value={basicInfo.task_title}
                onChange={(e) => setBasicInfo({ ...basicInfo, task_title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>

            {basicInfo.task_type === 'sales' && (
              <div className="md:col-span-2">
                <Label>Project *</Label>
                <select
                  value={basicInfo.project_id}
                  onChange={(e) => setBasicInfo({ ...basicInfo, project_id: e.target.value })}
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
                value={basicInfo.assigned_person_id}
                onChange={(e) => setBasicInfo({ ...basicInfo, assigned_person_id: e.target.value })}
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
                value={basicInfo.supervisor_id}
                onChange={(e) => setBasicInfo({ ...basicInfo, supervisor_id: e.target.value })}
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
                value={basicInfo.assigned_date}
                onChange={(e) => setBasicInfo({ ...basicInfo, assigned_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={basicInfo.due_date}
                onChange={(e) => setBasicInfo({ ...basicInfo, due_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Status</Label>
              <select
                value={basicInfo.status}
                onChange={(e) => setBasicInfo({ ...basicInfo, status: e.target.value as any })}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setStep(2)} disabled={!canProceedToStep2}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Notes & Details */}
      {step === 2 && (
        <Card className="surface-card p-6">
          <div className="space-y-4">
            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter task notes and details..."
                rows={6}
              />
            </div>

            <div>
              <Label>Linked Email</Label>
              <Input
                type="email"
                value={linkedEmail}
                onChange={(e) => setLinkedEmail(e.target.value)}
                placeholder="task-email@example.com"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Attachments */}
      {step === 3 && (
        <Card className="surface-card p-6">
          <div className="space-y-4">
            <Label>Attachments</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground mb-2">Drag & drop files here, or click to browse</p>
              <Input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setAttachments([...attachments, ...Array.from(e.target.files)]);
                  }
                }}
                className="max-w-xs mx-auto"
              />
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border border-border rounded-lg">
                    <span className="text-[13px] text-foreground">{file.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
