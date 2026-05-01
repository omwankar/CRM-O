'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProjectStatusPill } from '@/components/projects/ProjectStatusPill';
import { StatusChangeModal } from '@/components/projects/StatusChangeModal';
import { TeamSection } from '@/components/projects/TeamSection';
import { AttachmentsSection } from '@/components/projects/AttachmentsSection';
import { EmailLogSection } from '@/components/projects/EmailLogSection';
import { StatusHistoryTimeline } from '@/components/projects/StatusHistoryTimeline';
import { getProject, changeProjectStatus } from '@/lib/api/projects';
import { supabase } from '@/lib/auth';
import { Project } from '@/types/projects';
import { ArrowLeft, Edit, Bell, ChevronRight } from 'lucide-react';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'assigned' | 'operations' | 'sales' | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

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

  const canEdit = userRole === 'admin' || userRole === 'assigned';

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
          <Button onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
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
              {project.assigned_person ? project.assigned_person.name : '-'}
            </p>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground">Supervisor</label>
            <p className="text-[14px] text-foreground mt-1">
              {project.supervisor ? project.supervisor.name : '-'}
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
            attachments={project.attachments || []}
            canUpload={canEdit}
            onDelete={canEdit ? async (id) => {
              // Handle delete attachment
              console.log('Delete attachment:', id);
            } : undefined}
          />
        </div>
      </Card>

      {/* Team Section */}
      <Card className="surface-card p-6">
        <TeamSection
          employees={project.employees || []}
          userRole={userRole || undefined}
          canEdit={userRole === 'admin'}
          onAddEmployee={userRole === 'admin' ? () => {
            // Open add employee modal
            console.log('Add employee');
          } : undefined}
          onRemoveEmployee={userRole === 'admin' ? async (userId) => {
            // Handle remove employee
            console.log('Remove employee:', userId);
          } : undefined}
        />
      </Card>

      {/* Email Integration Section */}
      <Card className="surface-card p-6">
        <EmailLogSection
          emails={project.emails || []}
          linkedEmail={project.linked_email}
          canLink={canEdit}
          onLinkEmail={canEdit ? async (email) => {
            // Handle link email
            console.log('Link email:', email);
          } : undefined}
          onMarkAsRead={async (emailId) => {
            // Handle mark as read
            console.log('Mark as read:', emailId);
          }}
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
    </div>
  );
}
