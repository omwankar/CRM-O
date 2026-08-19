export type AppRole = 'super_admin' | 'manager' | 'user';

/** Canonicalise public.users.role so Super Admin / super-admin / empty all map cleanly. */
export function normalizeAppRole(raw: unknown): AppRole {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (
    s === 'super_admin' ||
    s === 'superadmin' ||
    s === 'head' ||
    s === 'owner'
  ) {
    return 'super_admin';
  }
  if (s === 'manager' || s === 'admin') return 'manager';
  return 'user';
}

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  user: 'User',
};

export const ROLE_COLORS: Record<AppRole, string> = {
  super_admin: 'bg-purple-600 text-white',
  manager: 'bg-blue-100 text-blue-700',
  user: 'bg-teal-100 text-teal-700',
};
