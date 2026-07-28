const UK_LOCALE = 'en-GB';
const UK_TIME_ZONE = 'Europe/London';
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_IN_TEXT_RE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;

function asDate(value: string | Date) {
  if (value instanceof Date) return value;
  const dateOnly = value.match(DATE_ONLY_RE);
  if (dateOnly) {
    // Noon avoids day-shift when converting calendar dates across timezones
    return new Date(`${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T12:00:00`);
  }
  return new Date(value);
}

function formatWithOptions(value: string | Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(UK_LOCALE, {
    timeZone: UK_TIME_ZONE,
    ...options,
  }).format(asDate(value));
}

/** DD/MM/YYYY for a calendar date string or Date. */
export function formatUkDate(value: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  if (typeof value === 'string' && DATE_ONLY_RE.test(value) && Object.keys(options).length === 0) {
    const [, y, m, d] = value.match(DATE_ONLY_RE)!;
    return `${d}/${m}/${y}`;
  }
  return formatWithOptions(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  });
}

export function formatUkDateTime(value: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  return formatWithOptions(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  });
}

export function formatUkTime(value: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  return formatWithOptions(value, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
    ...options,
  });
}

/** Time with UK zone label, e.g. 08:16 BST */
export function formatUkTimeLabeled(value: string | Date) {
  if (!value) return '--';
  const time = formatUkTime(value);
  const zone = new Intl.DateTimeFormat(UK_LOCALE, {
    timeZone: UK_TIME_ZONE,
    timeZoneName: 'short',
  })
    .formatToParts(asDate(value))
    .find((p) => p.type === 'timeZoneName')?.value;
  return zone ? `${time} ${zone}` : `${time} UK`;
}

export function formatUkMonthYear(value: string | Date) {
  return formatWithOptions(value, {
    month: 'long',
    year: 'numeric',
  });
}

export function formatUkLongDate(value: string | Date) {
  return formatWithOptions(value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatUkShortDayDate(value: string | Date) {
  return formatWithOptions(value, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

/** YYYY-MM-DD in Europe/London. */
export function formatUkIsoDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: UK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(asDate(value));
}

/** Rewrite any YYYY-MM-DD substrings in free text to DD/MM/YYYY. */
export function formatUkDatesInText(text: string) {
  return String(text || '').replace(ISO_DATE_IN_TEXT_RE, (_match, y, m, d) => `${d}/${m}/${y}`);
}

export function getUkNow() {
  return new Date();
}

export function getUkHour(value: string | Date) {
  const hour = new Intl.DateTimeFormat(UK_LOCALE, {
    timeZone: UK_TIME_ZONE,
    hour: '2-digit',
    hour12: false,
  }).format(asDate(value));
  return Number.parseInt(hour, 10);
}
