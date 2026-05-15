import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type LoginBody = {
  login?: string;
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const cookiesToSet: Array<{
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }> = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesIn) {
        cookiesIn.forEach(({ name, value, options }) => {
          cookiesToSet.push({ name, value, options });
        });
      },
    },
  });

  const body = (await request.json().catch(() => null)) as LoginBody | null;
  const loginInput = (body?.login || body?.email || '').trim();
  const password = body?.password;

  if (!loginInput || !password) {
    return NextResponse.json({ error: 'Employee ID (or email) and password are required' }, { status: 400 });
  }

  let email = loginInput.toLowerCase();

  if (!loginInput.includes('@')) {
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: userRow, error: lookupErr } = await admin
      .from('users')
      .select('email, is_active, employee_id')
      .eq('employee_id', loginInput)
      .maybeSingle();

    if (lookupErr || !userRow?.email) {
      return NextResponse.json({ error: 'Invalid employee ID or password' }, { status: 400 });
    }
    if (userRow.is_active === false) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }
    email = userRow.email.toLowerCase();
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.user) {
    return NextResponse.json(
      { error: authError?.message || 'Invalid employee ID or password' },
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, full_name, employee_id, is_active')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    const res = NextResponse.json({ error: profileError.message }, { status: 500 });
    cookiesToSet.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    });
    return res;
  }

  if (!profile) {
    const res = NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    cookiesToSet.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    });
    return res;
  }

  if (profile.is_active === false) {
    const res = NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    cookiesToSet.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    });
    return res;
  }

  const res = NextResponse.json(
    {
      ok: true,
      role: profile.role,
      full_name: profile.full_name,
      employee_id: profile.employee_id,
    },
    { status: 200 },
  );

  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
  });

  return res;
}
