'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getOperationsPipeline } from '@/lib/api/operations';
import { ActivityFeed } from '@/components/operations/ActivityFeed';
import { AgentsTable } from '@/components/operations/AgentsTable';
import { Board } from '@/components/operations/Board';
import { InquiryDrawer } from '@/components/operations/InquiryDrawer';
import { NewInquiryModal } from '@/components/operations/NewInquiryModal';
import { BoardSkeleton, TableSkeleton } from '@/components/operations/OpsSkeleton';
import { PeopleFilter } from '@/components/operations/PeopleFilter';
import { PipelineHeader, type OpsTab } from '@/components/operations/PipelineHeader';
import { RegisterTable } from '@/components/operations/RegisterTable';

export default function OperationsPipelinePage() {
  const qc = useQueryClient();
  const { user, isSuperAdmin, inOperations, isLoading: authLoading } = useCurrentUser();
  const allowed = isSuperAdmin || inOperations;
  const [tab, setTab] = useState<OpsTab>('inquiries');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [activityPerson, setActivityPerson] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['operations-pipeline', showClosed],
    queryFn: () => getOperationsPipeline(showClosed),
    enabled: !authLoading && allowed,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['operations-pipeline'] });
    qc.invalidateQueries({ queryKey: ['enquiries'] });
  };

  const selected = (data?.inquiries || []).find((inquiry) => inquiry.id === selectedId) ?? null;
  const focusPerson = (data?.workload || []).find((member) => member.user_id === personId) ?? null;
  const needle = search.trim().toLowerCase();
  const visible = useMemo(() => {
    return (data?.inquiries || []).filter((inquiry) => {
      if (personId && !inquiry.operators.some((operator) => operator.user_id === personId)) return false;
      if (!needle) return true;
      const hay = [
        inquiry.enquiry_number,
        inquiry.prospect_name,
        inquiry.title,
        inquiry.route,
        inquiry.requirement,
        ...inquiry.sends.map((send) => send.agent_name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [data?.inquiries, personId, needle]);

  if (authLoading) {
    return (
      <div className="ops flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="ops mx-auto flex h-full max-w-md flex-col justify-center px-6 text-center">
        <h1 className="text-xl font-semibold">Operations only</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--ops-muted)' }}>This pipeline is for the operations team.</p>
      </div>
    );
  }

  return (
    <div className="ops flex h-full min-h-0 flex-col overflow-hidden">
      <PipelineHeader tab={tab} onTab={setTab} onNew={() => setCreating(true)} />
      <div className="ops-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5">
        {error ? <p className="text-sm" style={{ color: 'var(--ops-crit)' }}>{(error as Error).message}</p> : null}
        {tab === 'inquiries' ? (
          <div className="space-y-4">
            <PeopleFilter people={data?.workload || []} personId={personId} onPerson={setPersonId} />
            {isLoading ? (
              <BoardSkeleton />
            ) : (
              <Board
                title={focusPerson ? `${focusPerson.full_name}'s inquiries` : 'All inquiries'}
                search={search}
                onSearch={setSearch}
                showClosed={showClosed}
                onShowClosed={setShowClosed}
                inquiries={visible}
                selectedId={selectedId}
                onOpen={setSelectedId}
              />
            )}
          </div>
        ) : null}
        {tab === 'activity' ? (
          isLoading ? <TableSkeleton /> : (
            <ActivityFeed
              people={data?.workload || []}
              activity={data?.activity || []}
              personId={activityPerson}
              onPerson={setActivityPerson}
              onOpen={setSelectedId}
            />
          )
        ) : null}
        {tab === 'register' ? (
          isLoading ? <TableSkeleton rows={8} /> : <RegisterTable inquiries={data?.inquiries || []} onOpen={setSelectedId} />
        ) : null}
        {tab === 'agents' ? (
          isLoading ? <TableSkeleton /> : <AgentsTable agents={data?.agents || []} onChanged={refresh} />
        ) : null}
      </div>
      <InquiryDrawer
        inquiry={selected}
        userId={user?.id}
        isSuperAdmin={isSuperAdmin}
        team={data?.workload || []}
        agents={data?.agents || []}
        onChanged={refresh}
        onDismiss={() => setSelectedId(null)}
      />
      <NewInquiryModal open={creating} onOpenChange={setCreating} onCreated={refresh} />
    </div>
  );
}
