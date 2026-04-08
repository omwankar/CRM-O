import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(_request: NextRequest) {
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

  const { data: openSessions, error: openErr } = await supabase
    .from('clock_sessions')
    .select('id, clock_in')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1);

  if (openErr) {
    return NextResponse.json({ error: openErr.message }, { status: 400 });
  }

  const openSession = openSessions?.[0];

  if (!openSession) {
    return NextResponse.json({ error: 'No open clock session found' }, { status: 400 });
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('clock_sessions')
    .update({ clock_out: nowIso })
    .eq('id', openSession.id)
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, session: data }, { status: 200 });
}

