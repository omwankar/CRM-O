import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);


// ==============================
// 🔐 AUTH FUNCTIONS
// ==============================

// 👉 Get current logged-in user
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return null;
  return user;
}


// 👉 Get user with role from public.users
export async function getCurrentUserWithRole() {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session fetch error', sessionError);
    }

    const { data, error } = await supabase
      .from('users')
      // Keep the selected columns in sync with your actual `public.users` table schema.
      // Your table currently does NOT have `organization_id`.
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      // Supabase errors often log as {} in Next overlays; log a few shapes explicitly.
      console.error('Role fetch error (raw)', error);
      console.error('Role fetch error (details)', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        stack: (error as any)?.stack,
        sessionUserId: sessionData?.session?.user?.id,
        authUserId: user.id,
      });
      return { ...user, role: 'user' }; // fallback
    }

    // If the profile row doesn't exist yet, don't treat it as an error.
    if (!data) {
      console.warn('No users row found for auth user id', user.id);
      return { ...user, role: 'user' };
    }

  return {
    ...user,
    role: data?.role || 'user',
    full_name: data?.full_name,
  };
  } catch (e: any) {
    console.error('Role fetch threw (exception)', e);
    console.error('Role fetch threw (details)', {
      name: e?.name,
      message: e?.message,
      stack: e?.stack,
    });
    return { ...user, role: 'user' };
  }
}


// 👉 Sign Up (NO manual insert — trigger will handle DB)
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName, // used by DB trigger
      },
    },
  });

  if (error) throw error;

  return data;
}


// 👉 Sign In
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}


// 👉 Sign Out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}


// 👉 Reset Password Email
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) throw error;
}


// 👉 Update Password
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}