const rawApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function normalizeApiBase(url: string) {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const API_BASE = normalizeApiBase(rawApiBase);

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
      const detail = issues
        .map((i) => {
          const field = i.path?.length ? i.path.join('.') : 'field';
          return `${field}: ${i.message || 'invalid'}`;
        })
        .join('; ');
      throw new Error(detail);
    }
    throw new Error(body.error || 'Request failed');
  }

  return response.json();
}

export function getApiBase() {
  return API_BASE;
}
