export function placeCode(place: string) {
  const letters = String(place || '').replace(/\(.*?\)/g, ' ').split(',')[0].replace(/[^A-Za-z]/g, '');
  return (letters.slice(0, 3) || 'TBC').toUpperCase();
}

export function makeInqId(
  origin: string,
  dest: string,
  contact: string,
  company: string,
  existing: string[],
) {
  const now = new Date();
  const day = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const base = `${placeCode(origin)}-${placeCode(dest)}-${day}`;
  const taken = new Set(existing.map((id) => id.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  const first = String(contact || '')
    .replace(/^(?:mr|mrs|ms|miss|dr|mx|sir)\.?\s+/i, '')
    .trim()
    .split(/\s+/)[0]
    || String(company || '').replace(/\(.*?\)/g, ' ').trim().split(/\s+/)[0]
    || '';
  const name = first.replace(/[^A-Za-z0-9]/g, '');
  const who = name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : '';
  let id = who ? `${base}-${who}` : `${base}-2`;
  let n = 2;
  while (taken.has(id.toLowerCase())) {
    id = who ? `${base}-${who}-${n++}` : `${base}-${++n}`;
  }
  return id;
}
