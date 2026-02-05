'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskList } from '@/components/projects/task-list';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
  });

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive p-6 text-center">
        <p className="text-destructive">Failed to load project</p>
      </div>
    );
  }

  const { project, tasks } = data;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            <Badge variant={STATUS_VARIANTS[project.status as keyof typeof STATUS_VARIANTS]}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercent}%</div>
            <Progress value={progressPercent} className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {completedTasks} of {tasks.length} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${DIFFICULTY_COLORS[project.difficulty as keyof typeof DIFFICULTY_COLORS]}`}
              />
              <span className="text-lg font-medium capitalize">{project.difficulty}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            Complete tasks in order to progress through the project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskList tasks={tasks} currentTaskId={project.currentTaskId} />
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-5 w-96" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
