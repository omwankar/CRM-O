'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Megaphone, Pin, ArrowRight } from 'lucide-react';
import { getAnnouncements } from '@/lib/api/announcements';
import { ANNOUNCEMENT_CATEGORY_LABELS } from '@/types/workplace';

export function AnnouncementsWidget() {
  const { data } = useQuery({
    queryKey: ['announcements-widget'],
    queryFn: () => getAnnouncements({ active_only: true, limit: 3 }),
  });

  const items = data?.data || [];
  if (items.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-500" />
          Announcements
        </h2>
        <Link href="/dashboard/announcements" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="border-b border-border pb-2 last:border-0 last:pb-0">
            <div className="flex items-center gap-2">
              {a.is_pinned ? <Pin className="w-3 h-3 text-amber-500" /> : null}
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {ANNOUNCEMENT_CATEGORY_LABELS[a.category]}
              </span>
            </div>
            <p className="text-sm font-medium">{a.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
