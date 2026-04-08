import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // We need to return the same response object that receives cookie updates.
  // To do that safely, we collect cookies to set during Supabase calls,
  // then apply them to the final response just before returning.
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options?: Record<string, any>;
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
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // 1) Sign in (Supabase will generate auth cookies via the setAll callback above)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.user) {
    return NextResponse.json(
      { error: authError?.message || 'Invalid email or password' },
      { status: 400 }
    );
  }

  // 2) Fetch profile row (role + approval)
  const { data: profile, error: profileError } = await supabase
    .from('users')
    // Login should not depend on approval status.
    // Keep only fields that are required by the app.
    .select('role, full_name')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    const msg = profileError.message || 'Failed to fetch user profile';
    const details = {
      code: (profileError as any)?.code,
      details: (profileError as any)?.details,
      hint: (profileError as any)?.hint,
    };

    const res = NextResponse.json({ error: msg, details }, { status: 500 });
    cookiesToSet.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  }

  if (!profile) {
    const res = NextResponse.json(
      { error: 'User profile not found in public.users' },
      { status: 403 }
    );
    cookiesToSet.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  }

  const res = NextResponse.json(
    {
      ok: true,
      role: profile.role,
      full_name: profile.full_name,
    },
    { status: 200 }
  );

  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options);
  });

  return res;
}

