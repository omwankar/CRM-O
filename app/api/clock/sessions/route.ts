import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function toMonthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function parseMonthRange(month: string) {
  // month: YYYY-MM
  const [yStr, mStr] = month.split('-');
  const year = Number(yStr);
  const monthNum = Number(mStr); // 1-12
  const start = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));
  return { start, endExclusive };
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // No cookie writes needed.
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const monthParam = url.searchParams.get('month') || toMonthKey(new Date());
  const { start, endExclusive } = parseMonthRange(monthParam);

  const { data: sessions, error: sessionsErr } = await supabase
    .from('clock_sessions')
    .select('id, clock_in, clock_out, notes')
    .eq('user_id', user.id)
    .gte('clock_in', start.toISOString())
    .lt('clock_in', endExclusive.toISOString())
    .order('clock_in', { ascending: false });

  if (sessionsErr) {
    return NextResponse.json({ error: sessionsErr.message }, { status: 400 });
  }

  // Count missed punches for this month.
  const { count: missedCount, error: missedCountErr } = await supabase
    .from('missed_punch_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('requested_at', start.toISOString())
    .lt('requested_at', endExclusive.toISOString());

  if (missedCountErr) {
    return NextResponse.json({ error: missedCountErr.message }, { status: 400 });
  }

  const totalMinutes = (sessions || []).reduce((acc, s) => {
    if (!s.clock_in || !s.clock_out) return acc;
    const inMs = new Date(s.clock_in).getTime();
    const outMs = new Date(s.clock_out).getTime();
    const diff = outMs - inMs;
    return acc + Math.max(0, diff / 60000);
  }, 0);

  const workDays = new Set(
    (sessions || [])
      .filter((s) => !!s.clock_in)
      .map((s) => new Date(s.clock_in as string).toISOString().slice(0, 10)),
  ).size;

  const { data: openSessions } = await supabase
    .from('clock_sessions')
    .select('id, clock_in')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .limit(1);

  const openSession = openSessions?.[0] || null;

  return NextResponse.json(
    {
      ok: true,
      month: monthParam,
      openSession,
      sessions: sessions || [],
      summary: {
        totalMinutes,
        totalHours: totalMinutes / 60,
        workDays,
        missedPunchCount: missedCount ?? 0,
      },
    },
    { status: 200 },
  );
}

