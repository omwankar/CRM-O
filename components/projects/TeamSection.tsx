import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Shield, Edit, Eye } from 'lucide-react';
import { ProjectEmployee } from '@/types/projects';

interface TeamSectionProps {
  employees: ProjectEmployee[];
  userRole?: 'admin' | 'assigned' | 'operations' | 'sales';
  canEdit?: boolean;
  onRemoveEmployee?: (userId: string) => void;
  onAddEmployee?: () => void;
  onChangeRole?: (userId: string, newRole: string) => void;
}

const roleConfig = {
  admin: {
    label: 'Full edit',
    color: 'bg-red-500/10 text-red-700 dark:text-red-400',
    icon: Shield,
  },
  assigned: {
    label: 'Edit + notifications',
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    icon: Edit,
  },
  operations: {
    label: 'View only',
    color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400',
    icon: Eye,
  },
  sales: {
    label: 'View only',
    color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400',
    icon: Eye,
  },
};

export function TeamSection({
  employees,
  userRole,
  canEdit = false,
  onRemoveEmployee,
  onAddEmployee,
  onChangeRole,
}: TeamSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] font-medium text-foreground">Team Members</h4>
        {canEdit && onAddEmployee && (
          <Button variant="ghost" size="sm" onClick={onAddEmployee}>
            Add Member
          </Button>
        )}
      </div>

      {employees.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">No team members assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {employees.map((employee) => {
            const config = roleConfig[employee.role];
            const Icon = config.icon;

            return (
              <div
                key={employee.id}
                className="flex items-center gap-3 p-2 rounded-lg border-[0.5px] border-border bg-muted/20"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-[12px] font-medium">
                    {employee.avatar_initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">
                    {employee.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {employee.email}
                  </p>
                </div>

                <Badge className={config.color}>
                  <Icon className="h-3 w-3 mr-1" />
                  {employee.role}
                </Badge>

                {canEdit && onRemoveEmployee && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => onRemoveEmployee(employee.user_id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canEdit && onChangeRole && (
        <p className="text-[11px] text-muted-foreground">
          Admin can change member roles via inline dropdown
        </p>
      )}
    </div>
  );
}
