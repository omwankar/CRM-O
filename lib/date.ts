const UK_LOCALE = 'en-GB';
const UK_TIME_ZONE = 'Europe/London';

function asDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function formatWithOptions(value: string | Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(UK_LOCALE, {
    timeZone: UK_TIME_ZONE,
    ...options,
  }).format(asDate(value));
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

export function formatUkDate(value: string | Date, options: Intl.DateTimeFormatOptions = {}) {
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
    ...options,
  });
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
    month: 'short',
    day: 'numeric',
  });
}

export function formatUkIsoDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: UK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(asDate(value));
}
