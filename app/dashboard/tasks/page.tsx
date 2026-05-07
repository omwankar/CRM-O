'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskStatusPill } from '@/components/tasks/TaskStatusPill';
import { TaskStatusChangeModal } from '@/components/tasks/TaskStatusChangeModal';
import { getTasks, changeTaskStatus } from '@/lib/api/tasks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Task, TaskFilters as Filters } from '@/types/tasks';
import { Plus, LayoutGrid, Table } from 'lucide-react';

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 });
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [cardSection, setCardSection] = useState<'ongoing' | 'completed' | 'cancelled'>('ongoing');
  const [statusModalTask, setStatusModalTask] = useState<Task | null>(null);
  const { user } = useCurrentUser();
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await getTasks(filters);
      setTasks(response.tasks);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const canChangeStatus = true;
  const showArchivedToggles = !filters.status || filters.status === ('all' as any);

  const ongoingTasks = showArchivedToggles
    ? tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled')
    : tasks;
  const completedTasks = showArchivedToggles ? tasks.filter((t) => t.status === 'Completed') : [];
  const cancelledTasks = showArchivedToggles ? tasks.filter((t) => t.status === 'Cancelled') : [];

  const handleStatusChange = async (status: string, reason: string) => {
    if (!statusModalTask?.id) return;
    try {
      await changeTaskStatus(statusModalTask.id, {
        status: status as any,
        reason,
        changed_by: user?.id,
      });
      await fetchTasks();
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setStatusModalTask(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[32px] font-medium text-foreground">Tasks</h1>
          <p className="text-[14px] leading-[1.7] text-muted-foreground">
            Manage your tasks and track progress
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/tasks/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters filters={filters} onFiltersChange={setFilters} />

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="surface-card p-5 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : ongoingTasks.length === 0 && completedTasks.length === 0 && cancelledTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LayoutGrid className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-[18px] font-medium text-foreground mb-2">No tasks yet</h3>
          <p className="text-[14px] text-muted-foreground mb-4">Create your first task to get started</p>
          <Button onClick={() => router.push('/dashboard/tasks/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      ) : (
        <>
          {/* View Toggle */}
          <div className="flex justify-end">
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button variant={viewMode === 'card' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('card')} className="h-8">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="h-8">
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Card View */}
          {viewMode === 'card' && (
            <div className="space-y-6">
              {showArchivedToggles && (
                <div className="flex items-center justify-between gap-3 border border-border rounded-lg p-1 w-fit">
                  <Button
                    variant={cardSection === 'ongoing' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8"
                    onClick={() => setCardSection('ongoing')}
                  >
                    Ongoing ({ongoingTasks.length})
                  </Button>
                  <Button
                    variant={cardSection === 'completed' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8"
                    onClick={() => setCardSection('completed')}
                  >
                    Completed ({completedTasks.length})
                  </Button>
                  <Button
                    variant={cardSection === 'cancelled' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8"
                    onClick={() => setCardSection('cancelled')}
                  >
                    Cancelled ({cancelledTasks.length})
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(showArchivedToggles
                  ? cardSection === 'completed'
                    ? completedTasks
                    : cardSection === 'cancelled'
                      ? cancelledTasks
                      : ongoingTasks
                  : ongoingTasks
                ).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    canChangeStatus={canChangeStatus}
                    onChangeStatus={setStatusModalTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="space-y-6">
              {showArchivedToggles && (
                <div className="flex items-center justify-between gap-3 border border-border rounded-lg p-1 w-fit">
                  <Button
                    variant={cardSection === 'ongoing' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8"
                    onClick={() => setCardSection('ongoing')}
                  >
                    Ongoing ({ongoingTasks.length})
                  </Button>
                  <Button
                    variant={cardSection === 'completed' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8"
                    onClick={() => setCardSection('completed')}
                  >
                    Completed ({completedTasks.length})
                  </Button>
                  <Button
                    variant={cardSection === 'cancelled' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8"
                    onClick={() => setCardSection('cancelled')}
                  >
                    Cancelled ({cancelledTasks.length})
                  </Button>
                </div>
              )}

              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">Task ID</th>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">Title</th>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">Assigned</th>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">Supervisor</th>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">Due Date</th>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showArchivedToggles
                      ? cardSection === 'completed'
                        ? completedTasks
                        : cardSection === 'cancelled'
                          ? cancelledTasks
                          : ongoingTasks
                      : ongoingTasks
                    ).map((task) => (
                    <tr
                      key={task.id}
                      className="border-t border-border hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                    >
                      <td className="px-4 py-3 text-[13px] text-muted-foreground font-mono">{task.task_id}</td>
                      <td className="px-4 py-3 text-[13px] text-foreground font-medium">{task.task_title}</td>
                      <td className="px-4 py-3 text-[13px]">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${task.task_type === 'admin' ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400' : 'bg-teal-500/10 text-teal-700 dark:text-teal-400'}`}>
                          {task.task_type === 'admin' ? 'Admin' : 'Sales'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground">{task.assigned_person?.name || '-'}</td>
                      <td className="px-4 py-3 text-[13px] text-foreground">{task.supervisor?.name || '-'}</td>
                      <td className="px-4 py-3">
                        {canChangeStatus ? (
                          <button onClick={(e) => { e.stopPropagation(); setStatusModalTask(task); }} className="hover:opacity-80 transition-opacity">
                            <TaskStatusPill status={task.status} />
                          </button>
                        ) : (
                          <TaskStatusPill status={task.status} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/tasks/${task.id}`); }}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {statusModalTask && (
        <TaskStatusChangeModal
          currentStatus={statusModalTask.status}
          isOpen={!!statusModalTask}
          onClose={() => setStatusModalTask(null)}
          onConfirm={handleStatusChange}
        />
      )}
    </div>
  );
}
