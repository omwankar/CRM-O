import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { ProjectFilters as Filters } from '@/types/projects';

interface ProjectFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function ProjectFilters({ filters, onFiltersChange }: ProjectFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as any),
      page: 1,
    });
  };

  const handleSortChange = (value: string) => {
    if (value === 'none') {
      onFiltersChange({ ...filters, sort_by: undefined, sort_order: undefined });
    } else {
      const [sort_by, sort_order] = value.split('-');
      onFiltersChange({ ...filters, sort_by: sort_by as any, sort_order: sort_order as any });
    }
  };

  const handleClearFilters = () => {
    onFiltersChange({ page: 1, limit: 20 });
  };

  const hasActiveFilters = filters.search || filters.status || filters.start_date || filters.end_date || filters.sort_by;

  const sortValue = filters.sort_by && filters.sort_order ? `${filters.sort_by}-${filters.sort_order}` : 'none';

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Select
        value={filters.status || 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Planned">Planned</SelectItem>
          <SelectItem value="On Hold">On Hold</SelectItem>
          <SelectItem value="Closed">Completed</SelectItem>
          <SelectItem value="Cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortValue} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="created_at-desc">Date Created (Newest)</SelectItem>
          <SelectItem value="created_at-asc">Date Created (Oldest)</SelectItem>
          <SelectItem value="start_date-desc">Start Date (Newest)</SelectItem>
          <SelectItem value="start_date-asc">Start Date (Oldest)</SelectItem>
          <SelectItem value="estimated_end_date-desc">End Date (Newest)</SelectItem>
          <SelectItem value="estimated_end_date-asc">End Date (Oldest)</SelectItem>
          <SelectItem value="project_name-asc">Name (A-Z)</SelectItem>
          <SelectItem value="project_name-desc">Name (Z-A)</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
}
