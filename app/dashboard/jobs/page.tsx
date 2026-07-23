'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CanWrite } from '@/components/auth/Can';
import { JobStatusPill } from '@/components/jobs/JobStatusPill';
import { getJobs } from '@/lib/api/jobs';
import {
  JOB_STATUSES_ORDER,
  JOB_STATUS_LABELS,
  JOB_MODE_LABELS,
  type Job,
  type JobFilters,
  type JobStatus,
  type JobModeType,
} from '@/types/jobs';

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JobFilters>({ page: 1, limit: 20 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await getJobs(filters);
      setJobs(res.jobs);
      setPagination({
        total: res.total,
        page: res.page,
        limit: res.limit,
        totalPages: res.totalPages,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[32px] font-medium text-foreground">Jobs / Shipments</h1>
          <p className="text-[14px] leading-[1.7] text-muted-foreground">
            Track shipments from booking through POD and close-out
          </p>
        </div>
        <CanWrite>
          <Button onClick={() => router.push('/dashboard/jobs/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </CanWrite>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search job #, title, lane…"
          className="max-w-xs"
          defaultValue={filters.search || ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setFilters({
                ...filters,
                page: 1,
                search: (e.target as HTMLInputElement).value || undefined,
              });
            }
          }}
        />
        <Select
          value={filters.status || 'all'}
          onValueChange={(v) =>
            setFilters({
              ...filters,
              page: 1,
              status: v === 'all' ? undefined : (v as JobStatus),
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {JOB_STATUSES_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {JOB_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.mode_type || 'all'}
          onValueChange={(v) =>
            setFilters({
              ...filters,
              page: 1,
              mode_type: v === 'all' ? undefined : (v as JobModeType),
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modes</SelectItem>
            {(Object.keys(JOB_MODE_LABELS) as JobModeType[]).map((m) => (
              <SelectItem key={m} value={m}>
                {JOB_MODE_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-14 w-14 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-1">No jobs yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a job from a Closed Won opportunity, or start one here.
          </p>
          <CanWrite>
            <Button onClick={() => router.push('/dashboard/jobs/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Button>
          </CanWrite>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Job</th>
                  <th className="px-4 py-3 font-medium">Lane</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t border-border hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-muted-foreground">{job.job_number}</div>
                      <div className="font-medium">{job.title}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {job.origin || job.destination
                        ? `${job.origin || '—'} → ${job.destination || '—'}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {job.mode_type ? JOB_MODE_LABELS[job.mode_type] : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {job.buyer?.id ? (
                        <Link
                          href={`/dashboard/buyers/${job.buyer.id}`}
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {job.buyer.buyer_name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <JobStatusPill status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {job.assigned_person?.name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {pagination.total} job{pagination.total === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
