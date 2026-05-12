'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EnquiryStage, Quotation, UpdateQuotationInput } from '@/types/quotations';
import { PRIORITY_BADGE_CLASSES } from '@/types/quotations';
import { PriorityBadge } from '@/components/quotations/PriorityBadge';
import { StatusStepper } from '@/components/quotations/StatusStepper';
import { cn } from '@/lib/utils';
import { getUsers } from '@/lib/api/users';

function formatDisplayDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function deadlineInputValue(iso?: string | null) {
  if (!iso) return '';
  const s = String(iso);
  return s.length >= 10 ? s.slice(0, 10) : '';
}

type Props = {
  quotation: Quotation;
  enquiryStage: EnquiryStage;
  isSaving?: boolean;
  onPatch: (data: UpdateQuotationInput) => Promise<void>;
  onStageChange?: (stage: EnquiryStage) => void;
};

export function EnquiryInfoPanel({
  quotation,
  enquiryStage,
  isSaving,
  onPatch,
  onStageChange,
}: Props) {
  const pending = !!isSaving;

  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null; email: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getUsers({ limit: 200 });
        if (!cancelled) setUsers(res.data || []);
      } catch {
        if (!cancelled) setUsers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lead = quotation.users;

  const userOptions = useMemo(() => {
    const list = [...users];
    if (quotation.enquiry_lead && lead?.id && !list.some((u) => u.id === quotation.enquiry_lead)) {
      list.unshift({
        id: lead.id,
        full_name: lead.full_name,
        email: lead.email || '',
      });
    }
    return list;
  }, [users, quotation.enquiry_lead, lead]);

  const linkedProjectName = quotation.projects?.project_name;
  const hasLinkedProject = Boolean(quotation.project_id);

  const [standaloneCustomer, setStandaloneCustomer] = useState(
    () => quotation.standalone_project_name ?? '',
  );
  useEffect(() => {
    setStandaloneCustomer(quotation.standalone_project_name ?? '');
  }, [quotation.id, quotation.standalone_project_name]);
  const enquiryName =
    quotation.enquiry_title?.trim() ||
    quotation.requirement.slice(0, 80) + (quotation.requirement.length > 80 ? '…' : '');
  const contactParts = [lead?.full_name || '—', lead?.phone || ''].filter((x) => x && x !== '—');
  const contactLine = contactParts.length ? contactParts.join(' | ') : '—';

  const priorityValue = quotation.priority || 'medium';
  const priorityKey = priorityValue === 'low' || priorityValue === 'high' ? priorityValue : 'medium';

  return (
    <Card className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-card shadow-sm dark:border-border">
      <div className="space-y-0 divide-y divide-border/80">
        <div className="bg-muted/30 px-5 py-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Enquiry ID</p>
              <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                {quotation.quotation_number}
              </span>
            </div>
            <div className="lg:col-span-2">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Enquiry Name</p>
              <p className="text-sm font-semibold leading-snug text-foreground">{enquiryName}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Customer Name</p>
              {hasLinkedProject ? (
                <>
                  <p className="text-sm font-medium text-foreground">{linkedProjectName || '—'}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                    Pulled from the linked project. To change it, use <span className="font-medium text-foreground/80">Edit</span> and pick another project or switch to standalone.
                  </p>
                </>
              ) : (
                <>
                  <Input
                    disabled={pending}
                    className="h-9 rounded-md border-input bg-background text-sm font-medium shadow-sm"
                    placeholder="e.g. company or site name"
                    value={standaloneCustomer}
                    onChange={(e) => setStandaloneCustomer(e.target.value)}
                    onBlur={() => {
                      const next = standaloneCustomer.trim();
                      const prev = (quotation.standalone_project_name || '').trim();
                      if (next === prev) return;
                      void onPatch({ standalone_project_name: next ? next : undefined });
                    }}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Saved when you leave this field. Shown on cards and search as the customer.
                  </p>
                </>
              )}
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Contact</p>
              <p className="text-sm text-foreground">{contactLine}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Email</p>
              <p className="text-sm break-all text-foreground">{lead?.email || '—'}</p>
            </div>
          </div>
        </div>

        <div className="relative isolate z-0 px-5 py-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-2 lg:col-span-7">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Requirement Details</p>
              <div
                className={cn(
                  'min-h-[128px] rounded-lg border border-input bg-white px-3 py-2.5 text-sm leading-relaxed text-foreground shadow-inner dark:bg-zinc-950/50',
                  'whitespace-pre-wrap',
                )}
              >
                {quotation.requirement}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1 lg:gap-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Priority</p>
                  <PriorityBadge priority={priorityKey} />
                </div>
                <Select
                  value={priorityValue}
                  disabled={pending}
                  onValueChange={(v) => void onPatch({ priority: v as 'low' | 'medium' | 'high' })}
                >
                  <SelectTrigger
                    className={cn(
                      'h-10 w-full rounded-lg font-semibold capitalize shadow-sm',
                      PRIORITY_BADGE_CLASSES[priorityKey],
                    )}
                  >
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="low" className={cn('font-semibold capitalize', PRIORITY_BADGE_CLASSES.low)}>
                      Low
                    </SelectItem>
                    <SelectItem value="medium" className={cn('font-semibold capitalize', PRIORITY_BADGE_CLASSES.medium)}>
                      Medium
                    </SelectItem>
                    <SelectItem value="high" className={cn('font-semibold capitalize', PRIORITY_BADGE_CLASSES.high)}>
                      High
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Expected Quote Date
                </p>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    disabled={pending}
                    className="h-10 rounded-lg border-input bg-background pl-9 pr-3 font-medium tabular-nums shadow-sm"
                    value={deadlineInputValue(quotation.deadline)}
                    onChange={(e) => {
                      const v = e.target.value;
                      void onPatch({ deadline: v ? v : undefined });
                    }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                  {quotation.deadline ? formatDisplayDate(quotation.deadline) : 'No date set'}
                </p>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Assigned To</p>
                <Select
                  value={quotation.enquiry_lead || '__none__'}
                  disabled={pending}
                  onValueChange={(v) => void onPatch({ enquiry_lead: v === '__none__' ? null : v })}
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border-input bg-background font-medium shadow-sm">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] max-h-72">
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {userOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted/20 px-5 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Current Status</p>
          <StatusStepper current={enquiryStage} disabled={pending} onStageChange={onStageChange} />
        </div>
      </div>
    </Card>
  );
}
