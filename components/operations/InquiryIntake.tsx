'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Inbox, Loader2, Save, Sparkles, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createOperationsEnquiry } from '@/lib/api/operations';
import {
  buildRequirement,
  parseInquiry,
  INCOTERMS,
  type ParsedInquiry,
  type TransportMode,
} from '@/lib/inquiryParser';

const MODE_OPTIONS: Array<{ value: TransportMode | 'none'; label: string }> = [
  { value: 'none', label: 'Not identified' },
  { value: 'air', label: 'Air' },
  { value: 'sea', label: 'Sea / Ocean' },
  { value: 'road', label: 'Road / Land' },
  { value: 'courier', label: 'Courier / Express' },
];

export function InquiryIntake({ onCreated }: { onCreated?: () => void }) {
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState<ParsedInquiry | null>(null);
  const [requirement, setRequirement] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [parsing, setParsing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!raw.trim()) {
      setParsed(null);
      setRequirement('');
      return;
    }
    setParsing(true);
    timer.current = setTimeout(() => {
      const result = parseInquiry(raw);
      setParsed(result);
      setRequirement(buildRequirement(result));
      setParsing(false);
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [raw]);

  const set = <K extends keyof ParsedInquiry>(key: K, value: ParsedInquiry[K]) => {
    setParsed((current) => (current ? { ...current, [key]: value } : current));
  };

  useEffect(() => {
    if (parsed) setRequirement(buildRequirement(parsed));
  }, [
    parsed?.mode,
    parsed?.loadType,
    parsed?.origin,
    parsed?.destination,
    parsed?.incoterm,
    parsed?.readyDate,
    parsed?.commodity,
    parsed?.pieces,
    parsed?.dimensions,
    parsed?.weight,
    parsed?.chargeableWeight,
    parsed?.services,
    parsed?.price,
    parsed?.currency,
    parsed?.routing,
    parsed?.airline,
  ]);

  const saveMut = useMutation({
    mutationFn: () => {
      if (!parsed) throw new Error('Paste an inquiry first');
      const req = requirement.trim();
      if (req.length < 10) throw new Error('The requirement summary is too short');
      const prospect = [parsed.senderName, parsed.senderCompany].filter(Boolean).join(' — ');
      const receivedVia =
        parsed.receivedThrough === 'whatsapp'
          ? 'WhatsApp'
          : parsed.receivedThrough === 'email'
            ? 'Email'
            : parsed.receivedThrough === 'phone'
              ? 'Phone call'
              : 'Other';
      return createOperationsEnquiry({
        title: parsed.headline || null,
        requirement: req,
        prospect_name: prospect || null,
        standalone_project_name: parsed.senderCompany || null,
        client_email: parsed.senderEmail || null,
        client_budget: parsed.price ?? null,
        client_currency: parsed.currency || null,
        deadline: parsed.readyDate || null,
        priority: parsed.priority,
        stage: 'new_enquiry',
        notes: [
          `Received through: ${receivedVia}`,
          parsed.senderPhone ? `Sender phone: ${parsed.senderPhone}` : '',
          extraInfo.trim(),
          '',
          '--- Original message ---',
          raw.trim().slice(0, 8000),
        ]
          .filter((line, index) => line !== '' || index === 2)
          .join('\n'),
      });
    },
    onSuccess: (enquiry) => {
      toast.success(`${enquiry.enquiry_number} is on the pipeline and in Enquiries`);
      setRaw('');
      setParsed(null);
      setRequirement('');
      setExtraInfo('');
      onCreated?.();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const chips = useMemo(() => {
    if (!parsed) return [];
    return [
      parsed.mode && `Mode: ${parsed.mode.toUpperCase()}`,
      parsed.incoterm && `Incoterm: ${parsed.incoterm}`,
      parsed.readyDate && `Ready: ${parsed.readyDate}`,
      parsed.price && `${parsed.currency || ''} ${parsed.price}`.trim(),
      parsed.senderEmail && parsed.senderEmail,
    ].filter(Boolean) as string[];
  }, [parsed]);

  const inputClass = 'field';

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="panel" style={{ padding: 16 }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Wand2 className="h-4 w-4" />
            Paste email or WhatsApp message
          </h2>
          <span className="hint">
            {raw.length.toLocaleString()} characters
            {parsing ? ' · reading…' : parsed ? ' · extracted' : ''}
          </span>
        </div>
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={'Paste an email or WhatsApp message. Fields fill in on the right.'}
          className={`qpaste min-h-[280px] font-mono text-[13px] ${inputClass}`}
        />
        {chips.length > 0 && (
          <div className="quick" style={{ marginTop: 12 }}>
            {chips.map((chip) => (
              <span key={chip} className="pill acc">{chip}</span>
            ))}
          </div>
        )}
      </div>

      <div className="panel" style={{ padding: 16 }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Check and edit
          </h2>
          {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        </div>

        {!parsed ? (
          <div className="empty" style={{ margin: 0 }}>
            <Inbox className="mx-auto mb-2 h-8 w-8" />
            <h3>Paste a message to start</h3>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="lbl">Inquiry ID</Label>
              <Input className={inputClass} value="Assigned automatically" readOnly aria-label="Inquiry ID" />
              <p className="hint">The next number, such as ENQ-2026-012, is created when you save.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="lbl">Customer name</Label>
                <Input className={inputClass} value={parsed.senderName} onChange={(e) => set('senderName', e.target.value)} placeholder="Contact name" />
              </div>
              <div className="space-y-1.5">
                <Label className="lbl">Company</Label>
                <Input className={inputClass} value={parsed.senderCompany} onChange={(e) => set('senderCompany', e.target.value)} placeholder="Customer company" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="lbl">Customer email</Label>
                <Input className={inputClass} type="email" value={parsed.senderEmail} onChange={(e) => set('senderEmail', e.target.value)} placeholder="name@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="lbl">Customer phone</Label>
                <Input className={inputClass} value={parsed.senderPhone} onChange={(e) => set('senderPhone', e.target.value)} placeholder="Phone number" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="lbl">Subject</Label>
              <Input className={inputClass} value={parsed.headline} onChange={(e) => set('headline', e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="lbl">Route from</Label>
                <Input className={inputClass} value={parsed.origin} onChange={(e) => set('origin', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="lbl">Route to</Label>
                <Input className={inputClass} value={parsed.destination} onChange={(e) => set('destination', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="lbl">Mode</Label>
                <Select value={parsed.mode || 'none'} onValueChange={(value) => set('mode', (value === 'none' ? '' : value) as TransportMode)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="lbl">Incoterm</Label>
                <Select value={parsed.incoterm && INCOTERMS.includes(parsed.incoterm as typeof INCOTERMS[number]) ? parsed.incoterm : parsed.incoterm ? parsed.incoterm : 'none'} onValueChange={(value) => set('incoterm', value === 'none' ? '' : value)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select incoterm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {parsed.incoterm && !INCOTERMS.includes(parsed.incoterm as typeof INCOTERMS[number]) ? (
                      <SelectItem value={parsed.incoterm}>{parsed.incoterm}</SelectItem>
                    ) : null}
                    {INCOTERMS.map((term) => (
                      <SelectItem key={term} value={term}>{term}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="lbl">Deadline</Label>
                <Input className={inputClass} type="date" value={parsed.readyDate} onChange={(e) => set('readyDate', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="lbl">Shipment</Label>
              <Textarea value={requirement} onChange={(e) => setRequirement(e.target.value)} className={`min-h-24 font-mono text-[12px] ${inputClass}`} />
            </div>
            <div className="space-y-1.5">
              <Label className="lbl">Extra notes</Label>
              <Textarea
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                placeholder="Handling notes. Keep agent rates on the pipeline card."
                className={`min-h-16 text-sm ${inputClass}`}
              />
            </div>
            <div className="acts" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn pri" onClick={() => saveMut.mutate()} disabled={saveMut.isPending || requirement.trim().length < 10}>
                {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Create inquiry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
