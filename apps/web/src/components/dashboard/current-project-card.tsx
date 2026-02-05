import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface CurrentProjectCardProps {
  project: {
    id: string;
    title: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    status: 'not_started' | 'in_progress';
  };
  currentTask: {
    id: string;
    title: string;
    order: number;
  } | null;
  tasks: {
    total: number;
    completed: number;
  };
}

const difficultyColors = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500',
} as const;

export function CurrentProjectCard({ project, currentTask, tasks }: CurrentProjectCardProps) {
  const progressPercent = tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{project.title}</CardTitle>
            <CardDescription className="mt-1">
              Task {currentTask?.order ?? '-'} of {tasks.total}
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            <span
              className={`mr-1.5 inline-block h-2 w-2 rounded-full ${difficultyColors[project.difficulty]}`}
            />
            {project.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>

        {currentTask && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">Current Task</p>
            <p className="mt-1 text-sm text-muted-foreground">{currentTask.title}</p>
          </div>
        )}

        <Link href={`/dashboard/projects/${project.id}`}>
          <Button className="w-full" variant="outline">
            View Project
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
