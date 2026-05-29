'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CanWrite } from '@/components/auth/Can';
import { Loader2, Megaphone, Pin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from '@/lib/api/announcements';
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_CATEGORY_LABELS,
  type Announcement,
  type AnnouncementCategory,
  type CreateAnnouncementInput,
} from '@/types/workplace';

const CATEGORY_BADGE: Record<AnnouncementCategory, string> = {
  birthday: 'bg-pink-100 text-pink-800',
  work_anniversary: 'bg-violet-100 text-violet-800',
  holiday: 'bg-emerald-100 text-emerald-800',
  general: 'bg-slate-100 text-slate-700',
  work_update: 'bg-blue-100 text-blue-800',
};

const emptyForm: CreateAnnouncementInput & { audience_roles: string[] } = {
  title: '',
  body: '',
  category: 'general',
  audience: 'all',
  audience_roles: [],
  is_pinned: false,
};

export default function AnnouncementsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', filter],
    queryFn: () => getAnnouncements({ category: filter || undefined, limit: 100 }),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createAnnouncement({
        title: form.title,
        body: form.body,
        category: form.category,
        audience: form.audience,
        audience_roles: form.audience === 'role' ? form.audience_roles : undefined,
        is_pinned: form.is_pinned,
      }),
    onSuccess: () => {
      toast.success('Announcement posted');
      setDialogOpen(false);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      toast.success('Announcement removed');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-amber-500" />
            Announcements
          </h1>
          <p className="text-muted-foreground">Birthdays, anniversaries, holidays and general team updates.</p>
        </div>
        <CanWrite>
          <Button onClick={() => setDialogOpen(true)}>New announcement</Button>
        </CanWrite>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('')}
          className={`text-xs px-3 py-1 rounded-full border ${filter === '' ? 'bg-foreground text-background' : 'bg-transparent'}`}
        >
          All
        </button>
        {ANNOUNCEMENT_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`text-xs px-3 py-1 rounded-full border ${filter === c ? 'bg-foreground text-background' : 'bg-transparent'}`}
          >
            {ANNOUNCEMENT_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No announcements yet</Card>
      ) : (
        <div className="grid gap-4">
          {items.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {a.is_pinned ? <Pin className="w-3.5 h-3.5 text-amber-500" /> : null}
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${CATEGORY_BADGE[a.category]}`}>
                      {ANNOUNCEMENT_CATEGORY_LABELS[a.category]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mt-1">{a.title}</h3>
                  <p className="text-sm mt-2 whitespace-pre-wrap text-muted-foreground">{a.body}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {a.author_name || 'Team'} · {new Date(a.publish_at).toLocaleDateString()}
                  </p>
                </div>
                <CanWrite>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(a)}>
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </Button>
                </CanWrite>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium block mb-1">Title</label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Message</label>
              <Textarea rows={4} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Category</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as AnnouncementCategory }))}
                >
                  {ANNOUNCEMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{ANNOUNCEMENT_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Audience</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.audience}
                  onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as 'all' | 'role' | 'users' }))}
                >
                  <option value="all">Everyone</option>
                  <option value="role">By role</option>
                </select>
              </div>
            </div>
            {form.audience === 'role' && (
              <div className="flex flex-wrap gap-3 text-sm">
                {(['user', 'manager', 'super_admin'] as const).map((r) => (
                  <label key={r} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.audience_roles.includes(r)}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          audience_roles: e.target.checked
                            ? [...f.audience_roles, r]
                            : f.audience_roles.filter((x) => x !== r),
                        }))
                      }
                    />
                    {r}
                  </label>
                ))}
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_pinned}
                onChange={(e) => setForm((f) => ({ ...f, is_pinned: e.target.checked }))}
              />
              Pin to top
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!form.title.trim() || !form.body.trim()) {
                  toast.error('Enter a title and message');
                  return;
                }
                createMut.mutate();
              }}
              disabled={createMut.isPending}
            >
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <AlertDialog open onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
              <AlertDialogDescription>&ldquo;{deleteTarget.title}&rdquo; will be removed for everyone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => deleteMut.mutate(deleteTarget.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
