'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import Link from 'next/link';
import { getCurrentUserWithRole, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { AuthShell } from '@/components/auth-shell';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);



const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // Step 1: Login
    await signInWithEmail(email, password);

    // Step 2: Get user + role + approval
    const user = await getCurrentUserWithRole();

    if (!user) {
      throw new Error('User not found');
    }

    // Step 3: Check approval
    const { data } = await supabase
      .from('users')
      .select('approved')
      .eq('id', user.id)
      .single();

    if (!data?.approved) {
      await signOut(); // logout immediately
      throw new Error('Your account is not approved yet');
    }

    // Step 4: Allow access
    router.replace('/dashboard');

  } catch (err: any) {
    setError(err.message || 'Failed to sign in');
  } finally {
    setLoading(false);
  }
};

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to your CRM account">
          {error && (
            <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/15 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <FieldGroup>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </FieldGroup>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <div>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Sign Up
              </Link>
            </div>
          </div>
    </AuthShell>
  );
}
