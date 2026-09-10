/**
 * Inquiry Inbox parser — turns a raw freight email / WhatsApp message into
 * structured enquiry fields. Pure heuristics (regex + label matching), no AI
 * call needed, so it works offline and instantly.
 */

export type TransportMode = 'air' | 'sea' | 'road' | 'courier' | '';

export interface ParsedInquiry {
  headline: string;
  mode: TransportMode;
  loadType: string;
  origin: string;
  destination: string;
  incoterm: string;
  readyDate: string; // YYYY-MM-DD
  commodity: string;
  packageType: string;
  pieces: string;
  dimensions: string;
  weight: string;
  chargeableWeight: string;
  cargoLines: string[];
  airline: string;
  routing: string;
  services: string;
  price: number | null;
  currency: string;
  senderName: string;
  senderCompany: string;
  senderEmail: string;
  senderPhone: string;
  receivedThrough: 'email' | 'whatsapp' | 'other';
  priority: 'low' | 'medium' | 'high';
}

const EMPTY: ParsedInquiry = {
  headline: '',
  mode: '',
  loadType: '',
  origin: '',
  destination: '',
  incoterm: '',
  readyDate: '',
  commodity: '',
  packageType: '',
  pieces: '',
  dimensions: '',
  weight: '',
  chargeableWeight: '',
  cargoLines: [],
  airline: '',
  routing: '',
  services: '',
  price: null,
  currency: '',
  senderName: '',
  senderCompany: '',
  senderEmail: '',
  senderPhone: '',
  receivedThrough: 'other',
  priority: 'medium',
};

/** Normalise a label for lookup: lowercase, letters only. */
function normLabel(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '');
}

type FieldKey =
  | 'origin'
  | 'destination'
  | 'incoterm'
  | 'readyDate'
  | 'commodity'
  | 'packageType'
  | 'pieces'
  | 'dimensions'
  | 'weight'
  | 'chargeableWeight'
  | 'airline'
  | 'routing'
  | 'mode'
  | 'customer'
  | 'loadType'
  | 'services'
  | 'phone';

const LABEL_MAP: Record<string, FieldKey> = {
  // origin
  origin: 'origin',
  originaddress: 'origin',
  collection: 'origin',
  collectionaddress: 'origin',
  pickup: 'origin',
  pickupaddress: 'origin',
  portofloading: 'origin',
  pol: 'origin',
  fromorigin: 'origin',
  // destination
  destination: 'destination',
  destinationaddress: 'destination',
  delivery: 'destination',
  deliveryaddress: 'destination',
  deliverto: 'destination',
  finaldestination: 'destination',
  portofdischarge: 'destination',
  pod: 'destination',
  todestination: 'destination',
  // incoterm
  incoterm: 'incoterm',
  incoterms: 'incoterm',
  terms: 'incoterm',
  term: 'incoterm',
  // dates
  readydate: 'readyDate',
  cargoreadydate: 'readyDate',
  crd: 'readyDate',
  ready: 'readyDate',
  // cargo
  commodity: 'commodity',
  goods: 'commodity',
  product: 'commodity',
  packagetype: 'packageType',
  packaging: 'packageType',
  numberofpackages: 'pieces',
  noofpackages: 'pieces',
  numberofboxes: 'pieces',
  quantity: 'pieces',
  qty: 'pieces',
  pieces: 'pieces',
  packages: 'pieces',
  dimensions: 'dimensions',
  dimensionsperbox: 'dimensions',
  dims: 'dimensions',
  size: 'dimensions',
  weight: 'weight',
  weightperbox: 'weight',
  grossweight: 'weight',
  totalgrossweight: 'weight',
  totalweight: 'weight',
  chargeableweight: 'chargeableWeight',
  // transport
  airline: 'airline',
  carrier: 'airline',
  shippingline: 'airline',
  routing: 'routing',
  route: 'routing',
  via: 'routing',
  shipmenttype: 'mode',
  mode: 'mode',
  transportmode: 'mode',
  modeoftransport: 'mode',
  loadtype: 'loadType',
  // people
  customer: 'customer',
  customeremail: 'customer',
  client: 'customer',
  clientemail: 'customer',
  sender: 'customer',
  senderemail: 'customer',
  contact: 'customer',
  phone: 'phone',
  senderphone: 'phone',
  mobile: 'phone',
  tel: 'phone',
  telephone: 'phone',
  // services
  servicesrequested: 'services',
  services: 'services',
  scopeofwork: 'services',
};

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Convert many human date formats to YYYY-MM-DD ('' when not parseable). */
export function toIsoDate(input: string): string {
  const s = String(input || '').trim();
  if (!s) return '';

  let m = s.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;

  // 6 September 2026 / 06 Sep 2026
  m = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\.?,?\s+(\d{4})\b/i);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mon) return `${m[3]}-${String(mon).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }

  // September 6, 2026
  m = s.match(/\b([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i);
  if (m) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mon) return `${m[3]}-${String(mon).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }

  // 28/08/2026, 08/28/2026, 28-08-2026, 28.08.2026
  m = s.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\b/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    let day = a;
    let mon = b;
    if (a <= 12 && b > 12) {
      // definitely MM/DD
      mon = a;
      day = b;
    }
    if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) {
      return `${m[3]}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return '';
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  '£': 'GBP',
  $: 'USD',
  '€': 'EUR',
  '₹': 'INR',
};

const CURRENCY_CODES = ['GBP', 'USD', 'EUR', 'AED', 'INR'];

function findAmount(line: string): { amount: number; currency: string } | null {
  // £523.15 / $55 / €12.50 / ₹4,000
  let m = line.match(/([£$€₹])\s*([\d,]+(?:\.\d{1,2})?)/);
  if (m) {
    const amount = Number(m[2].replace(/,/g, ''));
    if (Number.isFinite(amount) && amount > 0) {
      return { amount, currency: CURRENCY_SYMBOLS[m[1]] || '' };
    }
  }
  // GBP 569 / USD 55.00 / 569 GBP
  m = line.match(/\b(GBP|USD|EUR|AED|INR)\b\s*:?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (m) {
    const amount = Number(m[2].replace(/,/g, ''));
    if (Number.isFinite(amount) && amount > 0) {
      return { amount, currency: m[1].toUpperCase() };
    }
  }
  m = line.match(/([\d,]+(?:\.\d{1,2})?)\s*\b(GBP|USD|EUR|AED|INR)\b/i);
  if (m) {
    const amount = Number(m[1].replace(/,/g, ''));
    if (Number.isFinite(amount) && amount > 0) {
      return { amount, currency: m[2].toUpperCase() };
    }
  }
  return null;
}

const INCOTERMS = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'DDU'];

function detectIncoterm(text: string): string {
  if (/ex[\s-]?works/i.test(text)) return 'EXW';
  const m = text.match(new RegExp(`\\b(${INCOTERMS.join('|')})\\b`));
  return m ? m[1] : '';
}

function detectMode(text: string, explicit?: string): TransportMode {
  const ex = String(explicit || '').toLowerCase();
  if (/\bair\b|airfreight/.test(ex)) return 'air';
  if (/\bsea\b|ocean|fcl|lcl/.test(ex)) return 'sea';
  if (/\broad\b|truck|land/.test(ex)) return 'road';
  if (/courier|express/.test(ex)) return 'courier';

  const scores = { air: 0, sea: 0, road: 0, courier: 0 };
  if (/air\s?freight|airfreight|\ba\/f\b/i.test(text)) scores.air += 3;
  if (/\bair waybill\b|\bawb\b/i.test(text)) scores.air += 2;
  if (/\bairline\b|\bflight\b|airport/i.test(text)) scores.air += 2;
  if (/\b[A-Z]{3}\s*(?:→|->|–|-)\s*[A-Z]{3}\b/.test(text)) scores.air += 1;
  if (/sea\s?freight|ocean\s?freight/i.test(text)) scores.sea += 3;
  if (/\bfcl\b|\blcl\b|\bvessel\b|bill of lading|port of loading|\bteu\b/i.test(text)) scores.sea += 2;
  if (/\b(20|40)\s?(ft|')\s?(container|gp|hc)\b/i.test(text)) scores.sea += 2;
  if (CONTAINER_RE.test(text)) scores.sea += 3; // e.g. 1x40'HQ
  if (/\bport\b/i.test(text)) scores.sea += 1; // "…to Aqaba port" (does not match "airport")
  if (/road\s?freight|\bftl\b|\bltl\b|\btruck\b|trailer|haulage/i.test(text)) scores.road += 2;
  if (/\bcourier\b|door.to.door express|dhl|fedex|ups\b/i.test(text)) scores.courier += 2;

  const best = (Object.entries(scores) as Array<[TransportMode, number]>).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : '';
}

function detectLoadType(text: string): string {
  if (/\bfcl\b/i.test(text)) return 'FCL';
  if (/\blcl\b/i.test(text)) return 'LCL';
  if (/\bftl\b/i.test(text)) return 'FTL';
  if (/\bltl\b/i.test(text)) return 'LTL';
  if (/break\s?bulk/i.test(text)) return 'Break bulk';
  if (/general cargo/i.test(text)) return 'General cargo';
  return '';
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

const DIMS_RE = /(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*(cm|mm|m|in|inch|inches)?/i;

// Container spec, e.g. 1X40`HQ / 2 x 20' GP / 1×40HC
const CONTAINER_RE = /(\d+)\s*[x×]\s*(20|40|45)\s*['`’′]?\s*(hq|hc|gp|dv|rf|ot|fr|reefer|std)\b/i;

// Sign-off words that end an address block
const STOP_WORDS_RE = /^(regards|kind regards|best regards|thanks|thank you|sincerely|dear\b|cheers)/i;

/** Main entry point. */
export function parseInquiry(raw: string): ParsedInquiry {
  const out: ParsedInquiry = { ...EMPTY, cargoLines: [] };
  const text = String(raw || '').replace(/\r/g, '');
  if (!text.trim()) return out;

  const lines = text
    .split('\n')
    .map((l) => l.replace(/^[\s•\-–—*·]+/, '').trim())
    .filter(Boolean); // emails often have blank lines between every row

  const fields: Partial<Record<FieldKey, string>> = {};

  // Labels that should overwrite a weaker, earlier match for the same field
  // (e.g. "Total Gross Weight" beats "Weight per Box").
  const STRONG_LABELS = new Set(['totalgrossweight', 'totalweight', 'grossweight']);

  const setField = (key: FieldKey, value: string, labelNorm?: string) => {
    const v = value.trim().replace(/\s{2,}/g, ' ');
    if (!v) return;
    if (!fields[key] || (labelNorm && STRONG_LABELS.has(labelNorm))) fields[key] = v;
  };

  // Pass 1 — "Label: value" and "Label :: value" pairs
  for (const line of lines) {
    const m = line.match(/^([A-Za-z][A-Za-z /()&-]{1,40}?)\s*:{1,2}\s*(.+)$/);
    if (!m) continue;
    const ln = normLabel(m[1]);
    const key = LABEL_MAP[ln];
    if (key) setField(key, m[2], ln);
  }

  // Pass 2 — table style: a line that IS a label (optionally ending with ":"),
  // value on the following line(s). e.g. "Pickup address:" then the address.
  const isLabelLine = (l: string) => Boolean(LABEL_MAP[normLabel(l.replace(/\s*:{1,2}\s*$/, ''))]);
  for (let i = 0; i < lines.length - 1; i++) {
    const bare = lines[i].replace(/\s*:{1,2}\s*$/, '');
    const ln = normLabel(bare);
    const label = LABEL_MAP[ln];
    if (!label) continue;
    // Skip "Label: value" (inline value) — pass 1 already handled it
    if (/:.*\S/.test(lines[i]) && !/:{1,2}\s*$/.test(lines[i])) continue;
    const next = lines[i + 1];
    if (!next || isLabelLine(next)) continue;
    if (/^(description|details|service|amount)$/i.test(next)) continue;
    if (STOP_WORDS_RE.test(next)) continue;

    if (label === 'origin' || label === 'destination') {
      // Addresses often span several short lines — join them
      const parts: string[] = [];
      for (let j = i + 1; j < lines.length && parts.length < 6; j++) {
        const l = lines[j];
        if (!l || isLabelLine(l) || STOP_WORDS_RE.test(l)) break;
        if (l.includes(':') || l.includes('@') || l.length > 48) break;
        if (DIMS_RE.test(l) || /\d\s*kg\b/i.test(l)) break;
        parts.push(l);
      }
      if (parts.length) setField(label, parts.join(', '), ln);
    } else {
      setField(label, next, ln);
    }
  }

  // Prose "from X to Y"
  let prose = text.match(
    /\bfrom\s+([A-Z][^\n]{2,60}?)\s+to\s+([A-Z][^\n.]{2,60}?)(?:[.\n]|$)/,
  );
  if (prose) {
    if (!fields.origin) fields.origin = prose[1].trim().replace(/[,;]$/, '');
    if (!fields.destination) fields.destination = prose[2].trim().replace(/[,;]$/, '');
  }

  // "…shipment to Aqaba port" → destination
  if (!fields.destination) {
    const dp = text.match(/\b(?:to|To|TO|for|For)\s+([A-Z][a-z][A-Za-z-]*(?:\s+[A-Z][A-Za-z-]+){0,2})\s+(?:sea\s*)?[Pp]ort\b/);
    if (dp) fields.destination = dp[1];
  }

  // Subject-line route, e.g. "EXW - UK TO AQABA - 1X40`HQ"
  const route = text.match(/(?<!SUBJECT\s)\b([A-Z][A-Z .]{0,18}[A-Z]|[A-Z]{2})\s+TO\s+([A-Z][A-Z .]{0,18}[A-Z]|[A-Z]{2})\b/);
  if (route && route[1] !== route[2] && !/^(DOOR|SUBJECT|UP|BACK)$/.test(route[1]) && !/^(DOOR|BOOK)$/.test(route[2])) {
    if (!fields.origin) fields.origin = titleCase(route[1]);
    if (!fields.destination) fields.destination = titleCase(route[2]);
  }

  out.origin = fields.origin || '';
  out.destination = fields.destination || '';
  out.commodity = fields.commodity || '';
  out.packageType = fields.packageType || '';
  out.airline = fields.airline || '';
  out.routing = fields.routing || '';
  out.services = fields.services || '';
  out.senderPhone = fields.phone || '';

  // Incoterm — prefer labeled "Terms", else scan whole text
  const termsRaw = fields.incoterm || '';
  out.incoterm = detectIncoterm(termsRaw) || detectIncoterm(text);
  // "Terms: EXW – Final Address" → the tail is a service hint
  if (termsRaw) {
    const tail = termsRaw
      .replace(/ex[\s-]?works/i, '')
      .replace(new RegExp(`\\b(${INCOTERMS.join('|')})\\b`, 'g'), '')
      .replace(/^[\s|–\-—:]+|[\s|–\-—:]+$/g, '');
    if (tail && !out.services) out.services = tail;
  }

  // Mode + load type
  out.mode = detectMode(text, fields.mode);
  out.loadType = detectLoadType(`${fields.loadType || ''} ${text}`);
  const cont = text.match(CONTAINER_RE);
  if (cont) {
    out.loadType = `FCL – ${cont[1]} × ${cont[2]}'${cont[3].toUpperCase()}`;
  }

  // Ready date
  out.readyDate = toIsoDate(fields.readyDate || '');
  if (!out.readyDate) {
    const rd = text.match(/ready\s*date[^\n:]*:?\s*([^\n]+)/i);
    if (rd) out.readyDate = toIsoDate(rd[1]);
  }

  // Pieces — collect "boxes: 663" / "pallets: 21" style rows first
  const pieceParts: string[] = [];
  for (const line of lines) {
    const pm = line.match(/^(boxes|pallets|cartons|packages|pieces|pcs|crates|drums|bags|units)\s*:{1,2}\s*([\d,]+)\s*$/i);
    if (pm) pieceParts.push(`${pm[2]} ${pm[1].toLowerCase()}`);
  }
  out.pieces = pieceParts.length ? pieceParts.join(', ') : fields.pieces || '';
  if (!out.pieces) {
    const p =
      text.match(/total\s*:?\s*(\d+)\s*(pcs?|pieces|boxes|packages|pallets|cartons)/i) ||
      text.match(/\b(\d+)[ \t]*(boxes|packages|pallets|cartons|pcs)\b/i);
    if (p) out.pieces = `${p[1]} ${p[2]}`;
  }

  // Dimensions
  out.dimensions = fields.dimensions || '';
  if (!out.dimensions) {
    const d = text.match(DIMS_RE);
    if (d) out.dimensions = `${d[1]} × ${d[2]} × ${d[3]} ${d[4] || 'cm'}`;
  }

  // Weights
  out.weight = fields.weight || '';
  if (!out.weight) {
    const w =
      text.match(/total\s+(?:gross\s+)?weight[^\d\n]*([\d.,]+)\s*kg/i) ||
      text.match(/total\s*:?[^\n]*?\/\s*([\d.,]+)\s*kg/i) ||
      text.match(/\b([\d.,]+)\s*kg\b/i);
    if (w) out.weight = `${w[1]} kg`;
  } else if (!/kg|lb|ton/i.test(out.weight)) {
    out.weight = `${out.weight} kg`;
  }
  out.chargeableWeight = fields.chargeableWeight || '';
  if (!out.chargeableWeight) {
    const cw = text.match(/chargeable\s+weight[^\d\n]*([\d.,]+)\s*kg/i);
    if (cw) out.chargeableWeight = `${cw[1]} kg`;
  } else if (!/kg/i.test(out.chargeableWeight)) {
    out.chargeableWeight = `${out.chargeableWeight} kg`;
  }

  // Cargo item lines, e.g. "1 pc – 40 × 40 × 40 cm – 9 kg – Dry Ice / -80°C"
  for (const line of lines) {
    if (out.cargoLines.length >= 6) break;
    const hasDims = DIMS_RE.test(line);
    const hasQtyAndWeight = /\b\d+\s*(pcs?|pieces|boxes)\b/i.test(line) && /\d\s*kg\b/i.test(line);
    if ((hasDims || hasQtyAndWeight) && line.length < 140) {
      out.cargoLines.push(line);
    }
  }

  // Price — prefer the last TOTAL line
  let best: { amount: number; currency: string } | null = null;
  for (let i = 0; i < lines.length; i++) {
    if (!/\btotal\b/i.test(lines[i])) continue;
    const hit = findAmount(lines[i]) || findAmount(lines[i + 1] || '') || findAmount(lines[i + 2] || '');
    if (hit) best = hit; // keep the last one (grand total usually comes last)
  }
  if (!best) {
    // any target price hint
    const tp = text.match(/target\s+(?:price|rate|budget)[^\n]*/i);
    if (tp) best = findAmount(tp[0]);
  }
  if (best) {
    out.price = best.amount;
    out.currency = best.currency;
  }
  if (!out.currency) {
    for (const code of CURRENCY_CODES) {
      if (new RegExp(`\\b${code}\\b`, 'i').test(text)) {
        out.currency = code;
        break;
      }
    }
    if (!out.currency) {
      const sym = text.match(/[£$€₹]/);
      if (sym) out.currency = CURRENCY_SYMBOLS[sym[0]] || '';
    }
  }

  // Sender — `"Name - Company" <email>` first, then plain `Name <email>`,
  // then labeled customer line, then any email in the text.
  const applySender = (name: string, email: string) => {
    out.senderEmail = email.trim();
    const parts = name.split(/\s+[-–—]\s+/);
    out.senderName = parts[0].trim();
    if (parts.length > 1) out.senderCompany = parts.slice(1).join(' - ').trim();
  };
  const quoted = text.match(/"([^"\n]{2,80})"\s*<([^<>\s@]+@[^<>\s]+)>/);
  if (quoted) applySender(quoted[1], quoted[2]);
  if (!out.senderEmail) {
    const plain = text.match(/(?:^|\n)\s*'?([A-Z][A-Za-z.' -]{2,50}?)'?\s*<([\w.+-]+@[\w-]+\.[\w.-]+)>/);
    if (plain) applySender(plain[1], plain[2]);
  }
  if (!out.senderEmail && fields.customer) {
    const em = fields.customer.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (em) out.senderEmail = em[0];
    const namePart = fields.customer.replace(/[<>"]/g, '').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/, '').trim();
    if (namePart && !out.senderName) out.senderName = namePart.replace(/[\s:;,–-]+$/, '').trim();
  }
  if (!out.senderEmail) {
    const em = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (em) out.senderEmail = em[0];
  }
  out.senderEmail = out.senderEmail.replace(/[.,;]$/, '');
  // Never show an email address as the sender's name
  if (out.senderName.includes('@')) {
    const local = out.senderName.split('@')[0].replace(/[._-]+/g, ' ').trim();
    out.senderName = local ? titleCase(local) : '';
  }
  if (!out.senderCompany && out.senderEmail) {
    const domain = out.senderEmail.split('@')[1] || '';
    const base = domain.split('.')[0] || '';
    if (base && !['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'live', 'aol', 'proton', 'protonmail'].includes(base.toLowerCase())) {
      out.senderCompany = titleCase(base);
    }
  }
  if (!out.senderPhone) {
    const ph = text.match(/(?:\+|00)\d[\d\s().-]{7,16}\d/);
    if (ph) out.senderPhone = ph[0].trim();
  }

  // Received through
  if (/whatsapp|wa message|forwarded message/i.test(text)) out.receivedThrough = 'whatsapp';
  else if (out.senderEmail || /subject:|dear\s|regards|kind regards/i.test(text)) out.receivedThrough = 'email';

  // Priority
  if (/\burgent\b|\basap\b|as soon as possible|immediately|time.critical|high priority/i.test(text)) {
    out.priority = 'high';
  }

  // Headline
  const modeLabel =
    out.mode === 'air' ? 'Air' : out.mode === 'sea' ? 'Sea' : out.mode === 'road' ? 'Road' : out.mode === 'courier' ? 'Courier' : '';
  if (out.origin && out.destination) {
    const shortOrigin = out.origin.length > 40 ? `${out.origin.slice(0, 40)}…` : out.origin;
    const shortDest = out.destination.length > 40 ? `${out.destination.slice(0, 40)}…` : out.destination;
    out.headline = `${modeLabel ? `${modeLabel}: ` : ''}${shortOrigin} → ${shortDest}`;
  } else {
    const firstLine = lines.find((l) => l.length > 12) || '';
    out.headline = firstLine.slice(0, 80);
  }

  return out;
}

/** Build the enquiry "requirement" text from parsed fields (editable before save). */
export function buildRequirement(p: ParsedInquiry): string {
  const modeLabel =
    p.mode === 'air'
      ? 'Air freight'
      : p.mode === 'sea'
        ? 'Sea freight'
        : p.mode === 'road'
          ? 'Road freight'
          : p.mode === 'courier'
            ? 'Courier'
            : 'Freight';
  const rows: string[] = [`${modeLabel} enquiry${p.loadType ? ` (${p.loadType})` : ''}`];
  if (p.origin) rows.push(`Origin: ${p.origin}`);
  if (p.destination) rows.push(`Destination: ${p.destination}`);
  if (p.incoterm) rows.push(`Incoterm: ${p.incoterm}`);
  if (p.readyDate) rows.push(`Ready date: ${p.readyDate}`);
  if (p.commodity) rows.push(`Commodity: ${p.commodity}`);

  const cargoBits = [p.pieces, p.dimensions, p.weight && `gross ${p.weight}`, p.chargeableWeight && `chargeable ${p.chargeableWeight}`]
    .filter(Boolean)
    .join(', ');
  if (cargoBits) rows.push(`Cargo: ${cargoBits}`);
  // Itemised cargo lines only add value for multi-item shipments;
  // a single line just repeats the dimensions above.
  if (p.cargoLines.length >= 2) {
    for (const line of p.cargoLines.slice(0, 4)) rows.push(`  • ${line}`);
  }

  if (p.routing || p.airline) rows.push(`Routing: ${[p.routing, p.airline && `(${p.airline})`].filter(Boolean).join(' ')}`);
  if (p.services) rows.push(`Services: ${p.services}`);
  if (p.price) rows.push(`Quoted / target price: ${p.currency || ''} ${p.price}`.trim());
  return rows.join('\n');
}
