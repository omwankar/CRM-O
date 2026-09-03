'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TasksBoard } from '@/components/tasks/TaskBoard';
import type { TaskView } from '@/types/tasks';
import { useCurrentUser } from '@/hooks/useCurrentUser';

function TasksPageInner() {
  const params = useSearchParams();
  const { isSuperAdmin, isLoading } = useCurrentUser();
  const requested = params.get('view') as TaskView | null;
  if (isLoading && !requested) {
    return <p className="text-sm text-muted-foreground">Loading tasks…</p>;
  }
  const view = requested || (isSuperAdmin ? 'team' : 'mine');
  return <TasksBoard key={view} defaultView={view} />;
}

export default function TasksPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading tasks…</p>}>
      <TasksPageInner />
    </Suspense>
  );
}
