'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getOperationsPipeline } from '@/lib/api/operations';
import { ActivityFeed } from '@/components/operations/ActivityFeed';
import { AgentsTable } from '@/components/operations/AgentsTable';
import { Board } from '@/components/operations/Board';
import { InquiryDrawer } from '@/components/operations/InquiryDrawer';
import { NewInquiryModal } from '@/components/operations/NewInquiryModal';
import { PeopleFilter } from '@/components/operations/PeopleFilter';
import { PipelineHeader, type OpsTab } from '@/components/operations/PipelineHeader';
import { RegisterTable } from '@/components/operations/RegisterTable';

export function OperationsPipelineApp() {
  const qc = useQueryClient();
  const { user, profile, isSuperAdmin, inOperations, isLoading: authLoading } = useCurrentUser();
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
      <div className="ops">
        <div className="wrap"><div className="empty"><h3>Loading…</h3>Getting the team&apos;s inquiries.</div></div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="ops">
        <div className="wrap">
          <div className="link">
            <h2>Operations only</h2>
            <p className="hint" style={{ fontSize: 14, margin: 0 }}>This pipeline is for the operations team.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ops">
      <div className="wrap">
        <PipelineHeader
          tab={tab}
          onTab={setTab}
          onNew={() => setCreating(true)}
          meName={(profile as { full_name?: string } | undefined)?.full_name || user?.email || 'You'}
          isManager={isSuperAdmin}
        />
        {error ? <div className="banner err"><b>{(error as Error).message}</b></div> : null}
        {tab === 'inquiries' ? (
          <>
            <PeopleFilter people={data?.workload || []} personId={personId} onPerson={setPersonId} />
            {isLoading ? (
              <div className="empty"><h3>Loading…</h3></div>
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
          </>
        ) : null}
        {tab === 'activity' ? (
          isLoading ? <div className="empty"><h3>Loading…</h3></div> : (
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
          isLoading ? <div className="empty"><h3>Loading…</h3></div> : (
            <RegisterTable inquiries={data?.inquiries || []} onOpen={setSelectedId} />
          )
        ) : null}
        {tab === 'agents' ? (
          isLoading ? <div className="empty"><h3>Loading…</h3></div> : (
            <AgentsTable agents={data?.agents || []} onChanged={refresh} />
          )
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
