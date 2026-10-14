'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Inbox, Loader2, Save, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="border-violet-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-violet-800">
            <Wand2 className="h-4 w-4" />
            Paste inquiry
          </h2>
          <span className="text-xs text-muted-foreground">
            {raw.length.toLocaleString()} characters
            {parsing ? ' · reading…' : parsed ? ' · extracted' : ''}
          </span>
        </div>
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={'Paste an email or WhatsApp message. Fields fill in on the right.'}
          className="min-h-[220px] bg-violet-50/30 font-mono text-[13px]"
        />
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                {chip}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-blue-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-blue-800">
            <Sparkles className="h-4 w-4" />
            Structured record
          </h2>
          {parsing ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> : null}
        </div>

        {!parsed ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 text-center">
            <Inbox className="h-8 w-8 text-blue-300" />
            <p className="text-sm font-medium text-blue-800">Paste a message to start</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Headline</Label>
              <Input value={parsed.headline} onChange={(e) => set('headline', e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">From</Label>
                <Input value={parsed.origin} onChange={(e) => set('origin', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To</Label>
                <Input value={parsed.destination} onChange={(e) => set('destination', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Mode</Label>
                <Select value={parsed.mode || 'none'} onValueChange={(value) => set('mode', (value === 'none' ? '' : value) as TransportMode)}>
                  <SelectTrigger>
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
                <Label className="text-xs">Incoterm</Label>
                <Input value={parsed.incoterm} onChange={(e) => set('incoterm', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ready date</Label>
                <Input type="date" value={parsed.readyDate} onChange={(e) => set('readyDate', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Requirement</Label>
              <Textarea value={requirement} onChange={(e) => setRequirement(e.target.value)} className="min-h-24 font-mono text-[12px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Extra information</Label>
              <Textarea
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                placeholder="Handling notes. Keep agent rates on the pipeline card."
                className="min-h-16 text-sm"
              />
            </div>
            <div className="flex justify-end">
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => saveMut.mutate()} disabled={saveMut.isPending || requirement.trim().length < 10}>
                {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Add to pipeline
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
