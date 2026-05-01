import { Card } from '@/components/ui/card';
import { ProjectStatusPill } from './ProjectStatusPill';
import { Project } from '@/types/projects';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  return (
    <Card className="surface-card p-5 cursor-pointer transition-all duration-150 hover:border-border/60 active:scale-[0.98]">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-[15px] font-medium text-foreground mb-1">
              {project.project_name}
            </h3>
            <code className="text-[11px] text-muted-foreground">
              {project.project_id}
            </code>
          </div>
          <ProjectStatusPill status={project.status} />
        </div>

        {/* Contact Info */}
        <div className="space-y-1">
          <p className="text-[13px] text-foreground">
            {project.contact_person}
          </p>
          {project.contact_email && (
            <p className="text-[12px] text-muted-foreground">
              {project.contact_email}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
          {project.start_date && (
            <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
          )}
          {project.estimated_end_date && (
            <span>End: {new Date(project.estimated_end_date).toLocaleDateString()}</span>
          )}
        </div>

        {/* Avatar Stack */}
        {project.employees && project.employees.length > 0 && (
          <div className="flex items-center -space-x-2">
            {project.employees.slice(0, 4).map((employee) => (
              <Avatar key={employee.id} className="h-7 w-7 border-2 border-background">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {employee.avatar_initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.employees.length > 4 && (
              <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-foreground">
                +{project.employees.length - 4}
              </div>
            )}
          </div>
        )}

        {/* View Button */}
        <Button
          variant="ghost"
          className="w-full justify-between group"
          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
        >
          <span className="text-[13px]">View Details</span>
          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </div>
    </Card>
  );
}
