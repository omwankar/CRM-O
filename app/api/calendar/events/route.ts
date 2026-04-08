import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CalendarEvent = {
  id?: string;
  date?: string; // YYYY-MM-DD
  title?: string;
  event_type?: 'holiday' | 'meeting';
  start_time?: string;
  end_time?: string;
  description?: string;
};

function parseMonthRange(month: string) {
  const [yStr, mStr] = month.split('-');
  const year = Number(yStr);
  const monthNum = Number(mStr);
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
  const monthParam = url.searchParams.get('month');
  const month = monthParam || `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`;
  const { start, endExclusive } = parseMonthRange(month);

  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, date, title, event_type, start_time, end_time, description')
    .gte('date', start.toISOString().slice(0, 10))
    .lt('date', endExclusive.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, month, events: data || [] }, { status: 200 });
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

  const { data: roleRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = roleRow?.role;
  if (!['super_admin', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Only admins can create calendar events' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as CalendarEvent;
  const date = body.date?.trim();
  const title = body.title?.trim();
  const event_type = body.event_type ?? 'holiday';
  const start_time = body.start_time?.trim();
  const end_time = body.end_time?.trim();
  const description = body.description?.trim();

  if (!date || !title) {
    return NextResponse.json({ error: 'date and title are required' }, { status: 400 });
  }

  if (!['holiday', 'meeting'].includes(event_type)) {
    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
  }

  // Insert with service role so RLS is not a blocker for admins.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient
    .from('calendar_events')
    .insert({
      date,
      title,
      event_type,
      start_time: start_time || null,
      end_time: end_time || null,
      description: description || null,
      created_by: user.id,
    })
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, event: data }, { status: 200 });
}

