export const COLUMNS = [
  { id: 'to_send', label: 'To send' },
  { id: 'waiting', label: 'Waiting for rates' },
  { id: 'choose_best', label: 'Choose best' },
  { id: 'best_selected', label: 'Best selected' },
] as const;

export function ageParts(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days <= 0) return { label: 'Today', className: 'bg-emerald-500/20 text-emerald-300' };
  if (days === 1) return { label: '1 day', className: 'bg-amber-500/20 text-amber-200' };
  if (days <= 4) return { label: `${days} days`, className: 'bg-amber-500/20 text-amber-200' };
  return { label: `${days} days`, className: 'bg-rose-500/20 text-rose-200' };
}

export function personColor(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('padma')) return 'bg-violet-500';
  if (lower.includes('vikram')) return 'bg-orange-500';
  if (lower.includes('amal')) return 'bg-emerald-500';
  if (lower.includes('manju')) return 'bg-cyan-500';
  return 'bg-blue-500';
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
