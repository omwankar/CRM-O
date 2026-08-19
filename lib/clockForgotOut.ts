const UK_TIME_ZONE = 'Europe/London';

export function ukDateKey(value: Date | string = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: UK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof value === 'string' ? new Date(value) : value);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function londonLocalToUtc(dateKey: string, hour: number, minute = 0) {
  const utcGuess = Date.parse(`${dateKey}T${pad(hour)}:${pad(minute)}:00.000Z`);
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = dtf.formatToParts(new Date(utcGuess));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asLocalMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return new Date(utcGuess - (asLocalMs - utcGuess));
}

export function suggestedClockOutIso(clockInIso: string) {
  const day = ukDateKey(clockInIso);
  const sixPm = londonLocalToUtc(day, 18, 0);
  const clockIn = new Date(clockInIso);
  if (sixPm.getTime() > clockIn.getTime()) return sixPm.toISOString();
  return londonLocalToUtc(day, 23, 59).toISOString();
}

export function isStaleOpenSession(clockInIso: string, now = new Date()) {
  return ukDateKey(clockInIso) < ukDateKey(now);
}

export const FORGOT_CLOCK_OUT_LOCK_MESSAGE =
  'You forgot to clock out. Clock in is allowed — yesterday’s session was closed automatically.';

export async function closeStaleOpenSession(
  supabase: { from: (table: string) => any },
  session: { id: string; clock_in: string },
) {
  if (!isStaleOpenSession(session.clock_in)) return false;
  const { error } = await supabase
    .from('clock_sessions')
    .update({
      clock_out: suggestedClockOutIso(session.clock_in),
      notes: 'Automatic clock-out (previous day session closed).',
    })
    .eq('id', session.id)
    .is('clock_out', null);
  if (error) throw new Error(error.message);
  return true;
}

export async function hasPendingAutomaticClockOutRequest(
  supabase: { from: (table: string) => any },
  userId: string,
) {
  const { data } = await supabase
    .from('missed_punch_requests')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'clock_out')
    .eq('status', 'pending')
    .ilike('reason', 'Automatic:%')
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function ensureForgotClockOutPunchRequest(
  supabase: { from: (table: string) => any },
  session: { id: string; user_id: string; clock_in: string },
) {
  const { data: existing } = await supabase
    .from('missed_punch_requests')
    .select('id')
    .eq('user_id', session.user_id)
    .eq('type', 'clock_out')
    .eq('status', 'pending')
    .maybeSingle();

  if (existing?.id) return { created: false, requestId: existing.id as string };

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, employee_id')
    .eq('id', session.user_id)
    .maybeSingle();

  const employeeLabel = profile?.full_name || profile?.email || profile?.employee_id || 'Employee';
  const clockInUk = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(session.clock_in));

  const requestedOut = suggestedClockOutIso(session.clock_in);
  const durationMin = Math.max(
    1,
    Math.round((new Date(requestedOut).getTime() - new Date(session.clock_in).getTime()) / 60000),
  );

  const { data: inserted, error } = await supabase
    .from('missed_punch_requests')
    .insert({
      user_id: session.user_id,
      type: 'clock_out',
      requested_at: session.clock_in,
      requested_clock_in: session.clock_in,
      requested_clock_out: requestedOut,
      actual_duration_minutes: durationMin,
      reason: `Automatic: ${employeeLabel} forgot to clock out. Session started ${clockInUk} UK time.`,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return { created: true, requestId: inserted.id as string };
}
