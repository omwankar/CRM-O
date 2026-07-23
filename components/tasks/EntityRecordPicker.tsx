'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { getLeads } from '@/lib/api/leads';
import { getOpportunities } from '@/lib/api/opportunities';
import { getEnquiries } from '@/lib/api/enquiries';
import { getQuotations } from '@/lib/api/quotations';
import { getBuyers } from '@/lib/api/buyers';
import { getVendors } from '@/lib/api/vendors';
import { getProjects } from '@/lib/api/projects';
import { getJobs } from '@/lib/api/jobs';
import { getPartnerships } from '@/lib/api/partnerships';
import { getInvoices } from '@/lib/api/invoices';
import { getContacts } from '@/lib/api/contacts';
import { getCompanies } from '@/lib/api/companies';
import type { TaskEntityType } from '@/types/tasks';
import { TASK_ENTITY_LABELS } from '@/types/tasks';

export type EntityPickerType = TaskEntityType | 'partnership';

export type EntityOption = { id: string; label: string; sub?: string };

function asList(res: unknown): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const r = res as Record<string, unknown>;
  if (Array.isArray(r.data)) return r.data;
  if (Array.isArray(r.projects)) return r.projects;
  if (Array.isArray(r.jobs)) return r.jobs;
  if (Array.isArray(r.partnerships)) return r.partnerships;
  if (Array.isArray(r.buyers)) return r.buyers;
  if (Array.isArray(r.vendors)) return r.vendors;
  if (Array.isArray(r.invoices)) return r.invoices;
  if (Array.isArray(r.contacts)) return r.contacts;
  if (Array.isArray(r.companies)) return r.companies;
  if (Array.isArray(r.quotations)) return r.quotations;
  return [];
}

async function searchEntityRecords(
  entityType: EntityPickerType,
  search: string,
): Promise<EntityOption[]> {
  const q = search.trim() || undefined;
  const limit = 25;

  switch (entityType) {
    case 'lead': {
      const res = await getLeads({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.lead_name || 'Lead',
        sub: [r.company_name, r.status].filter(Boolean).join(' · ') || undefined,
      }));
    }
    case 'opportunity': {
      const res = await getOpportunities({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.title || 'Opportunity',
        sub: [r.buyer?.buyer_name, r.stage?.replace(/_/g, ' ')].filter(Boolean).join(' · ') || undefined,
      }));
    }
    case 'enquiry': {
      const res = await getEnquiries({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.enquiry_number || r.title || 'Enquiry',
        sub: r.title && r.enquiry_number ? r.title : r.stage?.replace(/_/g, ' '),
      }));
    }
    case 'quotation': {
      const res = await getQuotations({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.quotation_number || 'Quotation',
        sub: r.enquiry_title || r.status?.replace(/_/g, ' '),
      }));
    }
    case 'buyer': {
      const res = await getBuyers({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.buyer_name || 'Buyer',
        sub: r.contact_email || r.industry || undefined,
      }));
    }
    case 'vendor': {
      const res = await getVendors({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.vendor_name || 'Vendor',
        sub: r.contact_email || r.vendor_type || undefined,
      }));
    }
    case 'project': {
      const res = await getProjects({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.project_name || r.project_id || 'Project',
        sub: r.project_id && r.project_name ? r.project_id : r.status || undefined,
      }));
    }
    case 'job': {
      const res = await getJobs({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.title || r.job_number || 'Job',
        sub: [r.job_number, r.origin && r.destination ? `${r.origin} → ${r.destination}` : null]
          .filter(Boolean)
          .join(' · ') || r.status || undefined,
      }));
    }
    case 'partnership': {
      const res = await getPartnerships({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.partner_company_name || r.partner_name || 'Partner',
        sub: r.partnership_type || r.partner_type || undefined,
      }));
    }
    case 'invoice': {
      const res = await getInvoices({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.invoice_number || 'Invoice',
        sub: [r.buyer?.buyer_name || r.buyer_name, r.status].filter(Boolean).join(' · ') || undefined,
      }));
    }
    case 'contact': {
      const res = await getContacts({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.full_name || 'Contact',
        sub: [r.company, r.email].filter(Boolean).join(' · ') || undefined,
      }));
    }
    case 'company': {
      const res = await getCompanies({ search: q, limit });
      return asList(res).map((r) => ({
        id: r.id,
        label: r.name || 'Company',
        sub: r.industry || undefined,
      }));
    }
    default:
      return [];
  }
}

type Props = {
  entityType: EntityPickerType;
  value: string;
  label?: string;
  onChange: (id: string, label: string) => void;
  disabled?: boolean;
};

export function EntityRecordPicker({ entityType, value, label, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setSearch('');
    setDebounced('');
  }, [entityType]);

  const { data: options = [], isFetching } = useQuery({
    queryKey: ['entity-record-picker', entityType, debounced],
    queryFn: () => searchEntityRecords(entityType, debounced),
    enabled: open && !!entityType,
    staleTime: 15_000,
  });

  const selectedLabel = useMemo(() => {
    if (label) return label;
    const hit = options.find((o) => o.id === value);
    return hit?.label || (value ? 'Selected record' : '');
  }, [label, options, value]);

  const typeLabel =
    entityType === 'partnership'
      ? 'Partner'
      : TASK_ENTITY_LABELS[entityType] || 'record';

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="mt-2 w-full justify-between font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ? selectedLabel : `Search ${typeLabel.toLowerCase()}…`}
          </span>
          {isFetching ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search by name or number…`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{isFetching ? 'Searching…' : `No ${typeLabel.toLowerCase()} found.`}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.id}
                  onSelect={() => {
                    onChange(opt.id, opt.label);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === opt.id ? 'opacity-100' : 'opacity-0')} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{opt.label}</p>
                    {opt.sub ? <p className="truncate text-xs text-muted-foreground">{opt.sub}</p> : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
