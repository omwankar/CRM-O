'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ExternalLink,
  Loader2,
  Mail,
  Paperclip,
  PhoneCall,
  Target,
  FileSearch,
  User,
  X,
} from 'lucide-react';
import {
  categorizeCompanyEmail,
  getCompanyEmail,
  type CompanyEmail,
  type EmailCategory,
} from '@/lib/api/emails';
import { getLeads } from '@/lib/api/leads';
import { getQuotations } from '@/lib/api/quotations';
import { formatUkDateTime } from '@/lib/date';

const CATEGORIES: {
  id: EmailCategory;
  label: string;
  icon: typeof Target;
  activeClass: string;
}[] = [
  {
    id: 'lead',
    label: 'Lead',
    icon: Target,
    activeClass: 'border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'quotation',
    label: 'Quotation',
    icon: FileSearch,
    activeClass: 'border-blue-500/60 bg-blue-500/15 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'followup',
    label: 'Follow-up',
    icon: PhoneCall,
    activeClass: 'border-violet-500/60 bg-violet-500/15 text-violet-700 dark:text-violet-300',
  },
];

function formatDate(iso: string) {
  return formatUkDateTime(iso, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function EmailHtmlFrame({ html }: { html: string }) {
  const srcDoc = useMemo(
    () => `<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank"><style>
      body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.5; color: #1a1a1a; background: #ffffff; word-wrap: break-word; }
      img { max-width: 100%; height: auto; }
      table { max-width: 100%; }
      a { color: #2563eb; }
      blockquote { margin: 0.5em 0; padding-left: 1em; border-left: 3px solid #e5e7eb; color: #4b5563; }
    </style></head><body>${html}</body></html>`,
    [html],
  );

  return (
    <iframe
      title="Email content"
      srcDoc={srcDoc}
      sandbox="allow-same-origin allow-popups"
      className="w-full min-h-[360px] rounded-lg border border-border bg-white"
    />
  );
}

export function EmailCategoryBadge({ category }: { category: EmailCategory | null | undefined }) {
  if (!category) return null;
  const meta = CATEGORIES.find((c) => c.id === category);
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn('text-[10px] font-medium gap-1', meta.activeClass)}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </Badge>
  );
}

interface EmailDetailDialogProps {
  emailId: string | null;
  onClose: () => void;
}

export function EmailDetailDialog({ emailId, onClose }: EmailDetailDialogProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [category, setCategory] = useState<EmailCategory | null>(null);
  const [leadId, setLeadId] = useState<string>('');
  const [quotationId, setQuotationId] = useState<string>('');

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['company-email', emailId],
    queryFn: () => getCompanyEmail(emailId!),
    enabled: Boolean(emailId),
  });

  const { data: leadsData } = useQuery({
    queryKey: ['leads-picker'],
    queryFn: () => getLeads({ limit: 100 }),
    enabled: Boolean(emailId),
  });

  const { data: quotationsData } = useQuery({
    queryKey: ['quotations-picker'],
    queryFn: () => getQuotations({ limit: 100 }),
    enabled: Boolean(emailId),
  });

  useEffect(() => {
    if (!detail) return;
    setCategory(detail.email_category ?? null);
    setLeadId(detail.lead_id ?? '');
    setQuotationId(detail.quotation_id ?? '');
  }, [detail]);

  const categorizeMut = useMutation({
    mutationFn: (payload: {
      email_category: EmailCategory | null;
      lead_id?: string | null;
      quotation_id?: string | null;
    }) => categorizeCompanyEmail(emailId!, payload),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['company-emails'] });
      qc.invalidateQueries({ queryKey: ['company-email', emailId] });
      qc.invalidateQueries({ queryKey: ['email-stats'] });
      setCategory(updated.email_category ?? null);
      toast.success('Email categorized');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveCategory = (
    nextCategory: EmailCategory | null,
    opts?: { lead_id?: string | null; quotation_id?: string | null },
  ) => {
    setCategory(nextCategory);
    categorizeMut.mutate({
      email_category: nextCategory,
      lead_id: nextCategory === 'lead' ? (opts?.lead_id ?? (leadId || null)) : null,
      quotation_id:
        nextCategory === 'quotation' || nextCategory === 'followup'
          ? (opts?.quotation_id ?? (quotationId || null))
          : null,
    });
  };

  const leads = leadsData?.data ?? [];
  const quotations = (quotationsData as { data?: { id: string; quotation_number: string; enquiry_lead?: string }[] })?.data ?? [];

  return (
    <Dialog open={Boolean(emailId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] w-[min(96vw,56rem)] flex-col gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">
          {detail?.subject || 'Email details'}
        </DialogTitle>
        {detailLoading || !detail ? (
          <div className="flex min-h-[320px] items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-muted/30 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {detail.direction === 'outbound' ? (
                      <Badge variant="outline" className="gap-1 text-blue-600 border-blue-500/40">
                        <ArrowUpRight className="h-3 w-3" />
                        Sent
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/40">
                        <ArrowDownLeft className="h-3 w-3" />
                        Received
                      </Badge>
                    )}
                    {detail.has_attachments ? (
                      <Badge variant="secondary" className="gap-1">
                        <Paperclip className="h-3 w-3" />
                        Attachment
                      </Badge>
                    ) : null}
                    <EmailCategoryBadge category={category} />
                  </div>
                  <h2 className="text-lg font-semibold leading-snug pr-2">
                    {detail.subject || '(No subject)'}
                  </h2>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex items-start gap-2 rounded-lg bg-background/80 px-3 py-2">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="font-medium truncate">{detail.sender_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{detail.sender_email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-background/80 px-3 py-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Mailbox</p>
                    <p className="font-medium truncate">{detail.mailbox_email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-background/80 px-3 py-2 sm:col-span-2">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Received</p>
                    <p className="font-medium">{formatDate(detail.received_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Categorize */}
            <div className="shrink-0 border-b border-border px-5 py-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Categorize email
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = category === cat.id;
                  return (
                    <Button
                      key={cat.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={categorizeMut.isPending}
                      className={cn('gap-1.5', active && cat.activeClass)}
                      onClick={() => {
                        if (active) {
                          saveCategory(null);
                        } else {
                          setCategory(cat.id);
                          saveCategory(cat.id);
                        }
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </Button>
                  );
                })}
              </div>

              {category === 'lead' ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="text-sm text-muted-foreground shrink-0">Link to lead:</span>
                  <Select
                    value={leadId || 'none'}
                    onValueChange={(v) => {
                      const id = v === 'none' ? '' : v;
                      setLeadId(id);
                      saveCategory('lead', { lead_id: id || null });
                    }}
                  >
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Select a lead…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No lead selected</SelectItem>
                      {leads.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.lead_name}
                          {l.company_name ? ` · ${l.company_name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {category === 'quotation' || category === 'followup' ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="text-sm text-muted-foreground shrink-0">Link to quotation:</span>
                  <Select
                    value={quotationId || 'none'}
                    onValueChange={(v) => {
                      const id = v === 'none' ? '' : v;
                      setQuotationId(id);
                      saveCategory(category, { quotation_id: id || null });
                    }}
                  >
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Select a quotation…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No quotation selected</SelectItem>
                      {quotations.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.quotation_number}
                          {q.enquiry_lead ? ` · ${q.enquiry_lead}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {categorizeMut.isPending ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving…
                </p>
              ) : null}
            </div>

            {/* Body */}
            <ScrollArea className="min-h-0 flex-1 max-h-[min(52vh,520px)]">
              <div className="p-5">
                {detail.body_html ? (
                  <EmailHtmlFrame html={detail.body_html} />
                ) : (
                  <div className="rounded-lg border border-border bg-white px-5 py-4 text-sm leading-relaxed text-gray-900 shadow-sm">
                    <pre className="whitespace-pre-wrap font-sans">
                      {detail.body_text || detail.body_preview || 'No body content'}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>

            <Separator />

            {/* Footer */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-5 py-3">
              <div className="flex flex-wrap gap-2">
                {detail.lead_id ? (
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => router.push('/dashboard/leads')}>
                    <Target className="h-3.5 w-3.5" />
                    Open leads
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Button>
                ) : null}
                {detail.quotation_id ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => router.push(`/dashboard/quotations/${detail.quotation_id}`)}
                  >
                    <FileSearch className="h-3.5 w-3.5" />
                    Open quotation
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Button>
                ) : null}
              </div>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function EmailListMeta({ email }: { email: CompanyEmail }) {
  if (!email.email_category) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      <EmailCategoryBadge category={email.email_category} />
    </div>
  );
}
