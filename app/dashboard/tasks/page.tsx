'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TasksBoard } from '@/components/tasks/TaskBoard';
import type { TaskView } from '@/types/tasks';

function TasksPageInner() {
  const params = useSearchParams();
  const view = (params.get('view') as TaskView) || 'mine';
  const locked = Boolean(params.get('view'));
  return <TasksBoard defaultView={view} lockView={locked && view !== 'mine'} />;
}

export default function TasksPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading tasks…</p>}>
      <TasksPageInner />
    </Suspense>
  );
}
