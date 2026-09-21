'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type UserRow = { id: string; full_name?: string | null; email?: string | null };

export function TaskAssigneePicker({
  users,
  selected,
  onChange,
}: {
  users: UserRow[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <div className="grid gap-1.5">
      <Label>Assigned to * (select one or more)</Label>
      <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border p-2">
        {users.length === 0 ? (
          <p className="px-1.5 py-1 text-sm text-muted-foreground">No users loaded.</p>
        ) : (
          users.map((u) => (
            <label
              key={u.id}
              className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted"
            >
              <Checkbox checked={selected.includes(u.id)} onCheckedChange={() => toggle(u.id)} />
              {u.full_name || u.email}
            </label>
          ))
        )}
      </div>
      {selected.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {selected.length} person{selected.length === 1 ? '' : 's'} selected
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Tick everyone who should own this task.</p>
      )}
    </div>
  );
}
