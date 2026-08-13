import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function parseMonthRangeUk(month: string) {
  // Expand UTC window slightly so UK-local days near month edges are included,
  // then filter by Europe/London calendar month.
  const [yStr, mStr] = month.split('-');
  const year = Number(yStr);
  const monthNum = Number(mStr);
  const start = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
  start.setUTCDate(start.getUTCDate() - 1);
  const endExclusive = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, endExclusive };
}

function ukDateKey(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
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
  const monthParam =
    url.searchParams.get('month') ||
    ukDateKey(new Date().toISOString()).slice(0, 7);
  const { start, endExclusive } = parseMonthRangeUk(monthParam);

  const { data: rawSessions, error: sessionsErr } = await supabase
    .from('clock_sessions')
    .select('id, clock_in, clock_out, notes')
    .eq('user_id', user.id)
    .gte('clock_in', start.toISOString())
    .lt('clock_in', endExclusive.toISOString())
    .order('clock_in', { ascending: false });

  if (sessionsErr) {
    return NextResponse.json({ error: sessionsErr.message }, { status: 400 });
  }

  const sessions = (rawSessions || []).filter((s) => ukDateKey(s.clock_in).startsWith(monthParam));

  // Count missed punches for this month (UK calendar month).
  const { data: missedRows, error: missedCountErr } = await supabase
    .from('missed_punch_requests')
    .select('id, requested_at')
    .eq('user_id', user.id)
    .gte('requested_at', start.toISOString())
    .lt('requested_at', endExclusive.toISOString());

  if (missedCountErr) {
    return NextResponse.json({ error: missedCountErr.message }, { status: 400 });
  }

  const missedCount = (missedRows || []).filter((r) =>
    ukDateKey(r.requested_at).startsWith(monthParam)
  ).length;

  const totalMinutes = sessions.reduce((acc, s) => {
    if (!s.clock_in || !s.clock_out) return acc;
    const inMs = new Date(s.clock_in).getTime();
    const outMs = new Date(s.clock_out).getTime();
    const diff = outMs - inMs;
    return acc + Math.max(0, diff / 60000);
  }, 0);

  const workDays = new Set(sessions.map((s) => ukDateKey(s.clock_in))).size;

  const { data: openSessions } = await supabase
    .from('clock_sessions')
    .select('id, clock_in')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .limit(1);

  const openSession = openSessions?.[0] || null;
  let pendingForgotClockOut = false;

  if (openSession && ukDateKey(openSession.clock_in) < ukDateKey(new Date().toISOString())) {
    pendingForgotClockOut = true;
    try {
      const { ensureForgotClockOutPunchRequest } = await import('@/lib/clockForgotOut');
      await ensureForgotClockOutPunchRequest(supabase, {
        id: openSession.id,
        user_id: user.id,
        clock_in: openSession.clock_in,
      });
    } catch {
      /* ignore duplicate / RLS */
    }
  }

  return NextResponse.json(
    {
      ok: true,
      month: monthParam,
      openSession,
      pendingForgotClockOut,
      sessions,
      summary: {
        totalMinutes,
        totalHours: totalMinutes / 60,
        workDays,
        missedPunchCount: missedCount,
      },
    },
    { status: 200 },
  );
}

