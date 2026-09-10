'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Inbox, Loader2, Save, Sparkles, Wand2 } from 'lucide-react';
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
import { createEnquiry } from '@/lib/api/enquiries';
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

export default function InquiryInboxPage() {
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState<ParsedInquiry | null>(null);
  const [requirement, setRequirement] = useState('');
  const [parsing, setParsing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-extract when the user stops typing/pasting
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
    setParsed((p) => (p ? { ...p, [key]: value } : p));
  };

  // Keep the requirement summary in sync with edits to structured fields
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
      return createEnquiry({
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
          '',
          '--- Original message ---',
          raw.trim().slice(0, 8000),
        ]
          .filter((l, i) => l !== '' || i === 2)
          .join('\n'),
      });
    },
    onSuccess: (enquiry) => {
      toast.success(`Enquiry ${enquiry.enquiry_number} created`);
      router.push(`/dashboard/enquiries/${enquiry.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/enquiries">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-violet-800">
              <Inbox className="h-8 w-8 text-violet-600" />
              Inquiry Inbox
            </p>
            <p className="text-sm text-muted-foreground">
              Paste a freight email or WhatsApp message. The fields fill themselves — review and save.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-700">1 · Paste</span>
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">2 · Review</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">3 · Save</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Left: raw inquiry */}
        <Card className="border-violet-100 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-violet-800">
              <Wand2 className="h-4 w-4" />
              Raw inquiry
            </h2>
            <span className="text-xs text-muted-foreground">
              {raw.length.toLocaleString()} characters
              {parsing ? ' · reading…' : parsed ? ' · extracted' : ''}
            </span>
          </div>
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={
              'Paste anything — an email, a quotation, a WhatsApp message…\n\nExample:\nOrigin: Egypt (Madinat Al-Amal 11727)\nDestination: Sheffield S1 1AU, United Kingdom\nReady Date: 28 August 2026\nTerms: Ex-Works | Final Address Delivery\nDimensions: 33 x 33 x 23 cm\nWeight: 6 kg\nShipment type :: AIR'
            }
            className="min-h-[420px] bg-violet-50/30 font-mono text-[13px]"
          />
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span key={c} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                  {c}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Right: structured record */}
        <Card className="border-blue-100 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-blue-800">
              <Sparkles className="h-4 w-4" />
              Structured record
            </h2>
            {parsing ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> : null}
          </div>

          {!parsed ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 text-center">
              <Inbox className="h-8 w-8 text-blue-300" />
              <p className="text-sm font-medium text-blue-800">Your CRM fields appear here</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Paste a message on the left. Extraction starts automatically when you stop typing.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Quote headline</Label>
                <Input value={parsed.headline} onChange={(e) => set('headline', e.target.value)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Transport mode</Label>
                  <Select
                    value={parsed.mode || 'none'}
                    onValueChange={(v) => set('mode', (v === 'none' ? '' : v) as TransportMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Load type</Label>
                  <Input value={parsed.loadType} onChange={(e) => set('loadType', e.target.value)} placeholder="FCL / LCL / General cargo" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Incoterm</Label>
                  <Input value={parsed.incoterm} onChange={(e) => set('incoterm', e.target.value)} placeholder="EXW, FOB…" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">From / Origin</Label>
                  <Input value={parsed.origin} onChange={(e) => set('origin', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To / Destination</Label>
                  <Input value={parsed.destination} onChange={(e) => set('destination', e.target.value)} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ready date</Label>
                  <Input type="date" value={parsed.readyDate} onChange={(e) => set('readyDate', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Pieces / packages</Label>
                  <Input value={parsed.pieces} onChange={(e) => set('pieces', e.target.value)} placeholder="10 boxes" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Dimensions</Label>
                  <Input value={parsed.dimensions} onChange={(e) => set('dimensions', e.target.value)} placeholder="58 × 45 × 60 cm" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Gross weight</Label>
                  <Input value={parsed.weight} onChange={(e) => set('weight', e.target.value)} placeholder="200 kg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Chargeable weight</Label>
                  <Input value={parsed.chargeableWeight} onChange={(e) => set('chargeableWeight', e.target.value)} placeholder="261 kg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Commodity</Label>
                  <Input value={parsed.commodity} onChange={(e) => set('commodity', e.target.value)} placeholder="General cargo" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Services requested</Label>
                  <Input value={parsed.services} onChange={(e) => set('services', e.target.value)} placeholder="Delivery, customs clearance…" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Target / quoted price</Label>
                  <Input
                    type="number"
                    value={parsed.price ?? ''}
                    onChange={(e) => set('price', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Inquiry received via</Label>
                  <Select
                    value={parsed.receivedThrough}
                    onValueChange={(v) => set('receivedThrough', v as ParsedInquiry['receivedThrough'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="phone">Phone call</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Sender name</Label>
                  <Input value={parsed.senderName} onChange={(e) => set('senderName', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sender company</Label>
                  <Input value={parsed.senderCompany} onChange={(e) => set('senderCompany', e.target.value)} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Sender email</Label>
                  <Input value={parsed.senderEmail} onChange={(e) => set('senderEmail', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select value={parsed.priority} onValueChange={(v) => set('priority', v as ParsedInquiry['priority'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Requirement summary (saved on the enquiry)</Label>
                <Textarea
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  className="min-h-32 font-mono text-[12px]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-muted-foreground">
                  The original message is kept in the enquiry notes.
                </p>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending || requirement.trim().length < 10}
                >
                  {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save enquiry
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
