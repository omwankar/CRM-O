'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProjectStatusPill } from '@/components/projects/ProjectStatusPill';
import { StatusChangeModal } from '@/components/projects/StatusChangeModal';
import { TeamSection } from '@/components/projects/TeamSection';
import { AttachmentsSection } from '@/components/projects/AttachmentsSection';
import { EmailLogSection } from '@/components/projects/EmailLogSection';
import { StatusHistoryTimeline } from '@/components/projects/StatusHistoryTimeline';
import {
  getProject,
  changeProjectStatus,
  getProjectHistory,
  addProjectAttachment,
  deleteProjectAttachment,
  addProjectEmployee,
  removeProjectEmployee,
  markProjectEmailAsRead,
  updateProject,
} from '@/lib/api/projects';
import { getUsers } from '@/lib/api/users';
import { supabase } from '@/lib/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Project } from '@/types/projects';
import { ArrowLeft, Edit, Download, X } from 'lucide-react';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'assigned' | 'operations' | 'sales' | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; email: string; full_name: string | null }>>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<'admin' | 'assigned' | 'operations' | 'sales'>(
    'assigned'
  );
  const [addingMember, setAddingMember] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [updatingSupervisor, setUpdatingSupervisor] = useState(false);
  const { role: globalRole } = useCurrentUser();

  useEffect(() => {
    fetchProject();
    fetchUsers();
  }, [projectId]);

  const fetchUsers = async () => {
    try {
      const response = await getUsers({ limit: 200 });
      setAllUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users for team selection:', error);
    }
  };

  const fetchProject = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const data = await getProject(projectId);
      setProject(data);
      const historyData = await getProjectHistory(projectId);
      setHistory(historyData || []);

      // Determine user's role in this project
      const employee = data.employees?.find((e) => e.user_id === user.id);
      setUserRole(employee?.role || null);
    } catch (error) {
      console.error('Failed to fetch project:', error);
      router.push('/dashboard/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await changeProjectStatus(projectId, {
        status: status as any,
        reason,
        changed_by: user.id,
      });

      await fetchProject();
      setShowStatusModal(false);
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('Failed to change status. Please try again.');
    }
  };

  const canEdit =
    userRole === 'admin' ||
    userRole === 'assigned' ||
    globalRole === 'super_admin' ||
    globalRole === 'admin' ||
    globalRole === 'manager';

  const resolveAttachmentUrl = (fileUrl: string) => {
    if (!fileUrl) return '#';
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    const { data } = supabase.storage.from('documents').getPublicUrl(fileUrl);
    return data.publicUrl;
  };

  const handleAttachmentUpload = async (files: File[]) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !project) return;

      await Promise.all(
        files.map(async (file) => {
          const extension = file.name.split('.').pop() || 'bin';
          const path = `projects/${project.id}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(path, file, { upsert: false });

          if (uploadError) throw uploadError;

          await addProjectAttachment(project.id, {
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_url: path,
            file_size: file.size,
            uploaded_by: user.id,
          });
        })
      );

      await fetchProject();
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      alert('Failed to upload attachment.');
    }
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    try {
      if (!project) return;
      await deleteProjectAttachment(project.id, attachmentId);
      await fetchProject();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Failed to delete attachment.');
    }
  };

  const openAddMemberModal = () => {
    setSelectedMemberId('');
    setSelectedMemberRole('assigned');
    setMemberSearch('');
    setShowAddMemberModal(true);
  };

  const handleAddEmployee = async () => {
    if (!project || !selectedMemberId) return;
    setAddingMember(true);
    try {
      await addProjectEmployee(project.id, {
        user_id: selectedMemberId,
        role: selectedMemberRole,
      });
      await fetchProject();
      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Failed to add employee:', error);
      alert('Failed to add employee. This member may already be assigned.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveEmployee = async (userId: string) => {
    if (!project) return;
    try {
      await removeProjectEmployee(project.id, userId);
      await fetchProject();
    } catch (error) {
      console.error('Failed to remove employee:', error);
      alert('Failed to remove employee.');
    }
  };

  const handleLinkEmail = async (email: string) => {
    if (!project) return;
    try {
      await updateProject(project.id, { linked_email: email });
      await fetchProject();
    } catch (error) {
      console.error('Failed to link email:', error);
      alert('Failed to link email.');
    }
  };

  const handleMarkAsRead = async (emailId: string) => {
    if (!project) return;
    try {
      await markProjectEmailAsRead(project.id, emailId);
      await fetchProject();
    } catch (error) {
      console.error('Failed to mark email as read:', error);
      alert('Failed to update email status.');
    }
  };

  const handleExportPdf = () => {
    if (!project) return;
    const rows = [
      ['Project Name', project.project_name],
      ['Project ID', project.project_id],
      ['Assigned Person', project.assigned_person?.name || '-'],
      ['Supervisor', project.supervisor?.name || '-'],
      ['Status', project.status],
      ['Contact Email', project.contact_email || '-'],
      ['Contact Phone', project.contact_phone || '-'],
      ['Start Date', project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'],
      ['Estimated End Date', project.estimated_end_date ? new Date(project.estimated_end_date).toLocaleDateString() : '-'],
      ['Linked Email', project.linked_email || '-'],
      ['Notes', project.requirements_notes || '-'],
      ['Team Members', String(project.employees?.length || 0)],
      ['Attachments', String(project.attachments?.length || 0)],
    ];
    const printable = `
      <html>
        <head><title>Project Export - ${project.project_name}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h1>Project Export</h1>
          <h2>${project.project_name}</h2>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            ${rows.map(([k, v]) => `<tr><td style="font-weight: 600; width: 240px;">${k}</td><td>${String(v)}</td></tr>`).join('')}
          </table>
          <h3 style="margin-top: 24px;">Status History</h3>
          <ul>${history.map((h) => `<li>${new Date(h.changed_at).toLocaleString()} - ${h.old_status || 'None'} -> ${h.new_status} (${h.reason})</li>`).join('')}</ul>
          <h3 style="margin-top: 24px;">Attachments</h3>
          <ul>${(project.attachments || []).map((a) => `<li>${a.file_name}</li>`).join('')}</ul>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(printable);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleAssignSupervisor = async () => {
    if (!project || !selectedSupervisorId) return;
    setUpdatingSupervisor(true);
    try {
      await updateProject(project.id, { supervisor_id: selectedSupervisorId });
      await fetchProject();
      setSelectedSupervisorId('');
    } catch (error) {
      console.error('Failed to assign supervisor:', error);
      alert('Failed to assign supervisor.');
    } finally {
      setUpdatingSupervisor(false);
    }
  };

  const handleRemoveSupervisor = async () => {
    if (!project) return;
    setUpdatingSupervisor(true);
    try {
      await updateProject(project.id, { supervisor_id: null });
      await fetchProject();
      setSelectedSupervisorId('');
    } catch (error) {
      console.error('Failed to remove supervisor:', error);
      alert('Failed to remove supervisor.');
    } finally {
      setUpdatingSupervisor(false);
    }
  };

  const assignedUserIds = new Set((project?.employees || []).map((member) => member.user_id));
  const candidateUsers = allUsers.filter((user) => !assignedUserIds.has(user.id));
  const filteredCandidateUsers = candidateUsers.filter((user) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (user.full_name || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => router.push('/dashboard/projects')} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[32px] font-medium text-foreground">{project.project_name}</h1>
            <code className="text-[13px] text-muted-foreground font-mono">{project.project_id}</code>
          </div>
          <p className="text-[14px] text-muted-foreground">
            Last updated {new Date(project.updated_at).toLocaleString()}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPdf}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Notification Bar */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-[13px] text-emerald-700 dark:text-emerald-400">
          Notifications active — assigned employees are being notified of updates
        </p>
      </div>

      {/* Status Pill with inline change */}
      <div className="flex items-center gap-4">
        <span className="text-[14px] text-muted-foreground">Status:</span>
        {canEdit ? (
          <button
            onClick={() => setShowStatusModal(true)}
            className="hover:opacity-80 transition-opacity"
          >
            <ProjectStatusPill status={project.status} />
          </button>
        ) : (
          <ProjectStatusPill status={project.status} />
        )}
      </div>

      {/* Project Details Section */}
      <Card className="surface-card p-6">
        <h3 className="text-[18px] font-medium text-foreground mb-4">Project Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] text-muted-foreground">Project Name</label>
            <p className="text-[14px] text-foreground mt-1">{project.project_name}</p>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Assigned Person</label>
            <p className="text-[14px] text-foreground mt-1">
              {project.assigned_person?.name || project.assigned_person_id || '-'}
            </p>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Supervisor</label>
            <p className="text-[14px] text-foreground mt-1">
              {project.supervisor?.name || project.supervisor_id || '-'}
            </p>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Contact Email</label>
            <p className="text-[14px] text-foreground mt-1">{project.contact_email || '-'}</p>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Contact Phone</label>
            <p className="text-[14px] text-foreground mt-1">{project.contact_phone || '-'}</p>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Start Date</label>
            <p className="text-[14px] text-foreground mt-1">
              {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Estimated End Date</label>
            <p className="text-[14px] text-foreground mt-1">
              {project.estimated_end_date ? new Date(project.estimated_end_date).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>
      </Card>

      {/* Requirements Section */}
      <Card className="surface-card p-6">
        <h3 className="text-[18px] font-medium text-foreground mb-4">Requirements</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-muted-foreground">Notes</label>
            <p className="text-[14px] text-foreground mt-1 whitespace-pre-wrap">
              {project.requirements_notes || 'No requirements notes added yet.'}
            </p>
          </div>
          <AttachmentsSection
            attachments={(project.attachments || []).map((attachment) => ({
              ...attachment,
              file_url: resolveAttachmentUrl(attachment.file_url),
            }))}
            canUpload={canEdit}
            onUpload={canEdit ? handleAttachmentUpload : undefined}
            onDelete={canEdit ? handleAttachmentDelete : undefined}
          />
        </div>
      </Card>

      {/* Team Section */}
      <Card className="surface-card p-6">
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-[11px] text-muted-foreground">Assigned Person</p>
            <p className="mt-1 text-[13px] font-medium text-foreground">
              {project.assigned_person?.name || project.assigned_person_id || '-'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {project.assigned_person?.email || ''}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-[11px] text-muted-foreground">Supervisor</p>
            <p className="mt-1 text-[13px] font-medium text-foreground">
              {project.supervisor?.name || project.supervisor_id || '-'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {project.supervisor?.email || ''}
            </p>
          </div>
        </div>
        <TeamSection
          employees={project.employees || []}
          userRole={userRole || undefined}
          canEdit={canEdit}
          onAddEmployee={canEdit ? openAddMemberModal : undefined}
          onRemoveEmployee={canEdit ? handleRemoveEmployee : undefined}
        />
      </Card>

      {/* Supervisor Section */}
      <Card className="surface-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-medium text-foreground">Supervisor</h3>
            <p className="text-[13px] text-muted-foreground mt-1">
              Assign, change, or remove project supervisor from here.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Current Supervisor</p>
            <p className="text-[13px] font-medium text-foreground">
              {project.supervisor?.name || project.supervisor_id || 'Not assigned'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {project.supervisor?.email || ''}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-[12px] text-muted-foreground">Select Supervisor</label>
              <select
                value={selectedSupervisorId}
                onChange={(e) => setSelectedSupervisorId(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
              >
                <option value="">Select supervisor...</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAssignSupervisor}
                disabled={!selectedSupervisorId || updatingSupervisor}
              >
                {updatingSupervisor ? 'Saving...' : 'Assign Supervisor'}
              </Button>
              <Button
                variant="outline"
                onClick={handleRemoveSupervisor}
                disabled={updatingSupervisor || !project.supervisor_id}
              >
                Remove Supervisor
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Email Integration Section */}
      <Card className="surface-card p-6">
        <EmailLogSection
          emails={project.emails || []}
          linkedEmail={project.linked_email}
          canLink={canEdit}
          onLinkEmail={canEdit ? handleLinkEmail : undefined}
          onMarkAsRead={handleMarkAsRead}
        />
      </Card>

      {/* Status History Timeline */}
      <Card className="surface-card p-6">
        <h3 className="text-[18px] font-medium text-foreground mb-4">Status History</h3>
        <StatusHistoryTimeline history={history} />
      </Card>

      {/* Status Change Modal */}
      <StatusChangeModal
        currentStatus={project.status}
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleStatusChange}
      />

      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddMemberModal(false)}
          />
          <div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-5 shadow-xl">
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-[18px] font-medium text-foreground">Add Team Member</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Select an employee and role for this project.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-[12px] text-muted-foreground">Search Employee</label>
                <Input
                  placeholder="Search by name or email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] text-muted-foreground">Employee</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
                >
                  <option value="">Select employee...</option>
                  {filteredCandidateUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[12px] text-muted-foreground">Role</label>
                <select
                  value={selectedMemberRole}
                  onChange={(e) =>
                    setSelectedMemberRole(e.target.value as 'admin' | 'assigned' | 'operations' | 'sales')
                  }
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
                >
                  <option value="admin">Admin</option>
                  <option value="assigned">Assigned</option>
                  <option value="operations">Operations</option>
                  <option value="sales">Sales</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAddMemberModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEmployee} disabled={!selectedMemberId || addingMember}>
                {addingMember ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
