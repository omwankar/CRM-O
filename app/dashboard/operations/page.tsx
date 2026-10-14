'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getOperationsPipeline, type PipelineInquiry } from '@/lib/api/operations';
import { InquiryIntake } from '@/components/operations/InquiryIntake';
import { InquiryPanel } from '@/components/operations/InquiryPanel';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { formatUkDate } from '@/lib/date';

function ageLabel(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day old';
  return `${days} days old`;
}

function InquiryRow({
  inquiry,
  personId,
  onOpen,
}: {
  inquiry: PipelineInquiry;
  personId: string | null;
  onOpen: () => void;
}) {
  const summary = inquiry.title || inquiry.prospect_name || inquiry.requirement.split('\n')[0];
  const theirSends = personId ? inquiry.sends.filter((send) => send.user_id === personId) : [];
  const agents = personId ? theirSends : inquiry.sends;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start justify-between gap-3 border-b px-3 py-3 text-left last:border-b-0 hover:bg-slate-50"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-blue-600">{inquiry.enquiry_number}</span>
          <span className="text-[11px] font-medium text-amber-800">{ageLabel(inquiry.created_at)}</span>
          <span className="text-[11px] text-slate-400">{formatUkDate(inquiry.created_at)}</span>
        </div>
        <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{summary}</p>
        <p className="mt-1 text-xs text-slate-500">
          {personId
            ? theirSends.length
              ? `Sent to ${theirSends.map((send) => send.agent_name).join(', ')}`
              : 'Working on this, no agents yet'
            : inquiry.operators.length
              ? inquiry.operators.map((operator) => operator.full_name).join(', ')
              : 'Nobody working yet'}
          {!personId && agents.length ? ` · ${agents.length} agent${agents.length === 1 ? '' : 's'}` : ''}
        </p>
      </div>
      <span className="shrink-0 pt-1 text-xs text-slate-400">Open</span>
    </button>
  );
}

export default function OperationsPipelinePage() {
  const qc = useQueryClient();
  const { user, isSuperAdmin, inOperations, isLoading: authLoading } = useCurrentUser();
  const allowed = isSuperAdmin || inOperations;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['operations-pipeline'],
    queryFn: getOperationsPipeline,
    enabled: !authLoading && allowed,
  });

  const selected = (data?.inquiries || []).find((inquiry) => inquiry.id === selectedId) ?? null;
  const person = (data?.workload || []).find((member) => member.user_id === personId) ?? null;
  const inquiries = (data?.inquiries || []).filter(
    (inquiry) => !personId || inquiry.operators.some((operator) => operator.user_id === personId),
  );

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['operations-pipeline'] });
    qc.invalidateQueries({ queryKey: ['enquiries'] });
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-xl font-semibold">Operations only</h1>
        <p className="mt-2 text-sm text-muted-foreground">This pipeline is for the operations team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operations pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Oldest inquiries first. Everyone on an enquiry uses the same enquiry ID.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPersonId(null)}
          className={`rounded-full px-2.5 py-1 text-xs ${personId ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white'}`}
        >
          Everyone
        </button>
        {(data?.workload || []).map((member) => (
          <button
            key={member.user_id}
            type="button"
            onClick={() => setPersonId(member.user_id)}
            className={`rounded-full px-2.5 py-1 text-xs ${
              personId === member.user_id ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-900'
            }`}
          >
            {member.full_name} · {member.open_count}
          </button>
        ))}
        {!isLoading && (data?.workload || []).length === 0 ? (
          <span className="text-xs text-muted-foreground">No operations people flagged yet.</span>
        ) : null}
      </div>

      <InquiryIntake onCreated={refresh} />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-rose-600">{error instanceof Error ? error.message : 'Could not load the pipeline'}</p>
      ) : (data?.inquiries || []).length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No open inquiries. Paste one above.
        </p>
      ) : (
        <section className="overflow-hidden rounded-lg border bg-white">
          <div className="border-b px-3 py-2">
            <h2 className="text-sm font-semibold">{person ? `${person.full_name}'s inquiries` : 'Inquiries'}</h2>
            <p className="text-xs text-muted-foreground">
              {person ? `${inquiries.length} open` : 'Click an inquiry to edit it. Click a person above to see their work.'}
            </p>
          </div>
          {inquiries.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {person?.full_name} is not working on any open inquiries.
            </p>
          ) : (
            inquiries.map((inquiry) => (
              <InquiryRow key={inquiry.id} inquiry={inquiry} personId={personId} onOpen={() => setSelectedId(inquiry.id)} />
            ))
          )}
        </section>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-xl"
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest?.('[data-slot="select-content"]')) event.preventDefault();
          }}
        >
          <SheetTitle className="sr-only">{selected?.enquiry_number || 'Inquiry'}</SheetTitle>
          {selected ? <InquiryPanel inquiry={selected} userId={user?.id} onChanged={refresh} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
