import type { PipelineInquiry } from '@/lib/api/operations';

export const COLUMNS = [
  { id: 'to_send', label: 'To send', dot: '#8893A2', empty: 'No inquiries to send' },
  { id: 'waiting', label: 'Waiting for rates', dot: '#A35F00', empty: 'No inquiries waiting on rates' },
  { id: 'choose_best', label: 'Choose best', dot: '#1F4FB8', empty: 'No quotes ready to compare' },
  { id: 'best_selected', label: 'Best selected', dot: '#1C7A4A', empty: 'No best rate chosen yet' },
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
  if (days <= 0) return { label: 'Today', tone: 'neutral' as const };
  if (days <= 3) return { label: `${days}d`, tone: 'warn' as const };
  return { label: `${days}d`, tone: 'crit' as const };
}

export function personHue(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('padma')) return '#6d28d9';
  if (lower.includes('vikram')) return '#c2410c';
  if (lower.includes('amal')) return '#047857';
  if (lower.includes('manju')) return '#0e7490';
  return '#1F4FB8';
}

export function initial(name: string) {
  return (name.trim()[0] || '?').toUpperCase();
}

export function money(amount?: number | null, currency?: string | null) {
  if (amount == null) return '';
  return `${currency || ''} ${Number(amount).toLocaleString()}`.trim();
}

export function statusLabel(column: string) {
  if (column === 'to_send') return 'To send';
  if (column === 'waiting') return 'Waiting for rates';
  if (column === 'choose_best') return 'Choose best';
  if (column === 'best_selected') return 'Best selected';
  return 'Closed';
}

export function dayGroup(iso: string) {
  const date = new Date(iso);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const yesterday = new Date(start);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date >= start) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  return date.toLocaleDateString('en-GB');
}
