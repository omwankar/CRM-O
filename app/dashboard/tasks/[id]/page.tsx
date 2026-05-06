'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TaskStatusPill } from '@/components/tasks/TaskStatusPill';
import { TaskTypeBadge } from '@/components/tasks/TaskTypeBadge';
import { TaskStatusChangeModal } from '@/components/tasks/TaskStatusChangeModal';
import { getTask, updateTask, changeTaskStatus, getTaskHistory, deleteTaskAttachment, addTaskAttachment, markTaskEmailAsRead, addTaskEmployee, removeTaskEmployee } from '@/lib/api/tasks';
import { getUsers } from '@/lib/api/users';
import { supabase } from '@/lib/auth';
import { Task, TaskStatusHistory } from '@/types/tasks';
import { ArrowLeft, Edit, UserRoundCheck, UserCog, Link2, Upload, X, Mail, Users, Plus, Trash2 } from 'lucide-react';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [history, setHistory] = useState<TaskStatusHistory[]>([]);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; email: string; full_name: string | null }>>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<'admin' | 'assigned' | 'viewer'>('assigned');
  const [addingMember, setAddingMember] = useState(false);
  const [linkedEmailInput, setLinkedEmailInput] = useState('');
  const [linkingEmail, setLinkingEmail] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);

  useEffect(() => {
    fetchTask();
    fetchUsers();
  }, [taskId]);

  const fetchUsers = async () => {
    try {
      const response = await getUsers({ limit: 200 });
      setAllUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchTask = async () => {
    setLoading(true);
    try {
      const data = await getTask(taskId);
      setTask(data);
      setLinkedEmailInput(data.linked_email || '');

      const hist = await getTaskHistory(taskId);
      setHistory(hist);
    } catch (error) {
      console.error('Failed to fetch task:', error);
      router.push('/dashboard/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await changeTaskStatus(taskId, {
        status: status as any,
        reason,
        changed_by: user.id,
      });

      await fetchTask();
      setShowStatusModal(false);
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('Failed to change status. Please try again.');
    }
  };

  const resolveAttachmentUrl = (fileUrl: string) => {
    if (!fileUrl) return '#';
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    const { data } = supabase.storage.from('documents').getPublicUrl(fileUrl);
    return data.publicUrl;
  };

  const createTaskAttachmentPath = (file: File) => {
    const extension = file.name.split('.').pop() || 'bin';
    return `tasks/${taskId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !task) return;
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (files.length === 0) return;

    setUploadingAttachments(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await Promise.all(
        files.map(async (file) => {
          const filePath = createTaskAttachmentPath(file);
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file, { upsert: false });

          if (uploadError) throw uploadError;

          await addTaskAttachment(task.id, {
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_url: filePath,
            file_size: file.size,
            uploaded_by: user.id,
          });
        })
      );

      await fetchTask();
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      alert('Failed to upload attachment. Please try again.');
    } finally {
      setUploadingAttachments(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return;
    try {
      await deleteTaskAttachment(task.id, attachmentId);
      await fetchTask();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const handleMarkEmailRead = async (emailId: string) => {
    if (!task) return;
    try {
      await markTaskEmailAsRead(task.id, emailId);
      await fetchTask();
    } catch (error) {
      console.error('Failed to mark email as read:', error);
    }
  };

  const handleLinkEmail = async () => {
    if (!task) return;
    setLinkingEmail(true);
    try {
      const linkedEmail = linkedEmailInput.trim();
      await updateTask(task.id, { linked_email: linkedEmail });
      await fetchTask();
    } catch (error) {
      console.error('Failed to link email:', error);
      alert('Failed to link email. Please check the email address and try again.');
    } finally {
      setLinkingEmail(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedMemberId || !task) return;
    setAddingMember(true);
    try {
      await addTaskEmployee(task.id, { user_id: selectedMemberId, role: selectedMemberRole });
      await fetchTask();
      setShowAddMemberModal(false);
      setSelectedMemberId('');
      setMemberSearch('');
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Failed to add member. Please try again.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!task) return;
    try {
      await removeTaskEmployee(task.id, userId);
      await fetchTask();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  // Filter users for member search (exclude already added members)
  const existingMemberIds = new Set(task?.employees?.map(e => e.user_id) || []);
  const filteredUsers = allUsers.filter(u => 
    !existingMemberIds.has(u.id) && 
    (u.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) || 
     u.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'assigned': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'viewer': return 'bg-slate-500/10 text-slate-700 dark:text-slate-400';
      default: return 'bg-slate-500/10 text-slate-700 dark:text-slate-400';
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

  if (!task) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Task not found</p>
        <Button onClick={() => router.push('/dashboard/tasks')} className="mt-4">Back to Tasks</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/tasks')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[32px] font-medium text-foreground">{task.task_title}</h1>
            <code className="text-[13px] text-muted-foreground font-mono">{task.task_id}</code>
          </div>
          <div className="flex items-center gap-2">
            <TaskTypeBadge type={task.task_type} />
            <TaskStatusPill status={task.status} />
          </div>
        </div>
        <Button onClick={() => router.push(`/dashboard/tasks/${taskId}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Status Change */}
      <div className="flex items-center gap-4">
        <span className="text-[14px] text-muted-foreground">Status:</span>
        <button onClick={() => setShowStatusModal(true)} className="hover:opacity-80 transition-opacity">
          <TaskStatusPill status={task.status} />
        </button>
      </div>

      {/* Task Details */}
      <Card className="surface-card p-6">
        <h3 className="text-[18px] font-medium text-foreground mb-4">Task Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] text-muted-foreground">Task Title</label>
            <p className="text-[14px] text-foreground mt-1">{task.task_title}</p>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Assigned Person</label>
            <p className="text-[14px] text-foreground mt-1 flex items-center gap-2">
              <UserRoundCheck className="h-3.5 w-3.5 text-muted-foreground" />
              {task.assigned_person?.name || '-'}
            </p>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Supervisor</label>
            <p className="text-[14px] text-foreground mt-1 flex items-center gap-2">
              <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
              {task.supervisor?.name || '-'}
            </p>
          </div>
          {task.task_type === 'sales' && task.project && (
            <div>
              <label className="text-[12px] text-muted-foreground">Linked Project</label>
              <p className="text-[14px] text-foreground mt-1 flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span
                  className="text-primary cursor-pointer hover:underline"
                  onClick={() => router.push(`/dashboard/projects/${task.project!.id}`)}
                >
                  {task.project.project_name}
                </span>
              </p>
            </div>
          )}
          <div>
            <label className="text-[12px] text-muted-foreground">Assigned Date</label>
            <p className="text-[14px] text-foreground mt-1">
              {task.assigned_date ? new Date(task.assigned_date).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Due Date</label>
            <p className="text-[14px] text-foreground mt-1">
              {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Linked Email</label>
            <p className="text-[14px] text-foreground mt-1">{task.linked_email || '-'}</p>
          </div>
        </div>
      </Card>

      {/* Team Members */}
      <Card className="surface-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-medium text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowAddMemberModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* Supervisor */}
        {task.supervisor && (
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-[12px] text-muted-foreground mb-2">Supervisor</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-[13px] font-medium">
                  {task.supervisor.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SU'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[14px] font-medium text-foreground">{task.supervisor.name}</p>
                <p className="text-[12px] text-muted-foreground">{task.supervisor.email}</p>
              </div>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
                Supervisor
              </span>
            </div>
          </div>
        )}

        {/* Assigned Person */}
        {task.assigned_person && (
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-[12px] text-muted-foreground mb-2">Assigned Person</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-[13px] font-medium">
                  {task.assigned_person.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AP'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[14px] font-medium text-foreground">{task.assigned_person.name}</p>
                <p className="text-[12px] text-muted-foreground">{task.assigned_person.email}</p>
              </div>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-500/10 text-green-700 dark:text-green-400">
                Assigned
              </span>
            </div>
          </div>
        )}

        {/* Team Members List */}
        <div>
          <p className="text-[12px] text-muted-foreground mb-2">Team</p>
          {task.employees && task.employees.length > 0 ? (
            <div className="space-y-2">
              {task.employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-[13px] font-medium">
                      {emp.avatar_initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-foreground">{emp.name}</p>
                    <p className="text-[12px] text-muted-foreground">{emp.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getRoleBadgeColor(emp.role)}`}>
                    {emp.role}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(emp.user_id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">No team members yet</p>
          )}
        </div>
      </Card>

      {/* Notes */}
      {task.notes && (
        <Card className="surface-card p-6">
          <h3 className="text-[18px] font-medium text-foreground mb-4">Notes</h3>
          <p className="text-[14px] text-foreground whitespace-pre-wrap">{task.notes}</p>
        </Card>
      )}

      {/* Attachments */}
      <Card className="surface-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-medium text-foreground">Attachments</h3>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span><Upload className="h-4 w-4 mr-2" />{uploadingAttachments ? 'Uploading...' : 'Upload'}</span>
            </Button>
            <input
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
              onChange={handleFileUpload}
              disabled={uploadingAttachments}
            />
          </label>
        </div>
        {task.attachments && task.attachments.length > 0 ? (
          <div className="space-y-2">
            {task.attachments.map((att) => (
              <div key={att.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <a href={resolveAttachmentUrl(att.file_url)} target="_blank" rel="noopener noreferrer" className="text-[13px] text-primary hover:underline">
                  {att.file_name}
                </a>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteAttachment(att.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">No attachments yet</p>
        )}
      </Card>

      {/* Emails */}
      <Card className="surface-card p-6">
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-[18px] font-medium text-foreground">Linked Emails</h3>
            <p className="text-[13px] text-muted-foreground mt-1">
              {task.linked_email ? `Linked to ${task.linked_email}` : 'No email address linked yet'}
            </p>
          </div>
          <div className="flex gap-2 md:w-[420px]">
            <Input
              type="email"
              value={linkedEmailInput}
              onChange={(e) => setLinkedEmailInput(e.target.value)}
              placeholder="task-email@example.com"
            />
            <Button onClick={handleLinkEmail} disabled={linkingEmail}>
              {linkingEmail ? 'Saving...' : task.linked_email ? 'Update' : 'Link'}
            </Button>
          </div>
        </div>
        {task.emails && task.emails.length > 0 ? (
          <div className="space-y-2">
            {task.emails.map((email) => (
              <div key={email.id} className={`flex items-center justify-between p-3 border border-border rounded-lg ${!email.is_read ? 'bg-primary/5' : ''}`}>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[13px] text-foreground font-medium">{email.subject}</p>
                    <p className="text-[11px] text-muted-foreground">{email.sender_name} — {new Date(email.received_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {!email.is_read && (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkEmailRead(email.id)}>
                    Mark Read
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">No linked emails</p>
        )}
      </Card>

      {/* Status History */}
      {history.length > 0 && (
        <Card className="surface-card p-6">
          <h3 className="text-[18px] font-medium text-foreground mb-4">Status History</h3>
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p className="text-[13px] text-foreground">
                    <span className="font-medium">{h.old_status || 'Created'}</span>
                    {' → '}
                    <span className="font-medium">{h.new_status}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {h.reason} — by {h.changed_by_name} on {new Date(h.changed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddMemberModal(false)} />
          <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-medium text-foreground">Add Team Member</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-foreground mb-2 block">Search User</label>
                <Input
                  placeholder="Search by name or email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-foreground mb-2 block">Role</label>
                <select
                  value={selectedMemberRole}
                  onChange={(e) => setSelectedMemberRole(e.target.value as any)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
                >
                  <option value="assigned">Assigned</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedMemberId(user.id)}
                      className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors ${
                        selectedMemberId === user.id ? 'bg-primary/5 border-l-2 border-primary' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px]">
                          {(user.full_name || user.email)?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{user.full_name || user.email}</p>
                        {user.full_name && <p className="text-[11px] text-muted-foreground">{user.email}</p>}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="p-4 text-[13px] text-muted-foreground text-center">No users found</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowAddMemberModal(false)}>Cancel</Button>
              <Button onClick={handleAddMember} disabled={!selectedMemberId || addingMember}>
                {addingMember ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <TaskStatusChangeModal
          currentStatus={task.status}
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          onConfirm={handleStatusChange}
        />
      )}
    </div>
  );
}
