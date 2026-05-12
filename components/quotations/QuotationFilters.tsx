'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import type { QuotationStatus } from '@/types/quotations';

export interface QuotationFiltersState {
  status?: QuotationStatus;
  search?: string;
  from_deadline?: string;
  to_deadline?: string;
}

export function QuotationFilters({
  filters,
  onChange,
}: {
  filters: QuotationFiltersState;
  onChange: (next: QuotationFiltersState) => void;
}) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = searchInput.trim() || undefined;
      if (next === (filtersRef.current.search || undefined)) return;
      onChange({ ...filtersRef.current, search: next });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput, onChange]);

  const hasAny = !!(filters.status || filters.search || filters.from_deadline || filters.to_deadline);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by enquiry ID, title, customer, or requirement..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Select value={filters.status || 'all'} onValueChange={(v) => onChange({ ...filters, status: v === 'all' ? undefined : (v as QuotationStatus) })}>
        <SelectTrigger className="w-full md:w-[220px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="waiting_from_companies">Waiting from companies</SelectItem>
          <SelectItem value="need_revision">Need revision</SelectItem>
          <SelectItem value="quote_given">Quote given</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          aria-label="Deadline from"
          value={filters.from_deadline || ''}
          onChange={(e) => onChange({ ...filters, from_deadline: e.target.value || undefined })}
          className="w-full md:w-[160px]"
        />
        <Input
          type="date"
          aria-label="Deadline to"
          value={filters.to_deadline || ''}
          onChange={(e) => onChange({ ...filters, to_deadline: e.target.value || undefined })}
          className="w-full md:w-[160px]"
        />
      </div>

      {hasAny ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchInput('');
            onChange({});
          }}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
