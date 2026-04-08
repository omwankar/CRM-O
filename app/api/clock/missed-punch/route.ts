import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type MissedPunchBody = {
  type?: 'clock_in' | 'clock_out';
  reason?: string;
  requested_at?: string; // ISO
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
  const type = body.type ?? 'clock_in';
  const reason = body.reason?.trim();
  const requestedAt = body.requested_at ? new Date(body.requested_at) : new Date();

  if (!['clock_in', 'clock_out'].includes(type)) {
    return NextResponse.json({ error: 'Invalid missed punch type' }, { status: 400 });
  }

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
      type,
      requested_at: requestedAt.toISOString(),
      reason: reason || null,
      status: 'pending',
    })
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Notify heads (super_admin/admin) about the new request.
  // Use service role so we can insert notifications for multiple users reliably.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: heads } = await adminClient
    .from('users')
    .select('id')
    .in('role', ['super_admin', 'admin']);

  if (heads?.length) {
    await adminClient.from('notifications').insert(
      heads.map((h) => ({
        user_id: h.id,
        type: 'missed_punch',
        title: 'Missed punch request',
        message: `A ${type === 'clock_in' ? 'clock-in' : 'clock-out'} missed punch request was submitted.`,
      }))
    );
  }

  return NextResponse.json({ ok: true, request: data }, { status: 200 });
}

