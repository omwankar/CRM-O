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
  const hasAny = !!(filters.status || filters.search || filters.from_deadline || filters.to_deadline);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotations..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
            className="pl-9"
          />
        </div>
      </div>

      <Select value={filters.status || 'all'} onValueChange={(v) => onChange({ ...filters, status: v === 'all' ? undefined : (v as QuotationStatus) })}>
        <SelectTrigger className="w-full md:w-[220px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="waiting_from_companies">Waiting from Companies</SelectItem>
          <SelectItem value="need_revision">Need Revision</SelectItem>
          <SelectItem value="quote_given">Quote Given</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={filters.from_deadline || ''}
          onChange={(e) => onChange({ ...filters, from_deadline: e.target.value || undefined })}
          className="w-full md:w-[160px]"
        />
        <Input
          type="date"
          value={filters.to_deadline || ''}
          onChange={(e) => onChange({ ...filters, to_deadline: e.target.value || undefined })}
          className="w-full md:w-[160px]"
        />
      </div>

      {hasAny && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({})}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
}

