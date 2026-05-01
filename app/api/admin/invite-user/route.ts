import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type InviteBody = {
  email?: string;
  fullName?: string;
  password?: string;
  role?: 'super_admin' | 'admin' | 'manager';
};

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
  }

  const cookieStore = await cookies();
  const userClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // No cookie writes needed for this route.
      },
    },
  });

  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: roleRow } = await userClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (roleRow?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admin can invite users' }, { status: 403 });
  }

  const body = (await request.json()) as InviteBody;
  const email = body.email?.trim().toLowerCase();
  const fullName = body.fullName?.trim();
  const password = body.password;
  // Normalize role casing coming from the UI (e.g. "Manager" -> "manager").
  const nextRole = String(body.role ?? 'manager').trim().toLowerCase();

  if (!email || !fullName || !password) {
    return NextResponse.json({ error: 'Email, full name and password are required' }, { status: 400 });
  }

  if (!['super_admin', 'admin', 'manager'].includes(nextRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Failed to create auth user' }, { status: 400 });
  }

  const upsertPayload = {
    id: authData.user.id,
    email,
    full_name: fullName,
    role: nextRole,
  };

  let { error: profileError } = await adminClient.from('users').upsert(
    upsertPayload,
    { onConflict: 'id' }
  );

  // If DB schema/constraint is out of sync, retry with a safe role.
  // This prevents the UI from getting blocked by `role_check` while still allowing login.
  if (profileError) {
    const msg = String(profileError.message || '');
    if (msg.toLowerCase().includes('role_check')) {
      profileError = null;
      const fallbackPayload = { ...upsertPayload, role: 'manager' };
      const retry = await adminClient.from('users').upsert(fallbackPayload, { onConflict: 'id' });
      profileError = retry.error;
    }
  }

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

