'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { ProjectStatusPill } from '@/components/projects/ProjectStatusPill';
import { StatusChangeModal } from '@/components/projects/StatusChangeModal';
import { getProjects, changeProjectStatus } from '@/lib/api/projects';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Project, ProjectFilters as Filters } from '@/types/projects';
import { Plus, LayoutGrid, Table } from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 });
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [statusModalProject, setStatusModalProject] = useState<Project | null>(null);
  const { user } = useCurrentUser();
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await getProjects(filters);
      setProjects(response.projects);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const canChangeStatus = true;

  const handleStatusChange = async (status: string, reason: string) => {
    if (!statusModalProject?.id) return;

    try {
      await changeProjectStatus(statusModalProject.id, {
        status: status as any,
        reason,
        changed_by: user?.id,
      });
      await fetchProjects();
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setStatusModalProject(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[32px] font-medium text-foreground">Projects</h1>
          <p className="text-[14px] leading-[1.7] text-muted-foreground">
            Manage your projects and track progress
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/projects/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <ProjectFilters filters={filters} onFiltersChange={setFilters} />

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="surface-card p-5 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LayoutGrid className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-[18px] font-medium text-foreground mb-2">
            No projects yet
          </h3>
          <p className="text-[14px] text-muted-foreground mb-4">
            Create your first project to get started
          </p>
          <Button onClick={() => router.push('/dashboard/projects/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <>
          {/* View Toggle */}
          <div className="flex justify-end">
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="h-8"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Card View */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  canChangeStatus={canChangeStatus}
                  onChangeStatus={setStatusModalProject}
                />
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">
                      Project ID
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">
                      Project Name
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">
                      Assigned Person
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">
                      Supervisor
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">
                      Start Date
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">
                      Est. End
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-t border-border hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    >
                      <td className="px-4 py-3 text-[13px] text-muted-foreground font-mono">
                        {project.project_id}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground font-medium">
                        {project.project_name}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground">
                        {project.assigned_person?.name || project.contact_person || '-'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground">
                        {project.supervisor?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {canChangeStatus ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusModalProject(project);
                            }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <ProjectStatusPill status={project.status} />
                          </button>
                        ) : (
                          <ProjectStatusPill status={project.status} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {project.start_date
                          ? new Date(project.start_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {project.estimated_end_date
                          ? new Date(project.estimated_end_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/projects/${project.id}`);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      {statusModalProject && (
        <StatusChangeModal
          currentStatus={statusModalProject.status}
          isOpen={!!statusModalProject}
          onClose={() => setStatusModalProject(null)}
          onConfirm={handleStatusChange}
        />
      )}
    </div>
  );
}
