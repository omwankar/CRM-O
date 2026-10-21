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
import { TeamSettingsModal } from '@/components/operations/TeamSettingsModal';
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
  const [creating, setCreating] = useState(false);
  const [settings, setSettings] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['operations-pipeline', true],
    queryFn: () => getOperationsPipeline(true),
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
            <h2>Welcome</h2>
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
          onSettings={() => setSettings(true)}
          meName={(profile as { full_name?: string } | undefined)?.full_name || user?.email || 'You'}
          isManager={isSuperAdmin}
        />
        <main>
          {error ? <div className="banner err"><b>{(error as Error).message}</b></div> : null}
          {tab === 'inquiries' ? (
            <>
              <PeopleFilter people={data?.workload || []} personId={personId} onPerson={setPersonId} meId={user?.id} />
              {isLoading ? (
                <div className="empty"><h3>Loading…</h3></div>
              ) : (
                <Board
                  title={focusPerson ? `${focusPerson.full_name}'s inquiries` : 'All inquiries'}
                  search={search}
                  onSearch={setSearch}
                  inquiries={visible}
                  selectedId={selectedId}
                  onOpen={setSelectedId}
                  onNew={() => setCreating(true)}
                  isManager={isSuperAdmin}
                  personId={personId}
                  onClearPerson={() => setPersonId(null)}
                />
              )}
            </>
          ) : null}
          {tab === 'activity' ? (
            isLoading ? <div className="empty"><h3>Loading…</h3></div> : (
              <ActivityFeed
                people={data?.workload || []}
                activity={data?.activity || []}
                inquiries={data?.inquiries || []}
                personId={activityPerson}
                onPerson={setActivityPerson}
                onOpen={setSelectedId}
                onChanged={refresh}
                userId={user?.id}
                isManager={isSuperAdmin}
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
        </main>
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
      <NewInquiryModal
        open={creating}
        onOpenChange={setCreating}
        onCreated={refresh}
        team={data?.workload || []}
        existingIds={(data?.inquiries || []).map((inquiry) => inquiry.enquiry_number)}
      />
      <TeamSettingsModal
        open={settings}
        onOpenChange={setSettings}
        meName={(profile as { full_name?: string } | undefined)?.full_name || user?.email || 'You'}
        team={data?.workload || []}
      />
    </div>
  );
}
