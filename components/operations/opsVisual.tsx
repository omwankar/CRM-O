import type { PipelineInquiry } from '@/lib/api/operations';

export const COLUMNS = [
  { id: 'to_send', label: 'To send', bar: 'var(--faint)', empty: 'Not sent to any agent yet' },
  { id: 'waiting', label: 'Waiting for rates', bar: 'var(--warn)', empty: 'Sent, no rates back yet' },
  { id: 'choose_best', label: 'Choose best', bar: 'var(--accent)', empty: 'Rates in, pick the best' },
  { id: 'best_selected', label: 'Best selected', bar: 'var(--ok)', empty: 'Best quote chosen' },
] as const;

const NOISE = /^(dear|hi|hello|pallets|product|kindly|please|good|team)\b/i;

export function formatRoute(inquiry: Pick<PipelineInquiry, 'route' | 'title' | 'requirement'>) {
  const tidy = (value: string) => value.replace(/\s+/g, ' ').trim();
  const lines = (inquiry.requirement || '').split('\n').map(tidy).filter(Boolean);
  const pool = [inquiry.route, inquiry.title, ...lines].map((line) => tidy(line || '')).filter(Boolean);
  const lane = pool.find((line) => /[→>]|\bto\b| - /.test(line) && !/^(dear|hi|hello|good)\b/i.test(line));
  if (lane) return lane.slice(0, 72);
  const prose = lines.find((line) => line.length > 12 && !NOISE.test(line));
  if (prose) return prose.slice(0, 60);
  const message = lines.join(' ').replace(/^(dear|hi|hello|good)\b[^.]{0,40}/i, '').trim();
  return (message || pool.find((line) => !NOISE.test(line)) || '').slice(0, 60);
}

export function ageParts(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days <= 0) return { label: 'today', tone: 'ok' as const, days: 0 };
  if (days === 1) return { label: '1 day', tone: 'ok' as const, days: 1 };
  if (days <= 3) return { label: `${days} days`, tone: 'warn' as const, days };
  return { label: `${days} days`, tone: 'crit' as const, days };
}

export function personHue(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('padma')) return '#5E2A8F';
  if (lower.includes('vikram')) return '#943010';
  if (lower.includes('amal')) return '#0B6047';
  if (lower.includes('manju')) return '#0A5468';
  return '#1E4C9E';
}

export function initial(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export function money(amount?: number | null, currency?: string | null) {
  if (amount == null) return '';
  return `${currency || ''} ${Number(amount).toLocaleString()}`.trim();
}

export function dayGroup(iso: string) {
  const date = new Date(iso);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const yesterday = new Date(start);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date >= start) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
