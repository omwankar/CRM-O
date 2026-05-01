import { redirect } from 'next/navigation';

export function requireSuperAdmin(role: string | undefined | null) {
  if (role !== 'super_admin') {
    redirect('/dashboard');
  }
}

export function isSuperAdmin(role: string | undefined | null): boolean {
  return role === 'super_admin';
}
