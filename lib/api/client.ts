const rawApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function normalizeApiBase(url: string) {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const API_BASE = normalizeApiBase(rawApiBase);

/** Map raw DB/API errors to messages safe to show end users. */
function friendlyApiError(raw: string): string {
  const m = String(raw || '').toLowerCase();
  if (
    m.includes('row-level security') ||
    m.includes('permission') ||
    m.includes('forbidden') ||
    m.includes('not allowed')
  ) {
    return 'You do not have permission to do that.';
  }
  if (m.includes('more than one relationship') || m.includes('could not embed') || m.includes('pgrst')) {
    return 'Something went wrong saving your changes. Please try again.';
  }
  if (m.includes('schema cache') || m.includes("could not find the '") || m.includes('column of')) {
    return 'Could not save. Please try again.';
  }
  if (m.includes('duplicate') || m.includes('unique constraint') || m.includes('already exists')) {
    return 'That record already exists.';
  }
  if (m.includes('foreign key') || m.includes('violates')) {
    return 'Could not save because related data is missing or invalid.';
  }
  if (m.includes('jwt') || m.includes('unauthorized') || m.includes('session')) {
    return 'Your session expired. Please sign in again.';
  }
  // Already a short, human message from the API
  if (raw && raw.length < 120 && !m.includes('postgres') && !m.includes('sql') && !m.includes('stack')) {
    return raw;
  }
  return 'Something went wrong. Please try again.';
}

async function getAuthToken() {
  const { supabase } = await import('@/lib/auth');
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

export async function apiRequest(url: string, options?: RequestInit) {
  const token = await getAuthToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });
  } catch {
    const hint =
      typeof window !== 'undefined' &&
      API_BASE.includes('localhost') &&
      window.location.hostname !== 'localhost'
        ? ' NEXT_PUBLIC_API_URL is missing or still set to localhost — add it in Vercel and redeploy.'
        : ' Check that the backend is running and FRONTEND_ORIGIN on Render matches your Vercel URL exactly.';
    throw new Error(`Cannot reach API at ${API_BASE}.${hint}`);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Request failed' }));
    const issues = body.issues as Array<{ path?: (string | number)[]; message?: string }> | undefined;
    if (issues?.length) {
      throw new Error('Please check the form and try again.');
    }
    throw new Error(friendlyApiError(body.error || 'Request failed'));
  }

  return response.json();
}

export function getApiBase() {
  return API_BASE;
}
