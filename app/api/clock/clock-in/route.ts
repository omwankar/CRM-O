import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { closeStaleOpenSession, isStaleOpenSession } from '@/lib/clockForgotOut';

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: openSession, error: openErr } = await supabase
    .from('clock_sessions')
    .select('id, user_id, clock_in')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .maybeSingle();

  if (openErr) {
    return NextResponse.json({ error: openErr.message }, { status: 400 });
  }

  if (openSession) {
    if (isStaleOpenSession(openSession.clock_in)) {
      try {
        await closeStaleOpenSession(supabase, {
          id: openSession.id,
          clock_in: openSession.clock_in,
        });
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : 'Could not close yesterday’s session' },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json({ error: 'You are already clocked in' }, { status: 400 });
    }
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('clock_sessions')
    .insert({ user_id: user.id, clock_in: nowIso })
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, session: data }, { status: 200 });
}
