'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { getProject, updateProject } from '@/lib/api/projects';
import { Project, UpdateProjectInput } from '@/types/projects';
import { ArrowLeft, Save } from 'lucide-react';

export default function ProjectEditPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<UpdateProjectInput>({});

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const data = await getProject(projectId);
      setProject(data);
      setFormData({
        project_name: data.project_name,
        contact_person: data.contact_person,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        start_date: data.start_date || undefined,
        estimated_end_date: data.estimated_end_date || undefined,
        requirements_notes: data.requirements_notes,
        linked_email: data.linked_email || undefined,
        status: data.status,
      });
    } catch (error) {
      console.error('Failed to fetch project:', error);
      router.push(`/dashboard/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProject(projectId, formData);
      router.push(`/dashboard/projects/${projectId}`);
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project. Please try again.');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-[32px] font-medium text-foreground">Edit Project</h1>
          <p className="text-[14px] text-muted-foreground">
            {project?.project_id}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <Card className="surface-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project Name *</Label>
              <Input
                value={formData.project_name || ''}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                placeholder="Enter project name"
                required
              />
            </div>

            <div>
              <Label>Contact Person *</Label>
              <Input
                value={formData.contact_person || ''}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Enter contact person name"
                required
              />
            </div>

            <div>
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <Label>Contact Phone</Label>
              <Input
                value={formData.contact_phone || ''}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+1 234 567 890"
              />
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Estimated End Date</Label>
              <Input
                type="date"
                value={formData.estimated_end_date || ''}
                onChange={(e) => setFormData({ ...formData, estimated_end_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Status</Label>
              <select
                value={formData.status || 'Planned'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
              >
                <option value="Planned">Planned</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <Label>Linked Email</Label>
              <Input
                type="email"
                value={formData.linked_email || ''}
                onChange={(e) => setFormData({ ...formData, linked_email: e.target.value })}
                placeholder="project-email@example.com"
              />
            </div>
          </div>

          <div>
            <Label>Requirements Notes</Label>
            <Textarea
              value={formData.requirements_notes || ''}
              onChange={(e) => setFormData({ ...formData, requirements_notes: e.target.value })}
              placeholder="Enter project requirements and notes..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/dashboard/projects/${projectId}`)}
            >
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
