import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import type { ProjectListItem } from '@codementor/shared';

interface ProjectCardProps {
  project: ProjectListItem;
}

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500',
} as const;

const STATUS_VARIANTS = {
  not_started: 'secondary',
  in_progress: 'default',
  completed: 'success',
  abandoned: 'outline',
} as const;

export function ProjectCard({ project }: ProjectCardProps) {
  const progressPercent =
    project.tasks.total > 0 ? Math.round((project.tasks.completed / project.tasks.total) * 100) : 0;

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="h-full transition-colors hover:border-primary">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-base">{project.title}</CardTitle>
            <Badge variant={STATUS_VARIANTS[project.status]}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${DIFFICULTY_COLORS[project.difficulty]}`} />
            <span className="capitalize">{project.difficulty}</span>
            <span className="mx-2">|</span>
            <Calendar className="h-3 w-3" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">
                {project.tasks.completed}/{project.tasks.total} tasks
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
