'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCompanyHolidays } from '@/lib/api/leave';
import { ChevronLeft, ChevronRight, PartyPopper, CalendarDays } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatHolidayDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

function isPast(iso: string) {
  return iso < new Date().toISOString().slice(0, 10);
}

export default function HolidaysPage() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['company-holidays', year],
    queryFn: () => getCompanyHolidays(year),
  });

  const holidays = data?.data || [];
  const upcoming = holidays.filter((h) => !isPast(h.date));
  const nextHoliday = upcoming[0] || null;

  const byMonth = holidays.reduce<Record<number, typeof holidays>>((acc, h) => {
    const m = Number(h.date.slice(5, 7)) - 1;
    (acc[m] ||= []).push(h);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Holidays</h1>
          <p className="text-muted-foreground">Company holiday calendar for {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold tabular-nums w-12 text-center">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total holidays</p>
          <p className="text-2xl font-bold tabular-nums">{holidays.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Remaining this year</p>
          <p className="text-2xl font-bold tabular-nums">{upcoming.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Next holiday</p>
          {nextHoliday ? (
            <div>
              <p className="text-lg font-semibold truncate">{nextHoliday.title}</p>
              <p className="text-xs text-muted-foreground">{formatHolidayDate(nextHoliday.date)}</p>
            </div>
          ) : (
            <p className="text-lg font-semibold text-muted-foreground">—</p>
          )}
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </Card>
          ))}
        </div>
      ) : holidays.length === 0 ? (
        <Card className="p-10 flex flex-col items-center text-center">
          <PartyPopper className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="font-medium">No holidays found for {year}</p>
          <p className="text-sm text-muted-foreground">Holidays added by HR will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(byMonth)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([monthIdx, list]) => (
              <div key={monthIdx}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {MONTH_NAMES[Number(monthIdx)]}
                </h2>
                <div className="grid gap-2">
                  {list.map((h) => {
                    const past = isPast(h.date);
                    return (
                      <Card
                        key={h.id}
                        className={`flex items-center justify-between gap-4 p-4 ${past ? 'opacity-55' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                            <CalendarDays className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{h.title}</p>
                            <p className="text-sm text-muted-foreground">{formatHolidayDate(h.date)}</p>
                            {h.description ? (
                              <p className="text-xs text-muted-foreground truncate">{h.description}</p>
                            ) : null}
                          </div>
                        </div>
                        <Badge variant={h.holiday_pay_type === 'unpaid' ? 'outline' : 'secondary'}>
                          {h.holiday_pay_type === 'unpaid' ? 'Unpaid' : 'Paid'}
                        </Badge>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
