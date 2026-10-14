import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type MissedPunchBody = {
  type?: 'clock_in' | 'clock_out';
  reason?: string;
  requested_at?: string; // ISO
  clock_in?: string;
  clock_out?: string;
};

function parseMonthRange(month: string) {
  // month: YYYY-MM
  const [yStr, mStr] = month.split('-');
  const year = Number(yStr);
  const monthNum = Number(mStr); // 1-12

  const start = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));
  return { start, endExclusive };
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

  const body = (await request.json().catch(() => ({}))) as MissedPunchBody;
  const reason = body.reason?.trim();
  const clockIn = body.clock_in ? new Date(body.clock_in) : null;
  const clockOut = body.clock_out ? new Date(body.clock_out) : null;

  if (!clockIn || Number.isNaN(clockIn.getTime()) || !clockOut || Number.isNaN(clockOut.getTime())) {
    return NextResponse.json({ error: 'Clock in and clock out are required.' }, { status: 400 });
  }
  if (clockOut.getTime() <= clockIn.getTime()) {
    return NextResponse.json({ error: 'Clock out must be after clock in.' }, { status: 400 });
  }

  const requestedAt = clockIn;
  const durationMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / 60000);

  const month = `${requestedAt.getUTCFullYear()}-${String(requestedAt.getUTCMonth() + 1).padStart(2, '0')}`;
  const { start, endExclusive } = parseMonthRange(month);

  // Count missed punches this month (limit = 5 per requirement).
  const { count, error: countErr } = await supabase
    .from('missed_punch_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('requested_at', start.toISOString())
    .lt('requested_at', endExclusive.toISOString());

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 400 });
  }

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: 'You have reached the maximum missed punches for this month (5).' },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from('missed_punch_requests')
    .insert({
      user_id: user.id,
      type: 'clock_in',
      requested_at: requestedAt.toISOString(),
      requested_clock_in: clockIn.toISOString(),
      requested_clock_out: clockOut.toISOString(),
      actual_duration_minutes: durationMinutes,
      reason: reason || null,
      status: 'pending',
    })
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Notify Super Admin about the new request.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile } = await adminClient
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle();
  const who = profile?.full_name || profile?.email || 'An employee';

  const { data: heads } = await adminClient
    .from('users')
    .select('id')
    .eq('role', 'super_admin')
    .eq('is_active', true);

  if (heads?.length) {
    await adminClient.from('notifications').insert(
      heads.map((h) => ({
        user_id: h.id,
        type: 'punch_request',
        title: 'Punch request',
        message: `${who} submitted a punch request with clock in and clock out.`,
      }))
    );
  }

  return NextResponse.json({ ok: true, request: data }, { status: 200 });
}

