import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type LeaveBody = {
  start_date?: string;
  end_date?: string;
  reason?: string;
};

type LeaveDecisionBody = {
  id?: string;
  status?: 'approved' | 'rejected';
};

export async function GET(request: NextRequest) {
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

  const url = new URL(request.url);
  const scope = url.searchParams.get('scope');

  const { data: roleRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isHead = ['super_admin', 'admin'].includes(roleRow?.role);
  const forceMine = scope === 'mine';

  let query = supabase
    .from('leave_requests')
    .select('id, requested_by, start_date, end_date, reason, status, created_at, reviewed_at')
    .order('created_at', { ascending: false });

  if (!isHead || forceMine) {
    query = query.eq('requested_by', user.id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const userIds = Array.from(new Set((data || []).map((r: any) => r.requested_by).filter(Boolean)));
  let usersMap: Record<string, { full_name?: string; email?: string }> = {};
  if (userIds.length) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds);
    usersMap = (usersData || []).reduce((acc: any, u: any) => {
      acc[u.id] = { full_name: u.full_name, email: u.email };
      return acc;
    }, {});
  }

  const rows = (data || []).map((r: any) => ({
    ...r,
    requester_name: usersMap[r.requested_by]?.full_name || usersMap[r.requested_by]?.email || 'Employee',
  }));

  return NextResponse.json({ ok: true, leave_requests: rows }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

  const body = (await request.json().catch(() => ({}))) as LeaveBody;
  const startDate = body.start_date?.trim();
  const endDate = body.end_date?.trim();
  const reason = body.reason?.trim();

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
  }
  if (startDate > endDate) {
    return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
  }

  const { data: leaveReq, error } = await supabase
    .from('leave_requests')
    .insert({
      requested_by: user.id,
      start_date: startDate,
      end_date: endDate,
      reason: reason || null,
      status: 'pending',
    })
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Notify both Admin and Super Admin.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: heads } = await adminClient
    .from('users')
    .select('id')
    .in('role', ['super_admin', 'admin']);

  if (heads?.length) {
    await adminClient.from('notifications').insert(
      heads.map((h) => ({
        user_id: h.id,
        type: 'leave_request',
        title: 'Leave request submitted',
        message: `A leave request was submitted from ${startDate} to ${endDate}.`,
      })),
    );
  }

  return NextResponse.json({ ok: true, leave_request: leaveReq }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

  const { data: roleRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!['super_admin', 'admin'].includes(roleRow?.role)) {
    return NextResponse.json({ error: 'Only admin/super_admin can review leaves' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as LeaveDecisionBody;
  const id = body.id;
  const status = body.status;

  if (!id || !['approved', 'rejected'].includes(status || '')) {
    return NextResponse.json({ error: 'id and valid status are required' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('leave_requests')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, requested_by, status')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!updated) {
    return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
  }

  // Notify employee about decision.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await adminClient.from('notifications').insert({
    user_id: updated.requested_by,
    type: 'leave_request',
    title: 'Leave request updated',
    message: `Your leave request has been ${status}.`,
  });

  return NextResponse.json({ ok: true, leave_request: updated }, { status: 200 });
}

