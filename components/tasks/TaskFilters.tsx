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
import { TaskFilters as Filters } from '@/types/tasks';

interface TaskFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as Filters['status']),
      page: 1,
    });
  };

  const handleTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      task_type: value === 'all' ? undefined : (value as Filters['task_type']),
      page: 1,
    });
  };

  const handleSortChange = (value: string) => {
    if (value === 'none') {
      onFiltersChange({ ...filters, sort_by: undefined, sort_order: undefined });
    } else {
      const [sort_by, sort_order] = value.split('-');
      onFiltersChange({
        ...filters,
        sort_by: sort_by as Filters['sort_by'],
        sort_order: sort_order as Filters['sort_order'],
      });
    }
  };

  const handleClearFilters = () => {
    onFiltersChange({ page: 1, limit: 20 });
  };

  const hasActiveFilters = filters.search || filters.status || filters.task_type || filters.sort_by;

  const sortValue = filters.sort_by && filters.sort_order ? `${filters.sort_by}-${filters.sort_order}` : 'none';

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full md:w-[160px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="On Hold">On Hold</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
          <SelectItem value="Cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.task_type || 'all'} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-full md:w-[130px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="sales">Sales</SelectItem>
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
          <SelectItem value="due_date-desc">Due Date (Newest)</SelectItem>
          <SelectItem value="due_date-asc">Due Date (Oldest)</SelectItem>
          <SelectItem value="assigned_date-desc">Assigned Date (Newest)</SelectItem>
          <SelectItem value="assigned_date-asc">Assigned Date (Oldest)</SelectItem>
          <SelectItem value="task_title-asc">Title (A-Z)</SelectItem>
          <SelectItem value="task_title-desc">Title (Z-A)</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground">
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
}
